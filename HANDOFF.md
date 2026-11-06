# HANDOFF : lot talus (T1 a T3), sol-ec7

Exécutant : agents Haiku (T1 à T3 dans sol-ec7, puis T4), audit par la séance maître le 2026-11-06.
Dépôt : `Github\sol-ec7`, commits locaux, pas de push ni de tag, aucun fichier `tests/` modifié.

## T1 : coefficients de stabilité (`sol-ec7/src/coefficients.ts`)

**Statut** : fait. Commit `89963dc`.

**Fichiers modifiés**
- `sol-ec7/src/coefficients.ts` (ajouts : `Re` dans `Profil1g`, `approcheImposee`, `Risque`, `CombinaisonStabilite`, `profilAnb2022`, `combinaisonsStabilite1g`, `combinaisonsStabilite2g`, `Re` ajouté à `verifierProfil1g`).

**Décisions**
- Les valeurs et sources existantes de `profil1g()` / `profil2g()` ne sont pas touchées ; `Re` est ajouté seulement.
- `verifierProfil1g` vérifie aussi `Re` (une valeur sans source bloque le calcul).
- ANB 2022 : valeurs de `profil1g()` reprises pour EQU, A1, M1, R1 à R3, avec sources « NBN EN 1997-1 ANB:2022 » ; A2 à γQ 1,10 ; M2 selon le risque (φ et c : 1,10 / 1,25 / 1,40 ; cu : 1,25 / 1,40 / 1,55).

**Points douteux**
- Le plan ne fixe pas `Re.R2` et `Re.R3` pour l'ANB : repris de `profil1g()` (1,1 et 1,0), à confirmer.
- Les numéros de tableaux ANB (A.1 ANB, A.2 ANB, A.3 ANB, A.5 ANB) sont déduits du plan par analogie avec la 1re génération. Aucune norme n'a été ouverte, ils ne sont pas vérifiés.

**Statut des tests**
- Bloc T1 extrait dans un fichier temporaire (supprimé aussitôt) : `lancer.mjs . zz_scratch` → 5/5 verts.
- `lancer.mjs . sol` → 37/37 verts.

## T2 : Bishop simplifié (`sol-ec7/src/stabilite.ts`, `sol-ec7/src/index.ts`)

**Statut** : fait. Commit `e2b6981`.

**Fichiers modifiés**
- `sol-ec7/src/stabilite.ts` (nouveau) : `analyserCercle`, types du plan.
- `sol-ec7/src/index.ts` : export de `stabilite`.

**Décisions**
- Arc de glissement : partie inférieure du cercle sous le terrain, bornes exactes (intersection droite-cercle par segment du profil). Deux morceaux ou plus : invalide, motif « plusieurs points ».
- Sens : signe de Σ(W + G + Q)·sin α, valeurs caractéristiques. Le moment et m_α utilisent `sens · sin α` (correction en cours de tâche : sans elle, le cas B était faux de 16 %).
- Poids : intégré par morceaux entre les bases de couches et la ligne piézométrique (γ au-dessus, γsat au-dessous), tranches au milieu. Pression u = γw · (y_pz − y_base), y_pz prolongée horizontalement.
- Bishop : F = [Σ T_i / m_i(F)] / D, arrêt à |ΔF| < 1e-7 ou 200 itérations (invalide sinon). m_α borné à 0,2 avec avertissement. F initial = 1.
- Mode « effets » : les charges permanentes (poids du sol et G) prennent **γG,dst sur toutes les tranches**. Les surcharges variables suivent le sens (γQ,stb = 0 sur les tranches stabilisatrices).

**Points douteux**
- Écart à la lettre du plan : en mode « effets », γG,stb (A1 : 1,0) n'est pas appliqué aux tranches stabilisatrices. Variante « fidèle » (γG,stb sur ces tranches) : cas A DA2 à 9,2 % de l'attendu (FA / 1,35), cas B DA1-1 à 2,6 % hors tolérance. Les attendus indépendants tiennent avec γG,dst partout. À arbitrer à l'audit : c'est la variante retenue pour T2.
- La pression u n'est pas factorisée (aucun jeu ne la factorise dans le plan).
- Une tranche de poids négatif (numérateur) n'est pas traitée à part.

**Statut des tests**
- Bloc T2 extrait dans un fichier temporaire (supprimé) : `lancer.mjs . zz_scratch_t2` → 10/10 verts (après correction de m_α et adoption de γG,dst en effets).

## T3 : recherche du cercle critique (`sol-ec7/src/stabilite.ts`)

**Statut** : fait. Commit `d6c5804`.

**Fichiers modifiés**
- `sol-ec7/src/stabilite.ts` : `rechercherCercleCritique`.

**Décisions**
- Point de départ fondbis (`briques/stabiliteGenerale.ts`, lecture seule), adapté : grille 15 × 9 × 11 (centres de y_haut + 0,2H à y_haut + 3H, rayons de y_haut − y_c + 0,05H jusqu'à la cote limite), 8 directions de raffinement, pas initial max(Δx/14 ; H/4) divisé par 2 jusqu'à 0,05 m, depuis les trois meilleurs. Nombre de tranches unique (50 par défaut) pour la recherche et pour le cercle rendu.
- Cote limite par défaut : max(base de la dernière couche ; y_bas − 3H).
- `resultat` = `analyser` sur le cercle rendu, donc identique à `analyserCercle`.
- `nbCercles` : nombre de cercles analysés (hors rejets géométriques).

**Points douteux**
- Recherche sans tirage aléatoire, déterministe. Le minimum est un minimum local possible ; le test du talus sableux (F ≈ tan φ / tan β) passe mais la marge n'a pas été mesurée au-delà de la tolérance du test.

## Statut global

Commandes lancées depuis `sol-ec7`, avec `ELECTRON_RUN_AS_NODE=1` :
- `lancer.mjs . talus` : `ok tests\talus.test.ts (18/18)` (les 18 tests, blocs T1 à T3).
- `lancer.mjs . sol` : `ok tests\sol.test.ts (37/37)`.
- `typecheck.mjs .` : `typecheck : 0 erreur (TypeScript 6.0.3)`.

Hors périmètre : T4 (`stabilite-talus/src/talus.ts`), non traité. Aucune norme ouverte, aucun PDF lu, aucune dépendance ajoutée, aucun push ni tag.

## T4 : noyau de l'outil (`stabilite-talus/src/talus.ts`)

**Statut** : fait. Commit local « T4: noyau verifierTalus » (`src/talus.ts` seul ; ce fichier n'est pas commité).

**Fichiers modifiés**
- `stabilite-talus/src/talus.ts` (nouveau) : `verifierTalus`, types `CoucheSaisie`, `DonneesTalus`, `ResultatCombinaison`, `ResultatTalus`. Imports depuis `sol-ec7` uniquement, aucune dépendance ajoutée.
- `stabilite-talus/HANDOFF.md` : section T4 ajoutée (non commité).

**Décisions**
- Caracteristique (coefficients à 1) : cercle imposé analysé tel quel ; sinon recherche du cercle critique avec la même grille que les combinaisons, pour que `caracteristique.F` soit une valeur de même nature. Non spécifié dans PLAN.md.
- Gouvernant : combinaison de taux maximal, au premier rang en cas d'égalité. `tauxMax` = son taux.
- Nombre de tranches fixé à 50 (constante `NB_TRANCHES`), passé partout (recherche et cercle rendu).
- γw = 9,81 kN/m³ (constante `GAMMA_W`, commentée).
- `phiDeg` vérifié dans `]0 ; 90[` avant conversion, pour que le message porte « φ » quelle que soit l'arrondi de la conversion en radians.
- `alertes` : union des avertissements de tous les cercles rendus, sans doublon, dans l'ordre de calcul.
- Cercle imposé invalide pour une combinaison : levée immédiate (« Le cercle imposé est invalide pour … : motif »), jamais de F de remplacement.

**Points douteux**
- `risque` est ignoré avec le profil « valeurs recommandées » (1re génération) : pas de classe de risque dans ce profil. Aucune alerte n'est émise, l'utilisateur n'est pas prévenu si la classe saisie ne sert à rien.
- Pour la 2e génération, `approche` est ignorée (la combinaison unique est VC3 + M2) ; de même `profilNormatif` et `risque`.
- Un cercle imposé valide pour la caractéristique peut être invalide pour une combinaison (moment moteur nul après facteurs) : la levée est alors pour la combinaison, pas pour le cercle lui-même. Le message le dit.
- Les noms de combinaisons en 2e génération ne sont pas ceux de 1re génération : l'interface devra le savoir.

**Statut des tests**
- `ELECTRON_RUN_AS_NODE=1 "…/Code.exe" ../_banc-local/lancer.mjs .` (depuis `stabilite-talus`) : `ok tests\talus.test.ts (11/11)`, « 11 réussis, 0 échec ». Relancé après correction de commentaires : même résultat.
- `ELECTRON_RUN_AS_NODE=1 "…/Code.exe" ../_banc-local/typecheck.mjs .` : `typecheck : 0 erreur (TypeScript 6.0.3)`.
- `sol-ec7` non modifié, aucun fichier `tests/` modifié.

## Audit (séance maître, 2026-11-06)

- Tests relancés : sol-ec7 55/55, stabilite-talus 11/11, fondations-superficielles 359/359 ; typecheck 0 erreur partout. Fichiers `tests/` inchangés depuis d1e3ab1 et ecac488.
- Corrigé dans sol-ec7 (ede4c3a) : sources de R2 et R3 du profil ANB (l'ANB ne donne que R1, valeurs recommandées marquées « absent de l'ANB ») ; effort normal effectif borné à 0 ; commentaire du mode « effets » justifié par la norme et non par le test.
- Point douteux 1 (γG,dst sur toutes les tranches en mode effets) : conforme au plan, le facteur porte sur l'effet net d'une action de source unique.
- Choix gardé : en 2e génération, approche, profil et risque sont ignorés ; le risque n'agit qu'avec l'ANB. L'interface masquera ces champs.

## T1 interface : page, saisie et câblage (`app/`)

**Statut** : fait, tests d'acceptation de T1 verts. Commit « T1: page, saisie et cablage ».

**Fichiers modifiés**
- `app/src/form.ts` : `saisieParDefaut`, `lireSaisie`, `verifier` (noyau + coefficients de `sol-ec7`), `talusType`, `nappeHorizontale`, `serialiser`, `relire`, format `stabilite-talus/1`.
- `app/index.html` : page complète (saisie, cercle, génération, dessin, exports), titre « Stabilité de talus », hors périmètre annoncé, lien `en/`.
- `app/src/main.ts` : câblage comme le gabarit (clés `stabilite-talus/saisie` et `stabilite-talus:cartouche`), listes rendues dynamiquement, boutons de vue, options cotes et tranches, exports. Aucun calcul.
- `HANDOFF.md` : cette section.

**Décisions**
- Messages de refus en français, écrits dans `form.ts` (et non dans `textes.ts`, squelette de T2/T5). Format : « Contexte : nombre attendu, reçu « … » ». Une bande est nommée « surcharge en bande k » : le test exige la minuscule « bande k ».
- Cote limite illisible en recherche : refusée (le plan ne le dit pas ; la cote vide reste « pas de limite »).
- Ligne piézométrique : `piezo` est `null` quand la nappe est décochée ; la liste reste saisie.
- Couches : chaque couche est un `<fieldset>` avec légende « Couche k » (pas de tableau). Le nom vide devient « Couche k » dans les messages et dans le noyau.
- Comportement : en drainé, c_u est masqué ; en non drainé, φ’ et c’ sont masqués. Les valeurs masquées restent en mémoire, non lues.
- ANB 2022 : la liste d'approche est désactivée et affiche DA1 ; la valeur saisie n'est pas écrasée.
- Dessin : case « Tranches » décochée par défaut, « Cotes » cochée (comme le gabarit).
- `data-vue` identifie les boutons de vue ; `data-type` les champs du talus type ; `data-role="cote-horizontale"` la cote de la nappe horizontale.
- Le cartouche (projet, élément) est mémorisé à chaque saisie.
- `main.ts` lit `textes().messages.rienAExporter` (squelette de `textes.ts`, à écrire en T2).

**Points douteux**
- Page non ouverte dans un navigateur : `main.ts` appelle `verdictsHtml` au démarrage, qui lève « a ecrire » tant que `vue.ts` (T2) est un squelette. La saisie est bien remplie, mais aucun résultat ne s'affiche avant T2 ; la console montre l'erreur.
- Chaque frappe relance `verifier`, donc la recherche du cercle critique : pas de différé. À mesurer quand T2 est en place.
- Classes CSS de la maquette absentes de `style.css` (`couche`, `points`, `volet`, `boutons-generation`) : la page utilise les classes du gabarit ; la mise en forme des couches reste à vérifier visuellement. Aucune règle CSS ajoutée.
- `index.html` référence `icone.svg` et `icone-192.png`, à créer en T6.
- Le banc (`lancer.mjs . …`) rattache les échecs de `dessin.test.ts` au libellé `form.test.ts` dans le récapitulatif de la suite complète ; `form.test.ts` seul fait 24/24.

**Statut des tests**
- `lancer.mjs . form.test` : `24 réussis, 0 échec` (fichier seul).
- `lancer.mjs . page.test` : `12 réussis, 0 échec`.
- `typecheck.mjs .` : `typecheck : 0 erreur (TypeScript 6.0.3)`.
- Suite complète : `24 réussis, 32 échecs`. Les échecs sont les squelettes non écrits : `vue.ts` (T2, « a ecrire »), `dessin.ts` (T3), `note.ts` (T4), `en/` et `textes.ts` (T5). Aucun test de `form.test` ni de `page.test` n'échoue.

## T2 : verdicts, volets et textes (`app/src/vue.ts`, `app/src/textes.ts`)

**Statut** : fait. Commit « T2: verdicts, volets et textes ».

**Fichiers modifiés**
- `app/src/vue.ts` : `verdictsHtml`, `voletsHtml`, `tranchesHtml`, `blocEntrees`, `blocsResultat`, `messageDErreur`. Signatures du squelette conservées.
- `app/src/textes.ts` : `textes()`, `phrase`, `ponctuer`, type `Textes`. Français complet ; anglais complet en structure et en traduction courte (la relecture est T5).
- `HANDOFF.md` : cette section.

**Décisions**
- `voletsHtml` rend les coefficients partiels (avec leur source) et les hypothèses. Les tranches ne sont pas dans les volets : `main.ts` les affiche dans leur propre zone (`tranchesHtml(r, vue)`).
- Cartes de stabilité : une par combinaison, `data-verification` = nom, classe `depasse` seulement si taux > 1. Les alertes du noyau s'affichent sous les cartes sans marquer la carte.
- Le groupe `indicatif` porte le F caractéristique sans jauge ni seuil.
- Blocs d'entrée : symboles `profil`, `couche k`, `nappe`, `bande k`, `cercle` ou `cote limite`, puis `generation`, et selon la génération `approche` (et `risque`, `profil normatif`) en 1re, ou `classe` en 2e. La 2e génération n'affiche pas d'approche DA.
- Tranches : W, G, Q en kN/m (unité du noyau), α converti en degrés. « non retenue » seulement si Q > 0 et la surcharge n'est pas retenue.
- `phrase` : table exacte puis règle générique `sourceEn` (sources de coefficients, « action variable favorable »). En français, rien ne change.

**Points douteux**
- Les colonnes c′d, φ′d et force résistante de la maquette ne sont pas rendues : le noyau ne les porte pas dans `Tranche`.
- Traduction anglaise : écrite, non relue ; `anglais.test` (T5) n'a pas été lancé.
- Libellés de `blocsResultat` avec `F_d`, `γ_R;e` et `x_c` : la conversion en CSV est vérifiée par `vue.test` (CSV sans `_`).

**Statut des tests**
- `lancer.mjs . vue.test` : `71 réussis, 0 échec`.
- `typecheck.mjs .` : `typecheck : 0 erreur (TypeScript 6.0.3)`.
- Aucun fichier de `src/`, `tests/`, `dessin.ts`, `main.ts` ou `form.ts` modifié.

## T4 interface : note et exports (`app/src/note.ts`, `app/src/export.ts`, `app/src/textes.ts`)

**Statut** : fait, en attente d'une correction dans `vue.ts` (voir points douteux 1). Commit « T4: note et exports ».

**Fichiers modifiés**
- `app/src/note.ts` : `noteDuCalcul(calcul, r, cartouche)`. Signature conservée.
- `app/src/export.ts` : `STYLES_TRACE`, règles « Coupe du talus (T3) » de `style.css`, jetons remplacés par leurs valeurs (`--eau` compris).
- `app/src/textes.ts` : clé `note` ajoutée en FR et EN (élément, légende, « aucune surcharge », clauses, hypothèses). Aucune clé existante touchée.

**Décisions**
- Sections : géométrie = bloc des lignes `profil`, `cercle`, `cote limite` et la coupe cotée de la vue gouvernante (une seule figure) ; matériaux = `couche k` ; hypothèses = `nappe` et les choix normatifs, puis la liste (profil normatif via `phrase`, puis les hypothèses fixes) ; charges = `bande k`, ou le texte « Aucune surcharge en bande. ».
- Règle de rangement : tout symbole non reconnu va aux hypothèses, pour qu'aucune ligne de `blocEntrees` ne se perde.
- Calculs : les blocs de `blocsResultat` sans la synthèse (un par combinaison, puis « F caractéristique »), suivis d'un bloc de coefficients partiels par combinaison, mode en note du bloc. Les coefficients ne figuraient pas dans la spécification T4 ; ils viennent du gabarit fondations. Pour les retirer, supprimer `...blocsCoefficients(r)`.
- Vérifications : une par combinaison, nom = `phrase(c.nom)`, clause §11.5.1 (1re) ou EN 1997-3 §4.6.3 (2e), taux = `c.taux`, ok = `taux <= 1`. Pas de verdict global ; la note affiche la verification déterminante.
- Avertissements : `r.alertes` via `phrase`.
- Normes du cartouche : 1re, avec ANB si `profilNormatif === 'anb2022'` ; 2e. Outil `stabilite-talus`. Élément vide : « Talus » / « Slope ».
- Textes des hypothèses écrits sans `_` ni balise (convention de `textes.ts`) : `γw`, `mα`, `10⁻⁷`. La liste passe par `notationHtml`, qui échapperait les balises.
- Aucun `Math.sin/cos/tan/atan/exp/sqrt` dans `note.ts`. Aucune dépendance ajoutée.

**Points douteux**
1. Bloquant, hors de mon périmètre : 17 tests de `note.test` (« texte visible de la note ») échouent. Le seul constat est « accent manquant » sur le symbole `generation` (ligne de choix générée par `blocEntrees`, `vue.ts`, qui figure dans `MOTS_SANS_ACCENT`). Le test porte bien sur le texte affiché : il a raison. Correction proposée à faire dans `vue.ts` : symbole `génération` (accentué). Le test « rangées une fois » compare à `blocEntrees`, il reste vert.
2. Anglais : `phrase(r.profil)` ne traduit pas le profil de 2e génération, « EN 1997:2024-2025, valeurs recommandées » (dans la note comme dans les verdicts). À ajouter à la table exacte de `textes.ts` (T2/T5). Le nom du profil (« EN 1997:2024-2025 ») diffère aussi de la norme du cartouche (« EN 1997-1:2024, EN 1997-3:2025 »). À arbitrer.
3. `anglais.test` : échecs sur la page anglaise (T5) et sur les textes français des volets et verdicts (T2). Le texte de la note en anglais n'est signalé que pour le point 2.
4. Les textes des hypothèses sont en clair Unicode (`mα`, `γw`) faute de balises ; lisibilité un peu moindre que `m<sub>α</sub>` de la maquette.

**Statut des tests**
- `lancer.mjs . note.test` : 35 réussis, 17 échecs (tous « texte visible de la note », point douteux 1).
- `lancer.mjs .` : 198 réussis, 24 échecs (17 de note, 7 de anglais, dont 2 liés à la note, point douteux 2).
- `typecheck.mjs .` : 0 erreur (TypeScript 6.0.3).
- Fichiers `tests/`, `src/`, `dessin.ts`, `vue.ts`, `main.ts`, `style.css` non modifiés.

## T5 interface : version anglaise (`app/en/index.html`, `app/src/textes.ts`)

**Statut** : fait. `anglais.test` : 24 réussis. Suite complète : 222 réussis, 0 échec. Typecheck : 0 erreur. Le point 2 de T4 (profil de 2e génération traduit) est résolu.

**Fichiers modifiés**
- `app/en/index.html` : squelette identique à `app/index.html` (id, data-*, type, inputmode, accept, value, même ordre), textes anglais, `lang="en"`, lien `../` vers la version française, script `../src/main.ts`.
- `app/src/textes.ts` : clés `entrees.symboles`, `resultats.symboles`, `refus` (messages de saisie) et `page` (libellés générés par `main.ts`) en FR et EN. Table `EXACTES` et règles `REGLES` pour les phrases du noyau (cercle imposé, aucun cercle, approche refusée, angle de frottement, cohésion, c_u, poids volumiques, cotes de base, charge de bande, motifs, profils et sources, 2e génération).
- `app/src/form.ts` : les messages de refus passent par `textes().refus`.
- `app/src/vue.ts` : symboles de `blocEntrees` et de `blocsResultat` lus dans `textes()`.
- `app/src/note.ts` : `sectionDe` compare aux symboles de `textes()` (plus de chaînes fixes).
- `app/src/main.ts` : retirer, couches, surcharges, nature, vue caractéristique, message du talus type et erreur d'élément absent passent par `textes().page` et `textes().refus`.

**Décisions**
- Symboles en anglais : profile, layer, piezo, strip, circle, depth limit, approach, risk, normative profile, class. En français, ils restent ceux de la spécification (les tests fr les lisent).
- Aucun `_` dans les traductions : « m_α » devient « mα », car `notationHtml` ne transforme `_` que devant un indice alphanumérique, pas devant une lettre grecque.
- Guillemets anglais “ ” dans les messages de saisie.
- Aucune dépendance ajoutée. Aucun fichier de `src/`, `tests/`, `sol-ec7`, `fondations-superficielles`, `_banc-local` modifié.

**Points douteux**
1. La traduction anglaise est écrite par Claude, non relue par un anglophone. Les libellés de la page n'ont pas été vérifiés à l'écran (aucun lancement dans le navigateur).
2. Certains messages du noyau ont une règle ou une entrée mais aucun test ne les lit en anglais : non-convergence de Bishop, risque inconnu, poids volumique de l'eau, nombre de tranches.
3. `main.ts` n'est testé que structurellement (`page.test`) : les parcours de clic en anglais ne sont pas testés.
4. `sourceEn` reste une traduction mot à mot. Une phrase du noyau non prévue sort en français, et seul un marqueur français la fait échouer dans `anglais.test`.

**Statut des tests**
- `lancer.mjs . anglais.test` : 24 réussis, 0 échec.
- `lancer.mjs .` (suite complète) : 222 réussis, 0 échec.
- `typecheck.mjs .` : 0 erreur (TypeScript 6.0.3).
