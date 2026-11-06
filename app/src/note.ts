/**
 * Contenu de la note de calcul commune (`noteDeCalculHtml` d'aedificium-ui). PUR : aucun calcul.
 *
 * Les lignes d'entree et les blocs de resultat viennent de `vue.ts` (`blocEntrees`, `blocsResultat`).
 * Les verifications sont les taux du noyau, une par combinaison de stabilite ; le F caracteristique,
 * indicatif, n'y figure pas. Pas de verdict global : la note dit la verification determinante.
 */

import { type ElementNote, type LigneResultat, type NoteDeCalcul, type VerificationNote, nombreAffiche } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';
import { coupe, vueGouvernante } from './dessin';
import { phrase, ponctuer, textes } from './textes';
import { blocEntrees, blocsResultat } from './vue';

type Section = 'geometrie' | 'materiaux' | 'hypotheses' | 'charges';

interface Coefficient {
  valeur: number;
  source: string;
}

/** Normes affichees dans le cartouche (non traduites). */
const NORME_1RE = 'EN 1997-1:2004';
const NORME_1RE_ANB = 'EN 1997-1:2004, NBN EN 1997-1 ANB:2022';
const NORMES_2E = 'EN 1997-1:2024, EN 1997-3:2025, EN 1990:2023';

/** Symboles des coefficients rendus par le noyau ; une cle inconnue s'affiche telle quelle. */
const SYM_COEF: Record<string, string> = {
  gG_dst: 'γG,dst',
  gG_stb: 'γG,stb',
  gQ_dst: 'γQ,dst',
  gQ_stb: 'γQ,stb',
  gPhi: 'γφ′',
  gC: 'γc′',
  gCu: 'γcu',
  gRe: 'γR;e',
};

const bloc = (titre: string, lignes: LigneResultat[], note: string | null = null): ElementNote => ({
  type: 'bloc',
  bloc: { titre, lignes, note },
});

/** Section d'une ligne d'entree : la geometrie, les couches, les surcharges, sinon les choix (nappe compris). */
function sectionDe(symbole: string): Section {
  const s = textes().entrees.symboles;
  if (symbole === s.profil || symbole === s.cercle || symbole === s.coteLimite) return 'geometrie';
  if (symbole.startsWith(`${s.couche} `)) return 'materiaux';
  if (symbole.startsWith(`${s.bande} `)) return 'charges';
  return 'hypotheses';
}

function normeDe(calcul: Calcul, r: Resultat): string {
  if (r.generation === '2e') return NORMES_2E;
  return calcul.donnees.profilNormatif === 'anb2022' ? NORME_1RE_ANB : NORME_1RE;
}

/** Une verification par combinaison : taux du noyau, jugee sur taux <= 1. */
function verificationsDe(r: Resultat): VerificationNote[] {
  const clauses = textes().note.clauses;
  const clause = r.generation === '2e' ? clauses.generation2 : clauses.generation1;
  return r.combinaisons.map((c) => ({ nom: phrase(c.nom), clause, taux: c.taux, ok: c.taux <= 1 }));
}

/** Coefficients partiels de chaque combinaison, avec leur source, en blocs de la section calculs. */
function blocsCoefficients(r: Resultat): ElementNote[] {
  const t = textes();
  const groupes = t.vue.groupesCoef;
  return r.coefficients.map((c) => {
    const jeux: [string, object][] = [
      [groupes.actions, c.actions],
      [groupes.sol, c.sol],
      [groupes.resistance, { gRe: c.gRe }],
    ];
    const lignes: LigneResultat[] = jeux.flatMap(([groupe, coefs]) =>
      Object.entries(coefs).map(([k, co]: [string, Coefficient]) => ({
        symbole: SYM_COEF[k] ?? k,
        libelle: ponctuer(`${groupe} : ${phrase(co.source)}`),
        valeur: Number.isFinite(co.valeur) ? nombreAffiche(co.valeur, 2) : t.vue.nonCalculable,
      })),
    );
    return bloc(ponctuer(`${t.note.coefficients}, ${phrase(c.nom)}`), lignes, t.vue.modes[c.mode]);
  });
}

/** Note du calcul courant, sans verdict global. */
export function noteDuCalcul(
  calcul: Calcul,
  r: Resultat,
  cartouche: { projet: string; element: string; date: string },
): NoteDeCalcul {
  const t = textes();
  const n = t.note;
  const titre = t.entrees.titre;

  const entrees = blocEntrees(calcul);
  const lignes = (s: Section): LigneResultat[] => entrees.lignes.filter((l) => sectionDe(l.symbole) === s);

  const charges = lignes('charges');
  // Resultats : le premier bloc (synthese) reste a l'ecran ; la note donne un bloc par combinaison et le F caracteristique.
  const [, ...detail] = blocsResultat(r);

  return {
    cartouche: {
      projet: cartouche.projet,
      element: cartouche.element.trim() === '' ? n.element : cartouche.element,
      date: cartouche.date,
      norme: normeDe(calcul, r),
      outil: 'stabilite-talus',
    },
    sections: {
      geometrie: [
        bloc(titre, lignes('geometrie')),
        { type: 'figure', svg: coupe(calcul, r, vueGouvernante(r), { cotes: true, tranches: true }), legende: n.legendeCoupe },
      ],
      materiaux: [bloc(titre, lignes('materiaux'))],
      hypotheses: [
        bloc(titre, lignes('hypotheses')),
        { type: 'liste', items: [phrase(r.profil), ...n.hypotheses] },
      ],
      charges: charges.length > 0 ? [bloc(titre, charges)] : [{ type: 'texte', texte: n.aucuneCharge }],
      calculs: [
        ...detail.map((b): ElementNote => ({ type: 'bloc', bloc: b })),
        ...blocsCoefficients(r),
      ],
    },
    verifications: verificationsDe(r),
    avertissements: r.alertes.map((a) => phrase(a)),
  };
}
