/**
 * Rendu HTML des verdicts, volets, tranches et blocs du resultat. PUR : aucun calcul ici, sauf les
 * presentations (angles en degres, largeurs de jauge bornees). Tout vient du resultat du noyau
 * (`form.ts`) ou de la saisie lue (`Calcul`).
 */

import { type BlocResultat, echapper, nombreAffiche, notationHtml, tauxAffiche } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';
import { phrase, ponctuer, textes } from './textes';

type Combinaison = Resultat['combinaisons'][number];
type Tranche = Combinaison['resultat']['tranches'][number];
interface Coefficient {
  valeur: number;
  source: string;
}

/** Nombre affiche ; une valeur non finie ne sort jamais en clair. */
const aff = (v: number, d = 1): string => (Number.isFinite(v) ? nombreAffiche(v, d) : textes().vue.nonCalculable);
const taux = (v: number): string => (Number.isFinite(v) ? tauxAffiche(v) : textes().vue.nonCalculable);
const sym = (s: string): string => notationHtml(s);
/** Texte du noyau ou de la saisie, traduit au besoin, echappe pour le HTML. */
const texte = (s: string): string => echapper(phrase(s));

/** Largeur de jauge, bornee a 100 ; 100 pour un taux infini, 0 pour NaN. */
function largeur(t: number): string {
  if (Number.isNaN(t)) return '0';
  if (!Number.isFinite(t)) return t > 0 ? '100' : '0';
  return String(Math.min(100, Math.max(0, Math.round(t * 1000) / 10)));
}

/** Angle de la base, en degres (presentation seule). */
const degres = (rad: number): number => (rad * 180) / Math.PI;

/** Entrees d'un objet de coefficients, sans type d'index. */
const entrees = (o: object): [string, Coefficient][] => Object.entries(o) as [string, Coefficient][];

/** Coefficient gamma_R;e d'une combinaison, ou undefined si le noyau ne le rend pas. */
function gammaRe(r: Resultat, nom: string): number | undefined {
  return r.coefficients.find((c) => c.nom === nom)?.gRe.valeur;
}

/** Clause de la carte : 1re ou 2e generation. */
const clause = (r: Resultat): string => (r.generation === '2e' ? textes().vue.clauses.generation2 : textes().vue.clauses.generation1);

/** Carte d'une combinaison : F_d, taux, cercle, gouvernante. Un taux au-dela de 1 est marque. */
function carteCombinaison(r: Resultat, c: Combinaison): string {
  const t = textes().vue;
  const cer = c.cercle;
  const g = gammaRe(r, c.nom);
  const gouv = c.nom === r.gouvernant ? ` <span class="gouvernant">${t.gouvernant}</span>` : '';
  const depasse = !(c.taux <= 1);
  const ref = g === undefined ? '' : `γ<sub>R;e</sub> = ${aff(g, 2)}, `;
  const detail = `F<sub>d</sub> = ${aff(c.F, 3)} ; ${ref}${t.cercle(aff(cer.xc, 2), aff(cer.yc, 2), aff(cer.R, 1))}`;
  return (
    `<div class="verdict${depasse ? ' depasse' : ''}" data-verification="${echapper(c.nom)}">` +
    `<h3>${texte(c.nom)}${gouv} <span class="clause">${clause(r)}</span></h3>` +
    `<div class="jauge"><i style="width:${largeur(c.taux)}%"></i></div>` +
    `<span class="taux">${taux(c.taux)}</span>` +
    `<p>${ponctuer(detail)}</p></div>`
  );
}

/** Carte du F caracteristique : sans jauge ni seuil, a titre indicatif. */
function carteCaracteristique(r: Resultat): string {
  const t = textes().vue;
  const k = r.caracteristique;
  const detail = `F = ${aff(k.F, 3)}, ${t.cercle(aff(k.cercle.xc, 2), aff(k.cercle.yc, 2), aff(k.cercle.R, 1))}`;
  return (
    `<div class="verdict constat" data-verification="caracteristique">` +
    `<h3>${t.caracteristique.titre} <span class="clause">${t.caracteristique.clause}</span></h3>` +
    `<p>${ponctuer(detail)}</p>` +
    `<p class="note">${t.caracteristique.note}</p></div>`
  );
}

/** Verdicts : groupe de stabilite (une carte par combinaison) et groupe indicatif (F caracteristique). */
export function verdictsHtml(r: Resultat): string {
  const t = textes().vue;
  const cartes = r.combinaisons.map((c) => carteCombinaison(r, c)).join('');
  const alertes = r.alertes.map((a) => `<p class="alerte">${sym(phrase(a))}</p>`).join('');
  return ponctuer(
    `<section class="groupe-verdicts" data-groupe="stabilite"><h2>${texte(r.profil)}</h2>` +
      `${cartes}<p class="note">${t.noteTaux}</p>${alertes}</section>` +
      `<section class="groupe-verdicts" data-groupe="indicatif"><h2>${t.groupes.indicatif}</h2>` +
      `${carteCaracteristique(r)}</section>`,
  );
}

/** Symbole d'un coefficient partiel, en HTML ; une cle inconnue s'affiche telle quelle. */
const SYM_COEF: Record<string, string> = {
  gG_dst: 'γ<sub>G,dst</sub>',
  gG_stb: 'γ<sub>G,stb</sub>',
  gQ_dst: 'γ<sub>Q,dst</sub>',
  gQ_stb: 'γ<sub>Q,stb</sub>',
  gPhi: 'γ<sub>φ′</sub>',
  gC: 'γ<sub>c′</sub>',
  gCu: 'γ<sub>cu</sub>',
  gRe: 'γ<sub>R;e</sub>',
};

/** Coefficients partiels de chaque combinaison, avec leur source, sans calcul. */
function coefficientsHtml(r: Resultat): string {
  const t = textes().vue;
  const lignes = r.coefficients
    .flatMap((c) => {
      const groupes: [string, object][] = [
        [t.groupesCoef.actions, c.actions],
        [t.groupesCoef.sol, c.sol],
        [t.groupesCoef.resistance, { gRe: c.gRe }],
      ];
      return groupes.flatMap(([groupe, coefs]) =>
        entrees(coefs).map(
          ([k, co]) =>
            `<tr><td>${texte(c.nom)}, ${t.modes[c.mode]}</td><td>${groupe}</td>` +
            `<td>${SYM_COEF[k] ?? echapper(k)}</td><td class="n">${aff(co.valeur, 2)}</td>` +
            `<td>${texte(co.source)}</td></tr>`,
        ),
      );
    })
    .join('');
  const c = t.colonnes;
  return (
    `<details class="deriv" open><summary>${t.volets.coefficients}</summary><div class="defile"><table><thead><tr>` +
    `<th>${c.combinaison}</th><th>${c.groupe}</th><th>${c.coefficient}</th><th class="n">${c.valeur}</th><th>${c.source}</th>` +
    `</tr></thead><tbody>${lignes}</tbody></table></div></details>`
  );
}

/** Volets : coefficients partiels avec leur source, puis les hypotheses de calcul. */
export function voletsHtml(r: Resultat): string {
  const t = textes().vue;
  return ponctuer(
    coefficientsHtml(r) +
      `<details class="deriv"><summary>${t.volets.hypotheses}</summary>` +
      `<div><ul>${t.hypotheses.map((h) => `<li>${h}</li>`).join('')}</ul></div></details>`,
  );
}

/** Tableau des tranches du cercle de la vue : 'caracteristique' ou le nom d'une combinaison. */
export function tranchesHtml(r: Resultat, vue: string): string {
  const t = textes().vue.tranches;
  const res =
    vue === 'caracteristique' ? r.caracteristique.resultat : r.combinaisons.find((c) => c.nom === vue)?.resultat;
  if (!res) return '';
  const nom = vue === 'caracteristique' ? textes().vue.caracteristique.titre : phrase(vue);
  const lignes = res.tranches
    .map((tr: Tranche) => {
      const q = tr.Q > 0 && !tr.qRetenue ? ` (${t.nonRetenue})` : '';
      return (
        `<tr data-tranche><td class="n">${aff(tr.x, 2)}</td><td class="n">${aff(tr.b, 2)}</td>` +
        `<td class="n">${aff(tr.W, 1)}</td><td class="n">${aff(tr.G, 1)}</td><td class="n">${aff(tr.Q, 1)}${q}</td>` +
        `<td class="n">${aff(tr.u, 1)}</td><td class="n">${aff(degres(tr.alpha), 1)}</td>` +
        `<td>${echapper(tr.materiau)}</td><td class="n">${aff(tr.mAlpha, 3)}</td></tr>`
      );
    })
    .join('');
  const c = t.colonnes;
  return (
    `<details class="deriv" open><summary>${t.titre(nom, res.tranches.length)}</summary><div class="defile"><table><thead><tr>` +
    `<th class="n">${c.x}</th><th class="n">${c.b}</th><th class="n">${c.W}</th><th class="n">${c.G}</th>` +
    `<th class="n">${c.Q}</th><th class="n">${c.u}</th><th class="n">${c.alpha}</th><th>${c.materiau}</th>` +
    `<th class="n">${c.mAlpha}</th></tr></thead><tbody>${lignes}</tbody></table></div></details>`
  );
}

/** Donnees d'entree : profil, couches, nappe, bandes, cercle ou cote limite, puis les choix normatifs. */
export function blocEntrees(calcul: Calcul): BlocResultat {
  const t = textes().entrees;
  const d = calcul.donnees;
  const lignes: { symbole: string; libelle: string; valeur: string }[] = [];
  const ligne = (symbole: string, libelle: string, valeur: string): void => {
    lignes.push({ symbole, libelle, valeur });
  };

  const pts = d.profil;
  if (pts.length > 0) {
    ligne(
      'profil',
      t.profil,
      `${t.points(pts.length)}, ${t.plage(aff(pts[0].x, 2), aff(pts[pts.length - 1].x, 2))}`,
    );
  }

  d.couches.forEach((c, i) => {
    const comp =
      c.drainage === 'draine'
        ? `${t.drainee}, φ′k = ${aff(c.phiDeg ?? Number.NaN)} °, c′k = ${aff(c.c ?? Number.NaN)} kPa`
        : `${t.nonDrainee}, c_u,k = ${aff(c.cu ?? Number.NaN)} kPa`;
    ligne(
      `couche ${i + 1}`,
      t.couche(c.nom),
      `${comp}, base ${aff(c.base, 2)} m, γ = ${aff(c.gamma, 2)} kN/m³, γsat = ${aff(c.gammaSat, 2)} kN/m³`,
    );
  });

  if (d.piezo !== null) {
    ligne('nappe', t.nappe, `${t.points(d.piezo.length)}, ${t.poidsEau}`);
  }

  d.bandes.forEach((b, i) => {
    ligne(
      `bande ${i + 1}`,
      t.bande,
      `${t.plage(aff(b.x0, 2), aff(b.x1, 2))}, q = ${aff(b.q)} kPa, ${t.nature[b.nature]}`,
    );
  });

  if (d.cercle !== null) {
    ligne('cercle', t.cercleImpose, textes().vue.cercle(aff(d.cercle.xc, 2), aff(d.cercle.yc, 2), aff(d.cercle.R, 2)));
  } else {
    ligne('cote limite', t.coteLimite, d.coteLimite === undefined ? t.aucune : `${aff(d.coteLimite, 2)} m`);
  }

  ligne('generation', t.generation, t.generations[d.generation]);
  if (d.generation === '1re') {
    const anb = d.profilNormatif === 'anb2022';
    ligne('approche', t.approche, anb ? `${d.approche}, ${t.approcheImposee}` : d.approche);
    if (anb) ligne('risque', t.risque, t.risques[d.risque]);
    ligne('profil normatif', t.profilNormatif, t.profils[d.profilNormatif]);
  } else {
    ligne('classe', t.classe, d.cc);
  }

  return { titre: t.titre, lignes, note: null };
}

/** Lignes de centre et de rayon d'un cercle. */
function lignesCercle(cer: { xc: number; yc: number; R: number }): { symbole: string; libelle: string; valeur: string }[] {
  const t = textes().resultats;
  return [
    { symbole: 'x_c', libelle: t.abscisse, valeur: `${aff(cer.xc, 2)} m` },
    { symbole: 'y_c', libelle: t.ordonnee, valeur: `${aff(cer.yc, 2)} m` },
    { symbole: 'R', libelle: t.rayon, valeur: `${aff(cer.R, 2)} m` },
  ];
}

/** Resultats : synthese, une section par combinaison, puis le F caracteristique. */
export function blocsResultat(r: Resultat): BlocResultat[] {
  const t = textes().resultats;
  const synthese: BlocResultat = {
    titre: t.titre,
    lignes: [
      { symbole: 'taux max', libelle: t.tauxMax, valeur: taux(r.tauxMax) },
      { symbole: 'gouvernant', libelle: t.gouvernant, valeur: phrase(r.gouvernant) },
    ],
    note: null,
  };
  const combinaisons: BlocResultat[] = r.combinaisons.map((c) => {
    const g = gammaRe(r, c.nom);
    return {
      titre: phrase(c.nom),
      lignes: [
        { symbole: 'F_d', libelle: t.F, valeur: aff(c.F, 3) },
        ...(g === undefined ? [] : [{ symbole: 'γ_R;e', libelle: t.gammaRe, valeur: aff(g, 2) }]),
        { symbole: 'taux', libelle: t.taux, valeur: taux(c.taux) },
        ...lignesCercle(c.cercle),
      ],
      note: null,
    };
  });
  const caracteristique: BlocResultat = {
    titre: textes().vue.caracteristique.titre,
    lignes: [{ symbole: 'F', libelle: t.F, valeur: aff(r.caracteristique.F, 3) }, ...lignesCercle(r.caracteristique.cercle)],
    note: null,
  };
  return [synthese, ...combinaisons, caracteristique];
}

export function messageDErreur(e: unknown): string {
  return phrase(e instanceof Error ? e.message : String(e));
}
