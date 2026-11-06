# stabilite-talus

Stabilité générale d'un talus, d'un déblai ou d'un remblai par la **méthode de Bishop simplifiée**, selon
l'**EN 1997** et l'**EN 1990**, dans leurs **deux générations**. Un bouton bascule de l'une à l'autre
**sans rien ressaisir**.

Fait partie de la suite [Aedificium web](https://henri421.github.io/WebAedificium/).
Page publiée : <https://henri421.github.io/stabilite-talus/> (en anglais : `/en/`).

> **Aide au calcul. L'outil constate, il ne prescrit pas.** Valeurs recommandées des normes, ou profil
> belge NBN EN 1997-1 ANB:2022 au choix en 1ʳᵉ génération. La 2ᵉ génération n'est applicable qu'une fois
> son annexe nationale publiée. **Les valeurs ont été comparées à une forme fermée et à un calcul de
> Bishop indépendant, pas encore à un logiciel du commerce.** La vérification finale incombe à
> l'ingénieur du projet.

## Ce que l'outil rend

- **Taux de travail** γR;e / F_d pour chaque combinaison, chacune sur **son propre cercle critique**
  (recherche avec cote limite facultative) ou sur un cercle imposé.
- **F caractéristique** (coefficients à 1) à titre indicatif, sans seuil : la norme vérifie les
  combinaisons, pas un F global.
- **1ʳᵉ génération** : DA1 (par défaut), DA2, DA3 ; tableaux A.3, A.4 et A.14 de l'EN 1997-1:2004, ou
  profil ANB 2022 (DA1 imposée, γQ = 1,10 en A2, jeu M2 selon le risque faible, normal ou élevé).
  **2ᵉ génération** : VC3 + M2, approche par les matériaux (EN 1997-3:2025, 4.6.3 et tableau 4.2),
  classes de conséquences CC1 à CC3.
- Couches **drainées** (φ'k, c'k) et **non drainées** (c_u,k) dans le même talus, ligne piézométrique
  quelconque, surcharges en bande permanentes ou variables.
- **Coupe** à l'échelle réelle (même échelle en x et en y) : terrain, couches, nappe, surcharges,
  cercle et tranches de chaque combinaison ; le cercle gouvernant s'ouvre d'abord.
- **Tableau des tranches** : poids, surcharges, pression d'eau, α, matériau, m_α.
- **Sorties** : note de calcul HTML produite par les mêmes fonctions que l'écran, coupe (SVG),
  résultats (CSV), saisie enregistrée (JSON, format `stabilite-talus/1`).

## Choix déclarés

- 50 tranches, les mêmes pour la recherche et pour le cercle rendu.
- DA1-1 et DA2 : coefficients sur le moment moteur net (effets) ; DA1-2, DA3 et 2ᵉ génération :
  coefficients sur les charges et les paramètres du sol.
- Une surcharge variable du côté stabilisateur du cercle n'est pas comptée.
- m_α borné à 0,2, avec alerte ; eau au-dessus du terrain signalée, son poids n'est pas modélisé.
- γw = 9,81 kN/m³. Aucune valeur inventée : φ'k hors de ]0, 90[ et c_u ≤ 0 sont refusés à la saisie.

## Hors périmètre

Surfaces non circulaires, couches inclinées, renforcements et clous (outil séparé à venir), séisme,
fissures de traction, succion, eau libre au-dessus du terrain, états limites de service.

## Origine des moteurs

Ce dépôt appelle deux paquets de la suite : `sol-ec7` (coefficients partiels, Bishop, recherche du
cercle critique) et `aedificium-ui` (interface et note). L'assemblage est dans `src/talus.ts`.

## Développement

```bash
npm install
npm run typecheck
npm test
npm run build
```

Licence MIT.
