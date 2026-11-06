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
    /** Symboles de la colonne « symbole » des tableaux d'entrées, et des sections de la note. */
    symboles: {
      profil: 'profil',
      couche: 'couche',
      nappe: 'nappe',
      bande: 'bande',
      cercle: 'cercle',
      coteLimite: 'cote limite',
      approche: 'approche',
      risque: 'risque',
      profilNormatif: 'profil normatif',
      classe: 'classe',
    },
  },
  refus: {
    nombre: (contexte: string, brut: string) => `${contexte} : nombre attendu, reçu « ${brut} »`,
    point: (liste: string, rang: number, coord: string) => `${liste}, point ${rang}, ${coord}`,
    listes: { profil: 'Profil', piezo: 'Ligne piézométrique' },
    couche: (nom: string, champ: string) => `Couche ${nom}, ${champ}`,
    coucheSansNom: (rang: number) => `Couche ${rang}`,
    champsCouche: { base: 'cote de base', gamma: 'γ', gammaSat: 'γsat', phi: "φ'k", c: "c'k", cu: 'c_u,k' },
    bande: (rang: number, champ: string) => `Surcharge en bande ${rang}, ${champ}`,
    champsBande: { x0: 'x début', x1: 'x fin', q: 'q' },
    cercle: (champ: string) => `Cercle, ${champ}`,
    champsCercle: { xc: 'x_c', yc: 'y_c', R: 'R' },
    cote: 'Cote limite',
    phi: (nom: string, brut: string) => `Couche ${nom}, φ'k hors de ]0 ; 90[ : reçu « ${brut} »`,
    cu: (nom: string, brut: string) => `Couche ${nom}, c_u,k doit être strictement positif : reçu « ${brut} »`,
    format: (recu: string, attendu: string) => `Format inconnu : « ${recu} » ; attendu ${attendu}`,
  },
  page: {
    elementAbsent: (selecteur: string) => `Élément absent de la page : ${selecteur}`,
    retirer: 'Retirer',
    retirerPoint: (n: number) => `Retirer le point ${n}`,
    surcharge: (n: number) => `surcharge ${n}`,
    retirerSurcharge: (n: number) => `Retirer la surcharge ${n}`,
    nature: 'Nature',
    couche: (n: number) => `Couche ${n}`,
    nomCouche: (n: number) => `Nom de la couche ${n}`,
    nom: 'Nom',
    drainee: 'Drainé',
    nonDrainee: 'Non drainé',
    coteBase: 'Cote de base',
    coteBaseLibelle: 'Cote de base (m)',
    champCouche: (aria: string, n: number) => `${aria} de la couche ${n}`,
    retirerCouche: (n: number) => `Retirer la couche ${n}`,
    caracteristique: 'Caractéristique',
    talusType: 'Talus type : hauteur, pente, longueurs de crête et de pied doivent être des nombres.',
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
    symboles: { tauxMax: 'taux max', gouvernant: 'gouvernant', taux: 'taux' },
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
    symboles: {
      profil: 'profile',
      couche: 'layer',
      nappe: 'piezo',
      bande: 'strip',
      cercle: 'circle',
      coteLimite: 'depth limit',
      approche: 'approach',
      risque: 'risk',
      profilNormatif: 'normative profile',
      classe: 'class',
    },
  },
  refus: {
    nombre: (contexte: string, brut: string) => `${contexte}: number expected, got “${brut}”`,
    point: (liste: string, rang: number, coord: string) => `${liste}, point ${rang}, ${coord}`,
    listes: { profil: 'Profile', piezo: 'Piezometric line' },
    couche: (nom: string, champ: string) => `Layer ${nom}, ${champ}`,
    coucheSansNom: (rang: number) => `Layer ${rang}`,
    champsCouche: { base: 'base level', gamma: 'γ', gammaSat: 'γsat', phi: "φ'k", c: "c'k", cu: 'c_u,k' },
    bande: (rang: number, champ: string) => `Strip load ${rang}, ${champ}`,
    champsBande: { x0: 'x start', x1: 'x end', q: 'q' },
    cercle: (champ: string) => `Circle, ${champ}`,
    champsCercle: { xc: 'x_c', yc: 'y_c', R: 'R' },
    cote: 'Depth limit',
    phi: (nom: string, brut: string) => `Layer ${nom}, φ'k outside ]0 ; 90[: got “${brut}”`,
    cu: (nom: string, brut: string) => `Layer ${nom}, c_u,k must be strictly positive: got “${brut}”`,
    format: (recu: string, attendu: string) => `Unknown format: “${recu}”; expected ${attendu}`,
  },
  page: {
    elementAbsent: (selecteur: string) => `Element missing from the page: ${selecteur}`,
    retirer: 'Remove',
    retirerPoint: (n: number) => `Remove point ${n}`,
    surcharge: (n: number) => `strip load ${n}`,
    retirerSurcharge: (n: number) => `Remove strip load ${n}`,
    nature: 'Nature',
    couche: (n: number) => `Layer ${n}`,
    nomCouche: (n: number) => `Name of layer ${n}`,
    nom: 'Name',
    drainee: 'Drained',
    nonDrainee: 'Undrained',
    coteBase: 'Base level',
    coteBaseLibelle: 'Base level (m)',
    champCouche: (aria: string, n: number) => `${aria} of layer ${n}`,
    retirerCouche: (n: number) => `Remove layer ${n}`,
    caracteristique: 'Characteristic',
    talusType: 'Standard slope: height, slope, crest and toe lengths must be numbers.',
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
    symboles: { tauxMax: 'max ratio', gouvernant: 'governing', taux: 'ratio' },
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
    .replace(/valeurs recommandées/g, 'recommended values')
    .replace(/valeur recommandée/g, 'recommended value')
    .replace(/valeur caractéristique/g, 'characteristic value')
    .replace(/coefficient à 1/g, 'coefficient of 1')
    .replace(/facteur de conséquence/g, 'consequence factor')
    .replace(/action variable favorable non comptée/g, 'favourable variable action not counted')
    .replace(/action variable favorable/g, 'favourable variable action')
    .replace(/approche par les matériaux/g, 'material approach')
    .replace(/sans facteur de résistance/g, 'no resistance factor')
    .replace(/absent de l'ANB:2022/g, 'absent from ANB:2022')
    .replace(/imposée/g, 'imposed')
    .replace(/tableau /g, 'table ')
    .replace(/sans coefficient/g, 'no factor')
    .replace(/, jeu /g, ', set ')
    .replace(/jeu /g, 'set ');

const RISQUE_EN: Record<string, string> = { faible: 'low risk', normal: 'normal risk', 'élevé': 'high risk' };

/** Motifs d'un cercle invalide ou d'un calcul sans issue, tels que le noyau les ecrit. */
const MOTIFS_EN: Record<string, string> = {
  'le cercle ne coupe pas le terrain': 'the circle does not cut the ground',
  'le cercle coupe le terrain en plusieurs points': 'the circle cuts the ground at several points',
  "l'arc de glissement sort du profil": 'the slip arc goes beyond the profile',
  "l'arc ne rejoint pas le terrain (le cercle reste sous le terrain)": 'the arc does not meet the ground (the circle stays below it)',
  'moment moteur nul ou négatif dans le sens du glissement': 'driving moment zero or negative in the sliding direction',
  'F non physique (numérateur nul ou négatif)': 'F not physical (numerator zero or negative)',
};

const EXACTES: Record<string, string> = {
  'EN 1997-1:2004, valeurs recommandées': 'EN 1997-1:2004, recommended values',
  'EN 1990:2023 et EN 1997:2024-2025, valeurs recommandées': 'EN 1990:2023 and EN 1997:2024-2025, recommended values',
  'valeur caractéristique, coefficient à 1': 'characteristic value, coefficient of 1',
  caractéristique: 'characteristic',
  'eau au-dessus du terrain : son poids et sa poussée ne sont pas modélisés':
    'water above the ground: its weight and thrust are not modelled',
  'm_α borné à 0,2 : sortie de glissement raide': 'mα capped at 0.2: steep slip exit',
  'Le nombre de tranches doit être un entier au moins égal à 1.': 'The number of slices must be an integer of at least 1.',
  'Le profil du talus doit compter au moins 2 points.': 'The slope profile must have at least 2 points.',
  'Les x du profil doivent être strictement croissants.': 'The x values of the profile must be strictly increasing.',
  'Au moins une couche est nécessaire.': 'At least one layer is required.',
  'La ligne piézométrique doit compter au moins 2 points.': 'The piezometric line must have at least 2 points.',
  'Les x de la ligne piézométrique doivent être strictement croissants.':
    'The x values of the piezometric line must be strictly increasing.',
  "Le poids volumique de l'eau doit être strictement positif (kN/m³).":
    'The unit weight of water must be strictly positive (kN/m³).',
  'Une bande de charge doit avoir x0 < x1.': 'A strip load must have x0 < x1.',
  'Le centre du cercle doit avoir des coordonnées finies (m).': 'The centre of the circle must have finite coordinates (m).',
  'Le rayon du cercle doit être strictement positif (m).': 'The radius of the circle must be strictly positive (m).',
  ...MOTIFS_EN,
};

/**
 * Regles par motif. Chaque remplacement recoit le texte apparie puis ses groupes ;
 * les messages qui citent un nom de profil ou de combinaison le traduisent a leur tour.
 */
const REGLES: [RegExp, (_m: string, ...g: string[]) => string][] = [
  [
    /^Le cercle imposé est invalide \((.+)\) : (.+)\.$/,
    (_m, nom, motif) => `The imposed circle is invalid (${phrase(nom)}): ${phrase(motif)}.`,
  ],
  [
    /^Aucun cercle valide trouvé \((.+)\) : vérifier le profil, les couches et la cote limite\.$/,
    (_m, nom) => `No valid circle found (${phrase(nom)}): check the profile, the layers and the depth limit.`,
  ],
  [
    /^Le profil (.+) impose l'approche (\S+) ; l'approche (\S+) est refusée\.$/,
    (_m, profil, a, b) => `The profile ${phrase(profil)} requires the approach ${a}; the approach ${b} is refused.`,
  ],
  [
    /^L'angle de frottement φ' de la couche (.+) doit être dans \]0 ; (.+)\[ \((degrés|rad)\)\.$/,
    (_m, nom, borne, unite) => `The friction angle φ' of layer ${nom} must be within ]0 ; ${borne}[ (${unite === 'rad' ? 'rad' : 'degrees'}).`,
  ],
  [/^La cohésion c' de la couche (.+) est absente\.$/, (_m, nom) => `The cohesion c' of layer ${nom} is missing.`],
  [
    /^La cohésion c' de la couche (.+) doit être positive ou nulle \(kPa\)\.$/,
    (_m, nom) => `The cohesion c' of layer ${nom} must be zero or positive (kPa).`,
  ],
  [
    /^La résistance non drainée cu de la couche (.+) doit être strictement positive \(kPa\)\.$/,
    (_m, nom) => `The undrained strength cu of layer ${nom} must be strictly positive (kPa).`,
  ],
  [
    /^Les poids volumiques de la couche (.+) doivent être strictement positifs \(kN\/m³\)\.$/,
    (_m, nom) => `The unit weights of layer ${nom} must be strictly positive (kN/m³).`,
  ],
  [
    /^Les cotes de base des couches doivent être strictement décroissantes, du haut vers le bas \(couche (.+)\)\.$/,
    (_m, nom) => `The base levels of the layers must be strictly decreasing, from top to bottom (layer ${nom}).`,
  ],
  [/^La charge q d'une bande doit être positive ou nulle \(kPa\)\.$/, () => 'The load q of a strip must be zero or positive (kPa).'],
  [/^Bishop ne converge pas en (\d+) itérations$/, (_m, n) => `Bishop does not converge in ${n} iterations`],
  [
    /^Risque inconnu : (.+) \(attendu : faible, normal ou eleve\)\.$/,
    (_m, r) => `Unknown risk: ${r} (expected: low, normal or high).`,
  ],
  [
    /^NBN EN 1997-1 ANB:2022, risque (faible|normal|élevé), DA1 imposée$/,
    (_m, r) => `NBN EN 1997-1 ANB:2022, ${RISQUE_EN[r]}, DA1 imposed`,
  ],
  [/^([\s\S]*)$/, (_m, s) => sourceEn(s)],
];

/** Traduction d'une phrase du noyau, ou de la saisie, au rendu seulement. */
export const phrase = traducteur(EXACTES, REGLES);
