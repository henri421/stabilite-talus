# Stabilité de talus : plan du noyau

Rédigé le 2026-11-06. Décisions : `plan-webaedificium/etape-5-refonte-fondbis.md`, section « Deuxième outil ».
Ce lot couvre l'extension du paquet `sol-ec7` (v0.2.0) et le noyau de l'outil. L'interface fera l'objet d'un plan
séparé, après audit de ce lot et validation d'une maquette.

Deux dépôts voisins : `Github\sol-ec7` et `Github\stabilite-talus`.

## Spécifications

**Objectif.** Stabilité générale d'un talus, d'un déblai ou d'un remblai en déformation plane, par la méthode de
Bishop simplifiée sur des cercles, dans les deux générations de l'EN 1997 :

- 1re génération : EN 1997-1:2004 section 11 et annexe A, approches DA1, DA2, DA3. Profil « valeurs
  recommandées » ou « NBN EN 1997-1 ANB:2022 » (DA1 imposée, γQ = 1,10 en A2, jeu M2 selon le risque).
- 2e génération : EN 1997-3:2025 4.6.3 et tableau 4.2, approche par les matériaux : actions VC3 (EN 1990:2023,
  annexe A), propriétés du sol M2 × k_M (EN 1997-1:2024, 4.4.1.3), sans facteur de résistance.

**Contraintes.**

- Aucune valeur inventée. Un cercle qui ne coupe pas le terrain, sort du profil ou ne converge pas est
  **invalide avec son motif**, jamais remplacé par un F par défaut.
- F caractéristique rendu à titre indicatif, **sans seuil** (pas de cible 1,5 inventée).
- Couches à limites horizontales (cote de base), drainées (φ', c') ou non drainées (c_u). Choix déclaré.
- Pression interstitielle hydrostatique sous une ligne piézométrique polyligne : u = γw · (y_pz(x) − y_base).
  Hors du profil de la ligne, sa cote est prolongée à l'horizontale.
- Sens du glissement : signe de Σ (W + G + Q)·sin α, avec les valeurs caractéristiques.
- Une surcharge variable sur une tranche où elle stabilise (sin α du côté opposé au glissement) n'est pas
  comptée (γQ,stb = 0). Une surcharge permanente est toujours comptée.
- Mode « effets » (DA1-1, DA2) : facteurs γG, γQ sur le moment moteur, poids caractéristiques dans la
  résistance. Mode « actions » (DA1-2, DA3, VC3 + M2) : facteurs sur les charges partout.
- Taux = γR;e / F. Conforme si taux ≤ 1.
- Sol non drainé : terme résistant c_u,d · b, sans frottement ni pression interstitielle.
- m_α borné à 0,2 avec avertissement (sortie raide) ; eau au-dessus du terrain : avertissement « au-dessus du
  terrain » (son poids et sa poussée ne sont pas modélisés).
- La recherche et le cercle rendu utilisent **le même nombre de tranches** (défaut 50).

**Hors périmètre.** Surfaces non circulaires (Spencer, Morgenstern-Price), couches inclinées, renforcements et
clous (outil « sol renforcé » à venir, qui réutilisera ce noyau), séisme, fissures de traction, succion,
écoulement non hydrostatique, eau libre au-dessus du terrain, états limites de service.

**Unités.** m, kN/m, kPa, kN/m³. Angles en **radians** dans `sol-ec7`, en **degrés** dans `DonneesTalus`.
x horizontal croissant, y altitude.

## Interfaces publiques

### `sol-ec7/src/coefficients.ts` (ajouts)

```ts
export type Risque = 'faible' | 'normal' | 'eleve';
// Profil1g gagne deux champs :
//   Re: { R1: ValeurSourcee; R2: ValeurSourcee; R3: ValeurSourcee }   // gamma_R;e, tableau A.14
//   approcheImposee?: Approche                                         // 'DA1' pour l'ANB
export function profilAnb2022(risque: Risque): Profil1g;
export interface CombinaisonStabilite {
  nom: string;                 // 'DA1-1' | 'DA1-2' | 'DA2' | 'DA3' | 'VC3 + M2'
  mode: 'effets' | 'actions';
  actions: JeuActions;
  sol: JeuSol;
  gRe: ValeurSourcee;
}
export function combinaisonsStabilite1g(approche: Approche, p: Profil1g): CombinaisonStabilite[];
export function combinaisonsStabilite2g(cc: ClasseConsequences, p: Profil2g): CombinaisonStabilite[];
```

### `sol-ec7/src/stabilite.ts` (nouveau, exporté par `index.ts`)

```ts
export interface Point { x: number; y: number }
export interface CoucheTalus {
  nom: string; base: number;          // cote de base ; couches triees du haut vers le bas
  gamma: number; gammaSat: number;
  drainage: 'draine' | 'non_draine';
  phi?: number; c?: number;           // draine : phi en rad dans ]0, pi/2[, c >= 0
  cu?: number;                        // non draine : cu > 0
}
export interface Bande { x0: number; x1: number; q: number; nature: 'G' | 'Q' }
export interface Cercle { xc: number; yc: number; R: number }
export interface DonneesBishop {
  profil: Point[]; couches: CoucheTalus[]; piezo: Point[] | null; gammaW: number;
  bandes: Bande[]; combinaison: CombinaisonStabilite; nbTranches?: number;   // defaut 50
}
export interface Tranche {
  x: number; b: number; ySol: number; yBase: number; alpha: number;  // rad
  W: number; G: number; Q: number; qRetenue: boolean; u: number; materiau: string; mAlpha: number;
}
export type ResultatCercle =
  | { valide: true; F: number; taux: number; sens: 1 | -1; momentMoteur: number;
      tranches: Tranche[]; avertissements: string[] }
  | { valide: false; motif: string };
export function analyserCercle(d: DonneesBishop, c: Cercle): ResultatCercle;
export interface OptionsRecherche { coteLimite?: number }
export function rechercherCercleCritique(d: DonneesBishop, o?: OptionsRecherche):
  { cercle: Cercle; resultat: Extract<ResultatCercle, { valide: true }>; nbCercles: number } | null;
```

`analyserCercle` **lève** (message en français) sur une saisie incohérente : profil de moins de 2 points ou x non
strictement croissants (« croissants »), aucune couche (« couche »), bases non strictement décroissantes, γ ≤ 0,
couche drainée avec φ hors de ]0, π/2[ (message contenant « φ ») ou c < 0, couche non drainée avec c_u ≤ 0
(message contenant « cu »), bande avec x0 ≥ x1 ou q < 0, ligne piézométrique de moins de 2 points.

### `stabilite-talus/src/talus.ts`

```ts
import type { Approche, ClasseConsequences, Risque, Bande, Cercle, Point } from 'sol-ec7';
export interface CoucheSaisie {
  nom: string; base: number; gamma: number; gammaSat: number;
  drainage: 'draine' | 'non_draine'; phiDeg?: number; c?: number; cu?: number;
}
export interface DonneesTalus {
  generation: '1re' | '2e';
  profilNormatif: 'recommande' | 'anb2022'; risque: Risque; approche: Approche;   // 1re generation
  cc: ClasseConsequences;                                                          // 2e generation
  profil: Point[]; couches: CoucheSaisie[]; piezo: Point[] | null; bandes: Bande[];
  cercle: Cercle | null;            // impose ; null : recherche du cercle critique par combinaison
  coteLimite?: number;
}
export interface ResultatCombinaison {
  nom: string; cercle: Cercle; F: number; taux: number; conforme: boolean;
  resultat: Extract<ResultatCercle, { valide: true }>;
}
export interface ResultatTalus {
  profil: string;                   // nom du profil de coefficients
  caracteristique: { cercle: Cercle; F: number };   // coefficients a 1, sans verdict
  combinaisons: ResultatCombinaison[];
  gouvernant: string; tauxMax: number;
  alertes: string[];                // avertissements de tous les cercles rendus, sans doublon
}
export function verifierTalus(d: DonneesTalus): ResultatTalus;
```

`verifierTalus` convertit φ en radians, prend γw = 9,81 kN/m³ (sourcé en commentaire : EN 1997-1, valeur usuelle,
modifiable plus tard), choisit le profil et les combinaisons, analyse le cercle imposé ou cherche le cercle
critique **pour chaque combinaison**, et **lève** si le cercle imposé est invalide (message contenant « cercle » et
le motif) ou si aucune recherche n'aboutit.

## Tâches

### T1 : coefficients de stabilité (`sol-ec7/src/coefficients.ts`)

- `Re` dans `profil1g()` : 1,0 / 1,1 / 1,0, source `EN 1997-1:2004, tableau A.14, valeur recommandée, jeu Rx`.
- `profilAnb2022(risque)` : nom contenant `NBN EN 1997-1 ANB:2022`. EQU, A1, R1 à R3 comme `profil1g()` mais
  sourcés « tableau A.x ANB ». A2 : γG 1,0, γQ 1,10 (`tableau A.3 ANB`). M1 : 1,0. M2 (`tableau A.4 ANB`,
  `A.4-bis ANB` pour faible, `A.4-ter ANB` pour élevé) : γφ = γc = 1,10 / 1,25 / 1,40 ; γcu = 1,25 / 1,40 / 1,55.
  `Re.R1` = 1,0 source `tableau A.14 ANB`. `approcheImposee: 'DA1'`.
- `combinaisonsStabilite1g` : lève (« approche ») si `p.approcheImposee` diffère. DA1 : `DA1-1` effets A1 M1 Re.R1,
  `DA1-2` actions A2 M2 Re.R1. DA2 : effets A1 M1 Re.R2. DA3 : actions A2 M2 Re.R3.
- `combinaisonsStabilite2g` : une combinaison `VC3 + M2`, mode actions, actions `gG_VC3` / `gG_fav` / `gQ_VC3`
  sans k_F, sol `gM2` × k_M et `gCuM2` × k_M, `gRe` = 1 source `EN 1997-3:2025, tableau 4.2, approche par les
  matériaux, sans facteur de résistance`.
- Fichiers : `sol-ec7/src/coefficients.ts`. Les tests existants (`tests/sol.test.ts`) doivent rester verts.

Tests : `tests/talus.test.ts`, bloc `T1`.

### T2 : Bishop simplifié (`sol-ec7/src/stabilite.ts`, `sol-ec7/src/index.ts`)

Suivre les **Spécifications**. Poids de colonne intégré par morceaux entre les cotes de base des couches et la
ligne piézométrique (γ au-dessus, γsat au-dessous) ; matériau de la tranche = couche à sa base. Itération de
Bishop jusqu'à |ΔF| < 1e-7, 200 itérations au plus, sinon invalide. Moment moteur ≤ 0 : invalide.

Tests : `tests/talus.test.ts`, bloc `T2`. Dépend de T1.

### T3 : recherche du cercle critique (`sol-ec7/src/stabilite.ts`)

Grille de centres sur l'emprise du profil et au-dessus du point haut, rayons balayés jusqu'à `coteLimite`
(défaut : la plus haute de la base de la dernière couche et de y_bas − 3H), puis raffinement par motifs (pas
divisé par 2 jusqu'à 0,05 m) depuis les trois meilleurs cercles. Cercles invalides écartés. Même `nbTranches`
partout ; le `resultat` rendu est exactement celui de `analyserCercle` sur le cercle rendu. Aucun cercle valide :
`null`. Point de départ autorisé : `Github\fondbis\src\briques\stabiliteGenerale.ts`, `rechercherCercleCritique`
(lecture seule, à adapter, sans reprendre son nombre de tranches séparé).

Tests : `tests/talus.test.ts`, bloc `T3`. Dépend de T2.

### T4 : noyau de l'outil (`stabilite-talus/src/talus.ts`)

Suivre l'interface. `alertes` sans doublon.

Tests : `stabilite-talus/tests/talus.test.ts`. Dépend de T1 à T3.

## Tests d'acceptation

Attendus calculés à part : forme fermée (argile φ = 0 et bande, F = c_u·2θ·R² / (q·a²/2)) et Bishop indépendant
en Python à 4000 tranches (cas à deux couches et ligne piézométrique), tolérance relative 0,5 %. Script hors dépôt.

Banc, depuis le dossier du dépôt concerné (pas de npm) :

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/lancer.mjs . talus
```

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/typecheck.mjs .
```

| Tâche | Dépôt | Commande | Résultat attendu |
|---|---|---|---|
| T1 | `sol-ec7` | `lancer.mjs . talus` | bloc T1 vert ; `lancer.mjs . sol` reste vert |
| T2 | `sol-ec7` | `lancer.mjs . talus` | blocs T1, T2 verts |
| T3 | `sol-ec7` | `lancer.mjs . talus` | tout vert ; typecheck 0 erreur |
| T4 | `stabilite-talus` | `lancer.mjs .` | tout vert ; typecheck 0 erreur |

Avant implémentation, tous ces tests échouent (exports absents).

## Règles pour l'exécutant

- Traiter T1 à T4 dans l'ordre. Écrire `HANDOFF.md` dans `stabilite-talus` (format du `CLAUDE.md` global).
- **Interdit** : modifier les fichiers `tests/` des deux dépôts, ouvrir les normes, toucher à `mur-en-l`,
  `fondations-superficielles` ou `_banc-local`, ajouter une dépendance, changer les valeurs ou sources de
  `profil1g()` / `profil2g()` existantes, lancer `git push` ou `git tag`.
- Lecture autorisée : les fichiers nommés ici, les tests, `sol-ec7/src/*`, et pour T3 seulement
  `fondbis/src/briques/stabiliteGenerale.ts`.
- Commit local par tâche, dans le dépôt concerné.
- Si un test paraît faux : ne pas le changer, passer la tâche en « bloquée » dans `HANDOFF.md`.
- Style : `CONVENTIONS.md`, identifiants et commentaires en français sans accents, messages d'erreur accentués.
- Point de décision laissé : l'organisation interne des fonctions et la grille de recherche, dans les limites de T3.
  Tout nom listé ici est imposé.

## Après ce lot (séance Claude)

Audit, tag `sol-ec7` v0.2.0, maquette de l'interface (coupe avec couches, ligne piézométrique, bandes, cercle et
tranches ; tableau des combinaisons ; profil normatif au choix), puis `PLAN-interface.md`.
