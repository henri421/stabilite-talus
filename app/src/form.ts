/**
 * La saisie, en chaines, et sa conversion en donnees du noyau. PUR.
 *
 * Une seule saisie pour les deux generations : basculer de l'une a l'autre ne
 * change aucune valeur saisie. Les champs propres a une generation restent saisis
 * quand l'autre est active ; le noyau ne lit que ceux de la generation retenue.
 */

import { lireNombre } from 'aedificium-ui';
import { combinaisonsStabilite1g, combinaisonsStabilite2g, profil1g, profil2g, profilAnb2022 } from 'sol-ec7';
import type { Approche, ClasseConsequences, CombinaisonStabilite, Risque } from 'sol-ec7';
import { verifierTalus, type DonneesTalus, type ResultatTalus } from '../../src/talus';
import { textes } from './textes';

export type Generation = '1re' | '2e';

/** Un point saisi, en texte (virgule decimale acceptee). */
export interface PointSaisi {
  x: string;
  y: string;
}

/** Une couche saisie : les champs du comportement non retenu restent saisis mais ne sont pas lus. */
export interface CoucheSaisie {
  nom: string;
  drainage: 'draine' | 'non_draine';
  base: string;
  gamma: string;
  gammaSat: string;
  phi: string;
  c: string;
  cu: string;
}

export interface BandeSaisie {
  x0: string;
  x1: string;
  q: string;
  nature: 'G' | 'Q';
}

/** Une seule saisie pour les deux generations : tout est du texte, sauf les choix et les listes. */
export interface Saisie {
  generation: Generation;
  profilNormatif: 'recommande' | 'anb2022';
  risque: Risque;
  approche1: Approche;
  consequences: ClasseConsequences;
  profil: PointSaisi[];
  couches: CoucheSaisie[];
  avecNappe: boolean;
  piezo: PointSaisi[];
  bandes: BandeSaisie[];
  modeCercle: 'recherche' | 'impose';
  /** Recherche : cote sous laquelle le cercle ne descend pas ; vide, pas de limite. */
  coteLimite: string;
  xc: string;
  yc: string;
  R: string;
}

export interface Calcul {
  donnees: DonneesTalus;
}

export type Lecture = { ok: true; calcul: Calcul } | { ok: false; message: string };

/** Le resultat du noyau, avec la generation et les coefficients de chaque combinaison. */
export type Resultat = ResultatTalus & { generation: Generation; coefficients: CombinaisonStabilite[] };

type Point = DonneesTalus['profil'][number];
type CoucheTalus = DonneesTalus['couches'][number];
type BandeTalus = DonneesTalus['bandes'][number];
type Cercle = NonNullable<DonneesTalus['cercle']>;

export function saisieParDefaut(): Saisie {
  return {
    generation: '1re',
    profilNormatif: 'recommande',
    risque: 'normal',
    approche1: 'DA1',
    consequences: 'CC2',
    profil: [
      { x: '-25', y: '10' },
      { x: '0', y: '10' },
      { x: '15', y: '0' },
      { x: '40', y: '0' },
    ],
    couches: [
      { nom: 'Limon', drainage: 'draine', base: '4', gamma: '19', gammaSat: '20', phi: '30', c: '10', cu: '' },
      { nom: 'Argile', drainage: 'non_draine', base: '-40', gamma: '20', gammaSat: '21', phi: '', c: '', cu: '60' },
    ],
    avecNappe: true,
    piezo: [
      { x: '-25', y: '7' },
      { x: '0', y: '7' },
      { x: '15', y: '0' },
      { x: '40', y: '0' },
    ],
    bandes: [],
    modeCercle: 'recherche',
    coteLimite: '-10',
    xc: '5',
    yc: '18',
    R: '20',
  };
}

class Refus extends Error {}

/** Lit un nombre, ou refuse en nommant le contexte (liste, rang, couche, champ). */
function nb(brut: string, contexte: string): number {
  const v = lireNombre(brut);
  if (v === null) throw new Refus(textes().refus.nombre(contexte, brut));
  return v;
}

function lirePoints(points: PointSaisi[], liste: string): Point[] {
  const r = textes().refus;
  return points.map((p, i) => ({
    x: nb(p.x, r.point(liste, i + 1, 'x')),
    y: nb(p.y, r.point(liste, i + 1, 'y')),
  }));
}

function lireCouche(c: CoucheSaisie, rang: number): CoucheTalus {
  const r = textes().refus;
  const nom = c.nom.trim() === '' ? r.coucheSansNom(rang) : c.nom.trim();
  const ctx = (champ: string): string => r.couche(nom, champ);
  const champs = r.champsCouche;
  const commun = {
    nom,
    base: nb(c.base, ctx(champs.base)),
    gamma: nb(c.gamma, ctx(champs.gamma)),
    gammaSat: nb(c.gammaSat, ctx(champs.gammaSat)),
  };
  if (c.drainage === 'draine') {
    const phiDeg = nb(c.phi, ctx(champs.phi));
    if (!(phiDeg > 0 && phiDeg < 90)) {
      throw new Refus(r.phi(nom, c.phi));
    }
    return { ...commun, drainage: 'draine', phiDeg, c: nb(c.c, ctx(champs.c)) };
  }
  const cu = nb(c.cu, ctx(champs.cu));
  if (cu <= 0) throw new Refus(r.cu(nom, c.cu));
  return { ...commun, drainage: 'non_draine', cu };
}

function lireBande(b: BandeSaisie, rang: number): BandeTalus {
  const r = textes().refus;
  const ctx = (champ: string): string => r.bande(rang, champ);
  return {
    x0: nb(b.x0, ctx(r.champsBande.x0)),
    x1: nb(b.x1, ctx(r.champsBande.x1)),
    q: nb(b.q, ctx(r.champsBande.q)),
    nature: b.nature,
  };
}

/** Convertit la saisie ; refuse en nommant le premier champ illisible. */
export function lireSaisie(s: Saisie): Lecture {
  try {
    const r = textes().refus;
    const profil = lirePoints(s.profil, r.listes.profil);
    const couches = s.couches.map((c, i) => lireCouche(c, i + 1));
    const piezo = s.avecNappe ? lirePoints(s.piezo, r.listes.piezo) : null;
    const bandes = s.bandes.map((b, i) => lireBande(b, i + 1));

    let cercle: Cercle | null = null;
    let coteLimite: number | undefined;
    if (s.modeCercle === 'impose') {
      cercle = {
        xc: nb(s.xc, r.cercle(r.champsCercle.xc)),
        yc: nb(s.yc, r.cercle(r.champsCercle.yc)),
        R: nb(s.R, r.cercle(r.champsCercle.R)),
      };
    } else if (s.coteLimite.trim() !== '') {
      coteLimite = nb(s.coteLimite, r.cote);
    }

    // ANB 2022 : l'approche est DA1, quelle que soit la liste.
    const approche: Approche = s.profilNormatif === 'anb2022' ? 'DA1' : s.approche1;

    const donnees: DonneesTalus = {
      generation: s.generation,
      profilNormatif: s.profilNormatif,
      risque: s.risque,
      approche,
      cc: s.consequences,
      profil,
      couches,
      piezo,
      bandes,
      cercle,
      coteLimite,
    };
    return { ok: true, calcul: { donnees } };
  } catch (e) {
    if (e instanceof Refus) return { ok: false, message: e.message };
    throw e;
  }
}

/**
 * Verification du talus, puis coefficients de chaque combinaison (leurs sources
 * viennent du noyau). Leve si le noyau refuse la saisie ; le message est celui du noyau.
 */
export function verifier(calcul: Calcul): Resultat {
  const d = calcul.donnees;
  const coefficients =
    d.generation === '2e'
      ? combinaisonsStabilite2g(d.cc, profil2g())
      : combinaisonsStabilite1g(d.approche, d.profilNormatif === 'anb2022' ? profilAnb2022(d.risque) : profil1g());
  return { ...verifierTalus(d), generation: d.generation, coefficients };
}

/** Nombre a la francaise : virgule decimale, sans zero inutile, 12 chiffres significatifs au plus. */
function nombreTexte(v: number): string {
  return String(Number(v.toPrecision(12))).replace('.', ',');
}

/**
 * « Talus type » : profil d'un talus de hauteur H (m), d'inclinaison n horizontal pour 1 vertical,
 * avec une crete et un pied horizontaux de longueurs donnees ; la crete finit en x = 0, a la cote H,
 * le pied commence a la cote 0. Nombres ecrits a la francaise, sans zero inutile.
 */
export function talusType(H: number, n: number, crete: number, pied: number): PointSaisi[] {
  return [
    { x: nombreTexte(-crete), y: nombreTexte(H) },
    { x: nombreTexte(0), y: nombreTexte(H) },
    { x: nombreTexte(n * H), y: nombreTexte(0) },
    { x: nombreTexte(n * H + pied), y: nombreTexte(0) },
  ];
}

/** « Horizontale » : ligne piezometrique a la cote y, sur l'emprise en x du profil saisi. */
export function nappeHorizontale(y: string, profil: PointSaisi[]): PointSaisi[] {
  if (profil.length === 0) return [];
  return [
    { x: profil[0].x, y },
    { x: profil[profil.length - 1].x, y },
  ];
}

const FORMAT = 'stabilite-talus/1';

export function serialiser(s: Saisie): string {
  return JSON.stringify({ format: FORMAT, ...s }, null, 2);
}

function texteOu(valeur: unknown, defaut: string): string {
  return typeof valeur === 'string' ? valeur : defaut;
}

function boolOu(valeur: unknown, defaut: boolean): boolean {
  return typeof valeur === 'boolean' ? valeur : defaut;
}

function choixOu<T extends string>(valeur: unknown, autorisees: readonly T[], defaut: T): T {
  return typeof valeur === 'string' && (autorisees as readonly string[]).includes(valeur) ? (valeur as T) : defaut;
}

/** Un point valide a deux textes ; un autre element de liste est ecarte. */
function pointsOu(valeur: unknown, defaut: PointSaisi[]): PointSaisi[] {
  if (!Array.isArray(valeur)) return defaut;
  return valeur.flatMap((p: unknown) => {
    if (typeof p !== 'object' || p === null) return [];
    const o = p as Record<string, unknown>;
    return typeof o.x === 'string' && typeof o.y === 'string' ? [{ x: o.x, y: o.y }] : [];
  });
}

/** Une couche valide a tous ses textes ; le drainage inconnu prend la valeur par defaut. */
function coucheOu(valeur: unknown): CoucheSaisie | null {
  if (typeof valeur !== 'object' || valeur === null) return null;
  const o = valeur as Record<string, unknown>;
  const { nom, base, gamma, gammaSat, phi, c, cu } = o;
  if (
    typeof nom !== 'string' ||
    typeof base !== 'string' ||
    typeof gamma !== 'string' ||
    typeof gammaSat !== 'string' ||
    typeof phi !== 'string' ||
    typeof c !== 'string' ||
    typeof cu !== 'string'
  ) {
    return null;
  }
  return {
    nom,
    drainage: choixOu(o.drainage, ['draine', 'non_draine'] as const, 'draine'),
    base,
    gamma,
    gammaSat,
    phi,
    c,
    cu,
  };
}

/** Une surcharge valide a ses trois nombres en texte ; la nature inconnue devient G. */
function bandeOu(valeur: unknown): BandeSaisie | null {
  if (typeof valeur !== 'object' || valeur === null) return null;
  const o = valeur as Record<string, unknown>;
  const { x0, x1, q } = o;
  if (typeof x0 !== 'string' || typeof x1 !== 'string' || typeof q !== 'string') return null;
  return { x0, x1, q, nature: choixOu(o.nature, ['G', 'Q'] as const, 'G') };
}

/** Relit un document enregistre ; les champs absents prennent leur valeur par defaut. */
export function relire(contenu: string): Saisie {
  const brut = JSON.parse(contenu) as Record<string, unknown>;
  if (brut.format !== FORMAT) {
    throw new Error(textes().refus.format(String(brut.format), FORMAT));
  }

  const d = saisieParDefaut();
  const couches = Array.isArray(brut.couches)
    ? brut.couches.flatMap((valeur: unknown) => {
        const couche = coucheOu(valeur);
        return couche === null ? [] : [couche];
      })
    : d.couches;
  const bandes = Array.isArray(brut.bandes)
    ? brut.bandes.flatMap((valeur: unknown) => {
        const bande = bandeOu(valeur);
        return bande === null ? [] : [bande];
      })
    : d.bandes;

  return {
    generation: choixOu(brut.generation, ['1re', '2e'] as const, d.generation),
    profilNormatif: choixOu(brut.profilNormatif, ['recommande', 'anb2022'] as const, d.profilNormatif),
    risque: choixOu(brut.risque, ['faible', 'normal', 'eleve'] as const, d.risque),
    approche1: choixOu(brut.approche1, ['DA1', 'DA2', 'DA3'] as const, d.approche1),
    consequences: choixOu(brut.consequences, ['CC1', 'CC2', 'CC3'] as const, d.consequences),
    profil: pointsOu(brut.profil, d.profil),
    couches,
    avecNappe: boolOu(brut.avecNappe, d.avecNappe),
    piezo: pointsOu(brut.piezo, d.piezo),
    bandes,
    modeCercle: choixOu(brut.modeCercle, ['recherche', 'impose'] as const, d.modeCercle),
    coteLimite: texteOu(brut.coteLimite, d.coteLimite),
    xc: texteOu(brut.xc, d.xc),
    yc: texteOu(brut.yc, d.yc),
    R: texteOu(brut.R, d.R),
  };
}
