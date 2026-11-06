/**
 * Les textes affiches, en francais et en anglais. PUR.
 * Aucun texte ne se lit au chargement d'un module : toujours `textes()` ou `phrase()` au moment du rendu.
 * Les textes qui entrent dans du HTML portent leurs indices en balises (`<sub>`), jamais en `_`.
 */

import { langueCourante, traducteur } from 'aedificium-ui';

const FR = {
  messages: {
    rienAExporter: 'Aucun calcul valide à exporter : corriger la saisie.',
    nouvelleVersion: 'Une nouvelle version est disponible. Recharger maintenant ?',
  },
  entrees: {
    titre: 'Données d’entrée',
    profil: 'Profil du terrain',
    points: (n: number) => `${n} points`,
    plage: (a: string, b: string) => `x de ${a} à ${b} m`,
    couche: (nom: string) => `Couche ${nom}`,
    drainee: 'drainée',
    nonDrainee: 'non drainée',
    nappe: 'Ligne piézométrique',
    poidsEau: 'γw = 9,81 kN/m³',
    bande: 'Surcharge en bande',
    nature: { G: 'permanente', Q: 'variable' },
    cercleImpose: 'Cercle imposé',
    coteLimite: 'Cote limite de recherche',
    aucune: 'aucune',
    generation: 'Génération',
    symboleGeneration: 'génération',
    approche: 'Approche',
    approcheImposee: 'imposée par la norme',
    risque: 'Risque',
    classe: 'Classe de conséquences',
    profilNormatif: 'Profil normatif',
    generations: { '1re': '1re génération', '2e': '2e génération' },
    risques: { faible: 'faible', normal: 'normal', eleve: 'élevé' },
    profils: { recommande: 'valeurs recommandées', anb2022: 'NBN EN 1997-1 ANB:2022' },
  },
  vue: {
    nonCalculable: 'non calculable',
    gouvernant: 'gouvernant',
    noteTaux: 'Taux = γ<sub>R;e</sub> / F<sub>d</sub> ; au-delà de 1, la combinaison est dépassée.',
    clauses: {
      generation1: '§11.5.1 · tableaux A.3, A.4, A.14',
      generation2: 'EN 1997-3 §4.6.3 · tableau 4.2',
    },
    groupes: { indicatif: 'F caractéristique, à titre indicatif' },
    caracteristique: {
      titre: 'F caractéristique',
      clause: 'indicatif',
      note: 'Sans seuil : les normes vérifient les combinaisons, pas un F global.',
    },
    cercle: (x: string, y: string, R: string) => `cercle de centre (${x} ; ${y}) m, rayon ${R} m`,
    modes: { effets: 'facteurs sur le moment moteur', actions: 'facteurs sur les charges' },
    groupesCoef: { actions: 'Actions', sol: 'Sol', resistance: 'Résistance' },
    colonnes: {
      combinaison: 'Combinaison',
      groupe: 'Groupe',
      coefficient: 'Coefficient',
      valeur: 'Valeur',
      source: 'Source',
    },
    volets: {
      coefficients: 'Coefficients partiels, avec leur source',
      hypotheses: 'Hypothèses',
    },
    hypotheses: [
      'Bishop simplifié : F itéré jusqu’à une variation inférieure à 10<sup>-7</sup>, 200 itérations au plus.',
      'Poids volumique de l’eau γw = 9,81 kN/m³ ; pression u = γw × hauteur d’eau au-dessus de la base, sans coefficient.',
      '50 tranches verticales, les mêmes pour la recherche et pour le cercle affiché.',
      'Surcharge variable stabilisatrice non comptée : elle n’est retenue que sur les tranches motrices.',
      'm<sub>α</sub> borné à 0,2 : la sortie de glissement raide est signalée.',
      'Couches à limites horizontales ; une seule ligne piézométrique ; eau au-dessus du terrain sans poids ni poussée.',
    ],
    tranches: {
      titre: (vue: string, n: number) => `Tranches, ${vue} (${n})`,
      colonnes: {
        x: 'x (m)',
        b: 'b (m)',
        W: 'W (kN/m)',
        G: 'G (kN/m)',
        Q: 'Q (kN/m)',
        u: 'u (kPa)',
        alpha: 'α (°)',
        materiau: 'Matériau',
        mAlpha: 'm<sub>α</sub>',
      },
      nonRetenue: 'non retenue',
    },
  },
  note: {
    element: 'Talus',
    legendeCoupe: 'Coupe du talus à l’échelle, vue gouvernante.',
    aucuneCharge: 'Aucune surcharge en bande.',
    clauses: { generation1: '§11.5.1', generation2: 'EN 1997-3 §4.6.3' },
    coefficients: 'Coefficients partiels',
    hypotheses: [
      'Bishop simplifié : F itéré jusqu’à une variation inférieure à 10⁻⁷, 200 itérations au plus.',
      'Poids volumique de l’eau γw = 9,81 kN/m³ ; pression u = γw × hauteur d’eau au-dessus de la base, sans coefficient.',
      '50 tranches verticales, les mêmes pour la recherche et pour le cercle affiché.',
      'Surcharge variable stabilisatrice non comptée : elle n’est retenue que sur les tranches motrices.',
      'mα borné à 0,2 : la sortie de glissement raide est signalée.',
      'Couches à limites horizontales ; une seule ligne piézométrique ; eau au-dessus du terrain sans poids ni poussée.',
    ],
  },
  resultats: {
    titre: 'Résultats',
    tauxMax: 'Taux maximal',
    gouvernant: 'Combinaison gouvernante',
    F: 'Facteur de sécurité F_d',
    gammaRe: 'Coefficient γ_R;e',
    taux: 'Taux',
    abscisse: 'Centre, abscisse',
    ordonnee: 'Centre, ordonnée',
    rayon: 'Rayon',
  },
};

export type Textes = typeof FR;

const EN: Textes = {
  messages: {
    rienAExporter: 'No valid calculation to export: correct the input.',
    nouvelleVersion: 'A new version is available. Reload now?',
  },
  entrees: {
    titre: 'Input data',
    profil: 'Ground profile',
    points: (n: number) => `${n} points`,
    plage: (a: string, b: string) => `x from ${a} to ${b} m`,
    couche: (nom: string) => `Layer ${nom}`,
    drainee: 'drained',
    nonDrainee: 'undrained',
    nappe: 'Piezometric line',
    poidsEau: 'γw = 9.81 kN/m³',
    bande: 'Strip load',
    nature: { G: 'permanent', Q: 'variable' },
    cercleImpose: 'Imposed circle',
    coteLimite: 'Search depth limit',
    aucune: 'none',
    generation: 'Generation',
    symboleGeneration: 'generation',
    approche: 'Approach',
    approcheImposee: 'set by the standard',
    risque: 'Risk',
    classe: 'Consequence class',
    profilNormatif: 'Normative profile',
    generations: { '1re': '1st generation', '2e': '2nd generation' },
    risques: { faible: 'low', normal: 'normal', eleve: 'high' },
    profils: { recommande: 'recommended values', anb2022: 'NBN EN 1997-1 ANB:2022' },
  },
  vue: {
    nonCalculable: 'not calculable',
    gouvernant: 'governing',
    noteTaux: 'Ratio = γ<sub>R;e</sub> / F<sub>d</sub>; above 1, the combination is exceeded.',
    clauses: {
      generation1: '§11.5.1 · tables A.3, A.4, A.14',
      generation2: 'EN 1997-3 §4.6.3 · table 4.2',
    },
    groupes: { indicatif: 'Characteristic F, for information' },
    caracteristique: {
      titre: 'Characteristic F',
      clause: 'for information',
      note: 'No threshold: the standards check the combinations, not a global F.',
    },
    cercle: (x: string, y: string, R: string) => `circle centred at (${x} ; ${y}) m, radius ${R} m`,
    modes: { effets: 'factors on the driving moment', actions: 'factors on the actions' },
    groupesCoef: { actions: 'Actions', sol: 'Soil', resistance: 'Resistance' },
    colonnes: {
      combinaison: 'Combination',
      groupe: 'Group',
      coefficient: 'Coefficient',
      valeur: 'Value',
      source: 'Source',
    },
    volets: {
      coefficients: 'Partial factors, with their source',
      hypotheses: 'Assumptions',
    },
    hypotheses: [
      'Simplified Bishop: F iterated until a change below 10<sup>-7</sup>, 200 iterations at most.',
      'Unit weight of water γw = 9.81 kN/m³; water pressure u = γw × water height above the base, without factor.',
      '50 vertical slices, the same for the search and for the displayed circle.',
      'Stabilising variable surcharge not counted: it is retained only on the driving slices.',
      'm<sub>α</sub> capped at 0.2: the steep slip exit is flagged.',
      'Layers with horizontal boundaries; a single piezometric line; water above the ground without weight or thrust.',
    ],
    tranches: {
      titre: (vue: string, n: number) => `Slices, ${vue} (${n})`,
      colonnes: {
        x: 'x (m)',
        b: 'b (m)',
        W: 'W (kN/m)',
        G: 'G (kN/m)',
        Q: 'Q (kN/m)',
        u: 'u (kPa)',
        alpha: 'α (°)',
        materiau: 'Material',
        mAlpha: 'm<sub>α</sub>',
      },
      nonRetenue: 'not counted',
    },
  },
  note: {
    element: 'Slope',
    legendeCoupe: 'Slope section to scale, governing view.',
    aucuneCharge: 'No strip load.',
    clauses: { generation1: '§11.5.1', generation2: 'EN 1997-3 §4.6.3' },
    coefficients: 'Partial factors',
    hypotheses: [
      'Simplified Bishop: F iterated until a change below 10⁻⁷, 200 iterations at most.',
      'Unit weight of water γw = 9.81 kN/m³; water pressure u = γw × height of water above the base, without factor.',
      '50 vertical slices, the same for the search and for the displayed circle.',
      'Stabilising variable surcharge not counted: it is retained only on the driving slices.',
      'mα capped at 0.2: steep slip exit flagged.',
      'Layers with horizontal boundaries; a single piezometric line; water above the ground without weight or thrust.',
    ],
  },
  resultats: {
    titre: 'Results',
    tauxMax: 'Maximum ratio',
    gouvernant: 'Governing combination',
    F: 'Safety factor F_d',
    gammaRe: 'Coefficient γ_R;e',
    taux: 'Ratio',
    abscisse: 'Centre, abscissa',
    ordonnee: 'Centre, ordinate',
    rayon: 'Radius',
  },
};

export function textes(): Textes {
  return langueCourante() === 'en' ? EN : FR;
}

/**
 * Ponctuation de la langue courante : les assemblages « a : b » et « a ; b » portent
 * l'espace francaise ; en anglais, les deux-points et le point-virgule se collent au mot.
 */
export function ponctuer(s: string): string {
  return langueCourante() === 'en' ? s.replace(/ ([:;])(?=\s)/g, '$1') : s;
}

// --- Phrases du noyau : traduites en anglais seulement ; en francais, phrase() rend le texte intact --

/** Sources des coefficients et phrases courtes du noyau, traduites mot a mot. */
const sourceEn = (s: string): string =>
  s
    .replace(/valeur recommandée/g, 'recommended value')
    .replace(/valeur caractéristique/g, 'characteristic value')
    .replace(/coefficient à 1/g, 'coefficient of 1')
    .replace(/facteur de conséquence/g, 'consequence factor')
    .replace(/action variable favorable non comptée/g, 'favourable variable action not counted')
    .replace(/action variable favorable/g, 'favourable variable action')
    .replace(/approche par les matériaux/g, 'material approach')
    .replace(/tableau /g, 'table ')
    .replace(/sans coefficient/g, 'no factor')
    .replace(/, jeu /g, ', set ')
    .replace(/jeu /g, 'set ');

const RISQUE_EN: Record<string, string> = { faible: 'low risk', normal: 'normal risk', 'élevé': 'high risk' };

const EXACTES: Record<string, string> = {
  'EN 1997-1:2004, valeurs recommandées': 'EN 1997-1:2004, recommended values',
  'valeur caractéristique, coefficient à 1': 'characteristic value, coefficient of 1',
  'eau au-dessus du terrain : son poids et sa poussée ne sont pas modélisés':
    'water above the ground: its weight and thrust are not modelled',
  'm_α borné à 0,2 : sortie de glissement raide': 'm_α capped at 0.2: steep slip exit',
};

export const phrase = traducteur(EXACTES, [
  [/^NBN EN 1997-1 ANB:2022, risque (faible|normal|élevé), DA1 imposée$/, (_m: string, r: string) => `NBN EN 1997-1 ANB:2022, ${RISQUE_EN[r]}, DA1 imposed`],
  [/^([\s\S]*)$/, (_m: string, s: string) => sourceEn(s)],
]);
