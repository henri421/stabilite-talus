# Stabilité de talus : plan de l'interface

Rédigé le 2026-11-06. Le noyau (`src/talus.ts`, `sol-ec7` 0.2.0) est écrit et audité. Reste la page, sur le gabarit de
`fondations-superficielles` (lui-même tiré du mur en L). Maquette validée le 2026-11-06 :
`plan-webaedificium/maquette-stabilite-talus.html`. Les tests d'acceptation sont dans `tests/app/`, le squelette de
`app/` et sa configuration sont en place (T0).

## Spécifications

Entrée du calcul : `verifierTalus(donnees)`, appelée par `verifier` dans `form.ts`, qui y ajoute la génération et les
coefficients de chaque combinaison (`combinaisonsStabilite1g` ou `2g` de `sol-ec7`, même profil que le noyau). L'interface
ne calcule rien d'autre que des présentations : α en degrés, et les coordonnées du dessin (interpolation du profil comprise).

- **Profil du terrain** : tableau de points (x, y), ajout et retrait de lignes. Aide « Talus type » : hauteur H, pente n
  (horizontal pour 1 vertical), longueurs de crête et de pied → `talusType`. Les x doivent croître (le noyau le vérifie).
- **Couches** : un bloc par couche (pas de tableau), nom, boutons Drainé / Non drainé, cote de base, γ et γsat, φ'k et c'k
  (drainé) ou c_u,k (non drainé). Une couche va de sa base à la couche du dessus.
- **Ligne piézométrique** : case « Nappe à prendre en compte », tableau de points, aide « Horizontale » → `nappeHorizontale`.
  γw = 9,81 kN/m³, annoncé.
- **Surcharges en bande** : x début, x fin, q, nature G ou Q.
- **Cercle** : boutons « Rechercher le critique » (cote limite, vide = sans limite) et « Imposer » (x_c, y_c, R).
- **Génération** : 1re par défaut, les données restent au basculement. 1re : coefficients « valeurs recommandées » ou
  « NBN EN 1997-1 ANB:2022 » ; avec l'ANB, l'approche est DA1 (liste grisée, `lireSaisie` passe DA1) et le risque
  (faible, normal, élevé) apparaît. 2e : classe de conséquences seule (VC3 + M2).
- **Refus à la saisie** : nombre illisible (en nommant la liste, le rang du point ou le nom de la couche), φ'k hors de
  ]0, 90[, c_u,k ≤ 0. Le reste est refusé par le noyau, dont le message s'affiche tel quel (traduit en anglais).
- **Dessin** : une coupe à l'échelle réelle, même échelle en x et en y. Boutons de vue : « Caractéristique » puis chaque
  combinaison ; la gouvernante s'ouvre d'abord. Options « tranches » (une dizaine sur 50) et « cotes ».
- **Verdicts**, deux groupes : `stabilite` (une carte par combinaison, dans l'ordre du noyau, `data-verification` = nom
  de la combinaison, F_d, taux = γR;e / F_d, centre et rayon du cercle, « gouvernant » sur la pire) et `indicatif`
  (F caractéristique, sans jauge ni seuil). Pas de verdict global, pas de cible F = 1,5. Le profil normatif (`r.profil`)
  titre le groupe. Clauses : 1re §11.5.1 (tableaux A.3, A.4, A.14) ; 2e EN 1997-3 §4.6.3, tableau 4.2. Alertes du noyau
  (`r.alertes`) en clair sous les cartes.
- **Volets** : coefficients de chaque combinaison avec leur source (`Resultat.coefficients`), hypothèses (Bishop
  simplifié, γw, 50 tranches, surcharge variable stabilisatrice non comptée, m_α borné à 0,2, couches horizontales,
  une seule ligne piézométrique), et le tableau des tranches de la vue affichée (`tranchesHtml`).
- **Sorties** : note commune d'aedificium-ui, SVG de la coupe, CSV, JSON (format `stabilite-talus/1`), version anglaise
  sous `/en/`.

Hors périmètre annoncé à l'écran : surfaces non circulaires, couches inclinées, renforcements et clous, séisme, fissures
de traction, succion, eau libre au-dessus du terrain, états limites de service.

Écart à la maquette, voulu : le cas par défaut. Sur le talus 1/1 de la maquette, la recherche trouve un cercle de
parement instable (F caractéristique 1,15) ; le défaut devient un talus 3H/2V, limon c'k = 10 kPa, qui donne DA1-2
gouvernant à 0,878 sur un cercle profond.

## Contrat des modules

Les tests lisent ces noms, qui ne se négocient pas. Les types sont déjà dans les squelettes.

- `app/src/form.ts` : `Saisie`, `saisieParDefaut`, `lireSaisie`, `Calcul`, `Resultat`, `verifier`, `talusType`,
  `nappeHorizontale`, `serialiser`, `relire`. Valeurs par défaut en tête de `tests/app/form.test.ts`.
- `app/src/vue.ts` : `verdictsHtml(r)`, `voletsHtml(r)`, `tranchesHtml(r, vue)`, `blocEntrees(calcul)`, `blocsResultat(r)`,
  `messageDErreur(e)`. Chaque tranche porte `data-tranche`. Symboles de `blocEntrees` : `profil`, `couche k`, `nappe`,
  `bande k`, `cercle` ou `cote limite`, puis les choix normatifs.
- `app/src/dessin.ts` : `vuesDisponibles(r)`, `vueGouvernante(r)`, `coupe(calcul, r, vue, options)`. Une vue est une
  chaîne : `'caracteristique'` ou le nom d'une combinaison. Classes imposées en tête de `tests/app/dessin.test.ts`. Les
  tranches dessinées viennent de `resultat.tranches` (`x`, `b`, `ySol`, `yBase`) ; les extrémités de l'arc sont sur le terrain.
- `app/src/note.ts` : `noteDuCalcul(calcul, r, cartouche)`. `app/src/export.ts` : `STYLES_TRACE`.
- `app/src/textes.ts` : `textes()`, `phrase`.

Dessin et mise en page suivent la maquette, lue par morceaux : styles lignes 7 à 97, saisie 110 à 189, coupe 192 à 233,
volets 235 à 252, verdicts 255 à 260.

## Tâches

| Tâche | Fichiers | Gabarit à lire | Filtre de test | Dépend de | Qui |
| --- | --- | --- | --- | --- | --- |
| T0 | `tests/app/*`, `vite.config.ts`, squelettes | | | | fait |
| T1 | `app/index.html`, `form.ts`, `main.ts` | `fondations-superficielles/app/index.html`, `form.ts`, `main.ts` | `form.test`, `page.test` | T0 | fait (7e5539e) |
| T2 | `vue.ts`, `textes.ts` | `fondations-superficielles/app/src/vue.ts`, `textes.ts` | `vue.test` | T1 | fait (5ccec80) |
| T3 | `dessin.ts` | la maquette | `dessin.test` | T1 | fait (0416863), contrôle visuel fait |
| T4 | `note.ts`, `export.ts` | `fondations-superficielles/app/src/note.ts`, `export.ts` | `note.test` | T2, T3 | fait (530768a) |
| T5 | `app/en/index.html`, `textes.ts` | `fondations-superficielles/app/en/index.html` | `anglais.test` | T4 | fait (83ee86a) |
| T6 | icônes, README, lock, publication | | | T5 | local fait (ba03162) ; lock et publication en attente du dépôt |
| T7 | carte et menu du hub ; renvoi de Fondbis | | | T6 | carte locale (hub d0a6711), non poussée ; renvoi de Fondbis à faire |

`app/src/style.css` et `pwa.ts` sont déjà copiés des fondations : n'ajouter à la fin de `style.css` que les règles
manquantes (la classe `.terrain` y remplit une surface : le profil dessiné s'appelle donc `ligne-terrain`). `page.test`
lit `main.ts` tel qu'il sera à la fin : ses tests « main.ts » ne passent qu'après T4.

## Commandes

Depuis le dépôt, une tâche (remplacer le filtre), puis tout, puis le typage :

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/lancer.mjs . form.test
```

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/lancer.mjs .
```

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/typecheck.mjs .
```

Résultat attendu à la fin de T5 : tous les tests réussis, 0 erreur de typage. Avant T1, les fichiers de `tests/app/`
ne se chargent pas (les squelettes lèvent « a ecrire »). Les tests d'interface n'ont encore jamais tourné sur du code :
un test qui paraît faux se signale, il ne se corrige pas.

## Interdits pour l'exécutant

Modifier `src/`, `tests/`, `sol-ec7`, `fondations-superficielles`, `mur-en-l`, `_banc-local` ; calculer dans `app/` ;
ajouter une dépendance ; `git push`, `git tag`. Pas de fond noir ni d'interface façon tableur (les couches sont des blocs,
pas un tableau). Si un test paraît faux, s'arrêter sur cette tâche et le signaler dans `HANDOFF.md`.

## Publication (à faire dans cet ordre)

1. L'utilisateur crée, vide et public, `henri421/stabilite-talus`.
2. `sol-ec7` : pousser `main`, poser et pousser le tag `v0.2.0`.
3. `stabilite-talus` : lock (`elaguer_lock.py`), workflow `pages.yml` copié des fondations, pousser `main` ;
   l'utilisateur active Pages (source GitHub Actions).
4. Une fois la page en ligne : carte du hub, puis renvoi du module talus de Fondbis vers le nouvel outil.
