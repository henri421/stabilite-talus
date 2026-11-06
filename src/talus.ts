/**
Noyau de l'outil stabilite-talus : assemble la saisie (degres, couches, profil normatif)
et les coefficients de sol-ec7 pour verifier la stabilite generale d'un talus par la
methode de Bishop simplifiee (EN 1997-1:2004, section 11 et annexe A ; EN 1997-3:2025,
4.6.3). Noyau pur : l'interface ne calcule rien.

Unites : m, kN/m, kPa, kN/m3 ; angles en degres dans DonneesTalus (radians dans sol-ec7).
x horizontal croissant, y altitude.

L'outil CONSTATE et ne PRESCRIT PAS : il rend des taux de travail, sans seuil de
conformite autre que taux <= 1 pour chaque combinaison, et ne propose ni cercle ni detail.
*/
import {
  analyserCercle,
  combinaisonsStabilite1g,
  combinaisonsStabilite2g,
  profil1g,
  profil2g,
  profilAnb2022,
  rechercherCercleCritique,
} from 'sol-ec7';
import type {
  Approche,
  Bande,
  Cercle,
  ClasseConsequences,
  CombinaisonStabilite,
  CoucheTalus,
  DonneesBishop,
  Point,
  ResultatCercle,
  Risque,
} from 'sol-ec7';

/** Poids volumique de l'eau (kN/m3) : valeur usuelle de l'EN 1997-1, modifiable plus tard. */
const GAMMA_W = 9.81;
/** Nombre de tranches, le meme pour la recherche et pour le cercle rendu. */
const NB_TRANCHES = 50;

/** Couche saisie en degres, cotes de base du haut vers le bas. */
export interface CoucheSaisie {
  nom: string;
  base: number;
  gamma: number;
  gammaSat: number;
  drainage: 'draine' | 'non_draine';
  phiDeg?: number;
  c?: number;
  cu?: number;
}

export interface DonneesTalus {
  generation: '1re' | '2e';
  /** 1re generation : profil de coefficients. */
  profilNormatif: 'recommande' | 'anb2022';
  risque: Risque;
  approche: Approche;
  /** 2e generation : classe de consequences. */
  cc: ClasseConsequences;
  profil: Point[];
  couches: CoucheSaisie[];
  piezo: Point[] | null;
  bandes: Bande[];
  /** Cercle impose ; null : recherche du cercle critique pour chaque combinaison. */
  cercle: Cercle | null;
  coteLimite?: number;
}

export interface ResultatCombinaison {
  nom: string;
  cercle: Cercle;
  F: number;
  taux: number;
  conforme: boolean;
  resultat: Extract<ResultatCercle, { valide: true }>;
}

export interface ResultatTalus {
  /** Nom du profil de coefficients. */
  profil: string;
  /** Coefficients a 1, sans verdict. */
  caracteristique: { cercle: Cercle; F: number };
  combinaisons: ResultatCombinaison[];
  gouvernant: string;
  tauxMax: number;
  /** Avertissements de tous les cercles rendus, sans doublon. */
  alertes: string[];
}

/**
 * Passe une couche aux unites de sol-ec7 : phi converti en radians. L'angle hors de
 * ]0 ; 90[ degres est refuse ici, avant conversion, avec le signe phi.
 */
function versCouche(c: CoucheSaisie): CoucheTalus {
  const commun = { nom: c.nom, base: c.base, gamma: c.gamma, gammaSat: c.gammaSat, drainage: c.drainage };
  if (c.drainage === 'draine') {
    if (c.phiDeg !== undefined && !(c.phiDeg > 0 && c.phiDeg < 90)) {
      throw new Error(`L'angle de frottement φ' de la couche ${c.nom} doit être dans ]0 ; 90[ (degrés).`);
    }
    return { ...commun, phi: c.phiDeg === undefined ? undefined : (c.phiDeg * Math.PI) / 180, c: c.c };
  }
  return { ...commun, cu: c.cu };
}

/** Profil de coefficients et combinaisons de stabilite generale. Leve si l'approche est refusee. */
function choisirProfil(d: DonneesTalus): { profil: string; combinaisons: CombinaisonStabilite[] } {
  if (d.generation === '2e') {
    const p = profil2g();
    return { profil: p.nom, combinaisons: combinaisonsStabilite2g(d.cc, p) };
  }
  // ANB 2022 : DA1 imposee, combinaisonsStabilite1g leve si l'approche saisie est autre.
  const p = d.profilNormatif === 'anb2022' ? profilAnb2022(d.risque) : profil1g();
  return { profil: p.nom, combinaisons: combinaisonsStabilite1g(d.approche, p) };
}

/** Coefficients a 1 : valeurs caracteristiques, sans verdict. Une action variable favorable reste non prise en compte. */
function combinaisonCaracteristique(): CombinaisonStabilite {
  const source = 'valeur caractéristique, coefficient à 1';
  const un = { valeur: 1, source };
  return {
    nom: 'caracteristique',
    mode: 'actions',
    actions: {
      gG_dst: un,
      gG_stb: un,
      gQ_dst: un,
      gQ_stb: { valeur: 0, source: `${source} ; action variable favorable non comptée` },
    },
    sol: { gPhi: un, gC: un, gCu: un },
    gRe: un,
  };
}

type Solution = { cercle: Cercle; resultat: Extract<ResultatCercle, { valide: true }> };

/**
 * Stabilite sur le cercle impose (leve si invalide, avec le motif), ou sur le cercle
 * critique de la combinaison (leve si la recherche n'aboutit).
 */
function solution(donnees: DonneesBishop, imposé: Cercle | null, coteLimite: number | undefined): Solution {
  if (imposé) {
    const r = analyserCercle(donnees, imposé);
    if (!r.valide) {
      throw new Error(`Le cercle imposé est invalide pour ${donnees.combinaison.nom} : ${r.motif}.`);
    }
    return { cercle: imposé, resultat: r };
  }
  const options = coteLimite === undefined ? {} : { coteLimite };
  const t = rechercherCercleCritique(donnees, options);
  if (!t) {
    throw new Error(
      `Aucun cercle valide trouvé pour la combinaison ${donnees.combinaison.nom} : vérifier le profil, les couches et la cote limite.`
    );
  }
  return { cercle: t.cercle, resultat: t.resultat };
}

/**
 * Verification de stabilite generale d'un talus : coefficients a 1 (caracteristique),
 * puis chaque combinaison du profil normatif. Taux = gamma_R;e / F, conforme si taux <= 1.
 * Leve si le cercle impose est invalide (message contenant le mot cercle, et le motif) ou
 * si une recherche n'aboutit pas, et sur toute saisie incoherente (message en francais).
 */
export function verifierTalus(d: DonneesTalus): ResultatTalus {
  const couches = d.couches.map(versCouche);
  const { profil, combinaisons } = choisirProfil(d);
  const donnees = (combinaison: CombinaisonStabilite): DonneesBishop => ({
    profil: d.profil,
    couches,
    piezo: d.piezo,
    gammaW: GAMMA_W,
    bandes: d.bandes,
    combinaison,
    nbTranches: NB_TRANCHES,
  });

  const alertes: string[] = [];
  const ajouterAlertes = (avertissements: string[]): void => {
    for (const a of avertissements) {
      if (!alertes.includes(a)) alertes.push(a);
    }
  };

  const caracteristique = solution(donnees(combinaisonCaracteristique()), d.cercle, d.coteLimite);
  ajouterAlertes(caracteristique.resultat.avertissements);

  const resultats: ResultatCombinaison[] = combinaisons.map((comb) => {
    const s = solution(donnees(comb), d.cercle, d.coteLimite);
    ajouterAlertes(s.resultat.avertissements);
    const taux = s.resultat.taux;
    return {
      nom: comb.nom,
      cercle: s.cercle,
      F: s.resultat.F,
      taux,
      conforme: taux <= 1,
      resultat: s.resultat,
    };
  });

  // Le gouvernant est la combinaison de taux le plus eleve ; au premier rang en cas d'egalite.
  const gouvernant = resultats.reduce((a, b) => (b.taux > a.taux ? b : a));

  return {
    profil,
    caracteristique: { cercle: caracteristique.cercle, F: caracteristique.resultat.F },
    combinaisons: resultats,
    gouvernant: gouvernant.nom,
    tauxMax: gouvernant.taux,
    alertes,
  };
}
