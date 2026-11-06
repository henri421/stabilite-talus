/**
 * Les traits de la coupe du talus, repris par le SVG exporte et par la note. Les classes sont celles
 * que `dessin.ts` pose sur ses elements. Valeurs des jetons de `style.css` (`:root`) et de `--eau`,
 * ecrites en dur : le SVG exporte doit tenir seul, sans la feuille de l'app.
 */
export const STYLES_TRACE = `
svg .ligne-terrain { fill: none; stroke: #1a1a1a; stroke-width: 1.6; stroke-linejoin: round; }
svg .piezo { fill: none; stroke: #3a7ca5; stroke-width: 1.4; stroke-dasharray: 7 4; }
svg .couche { stroke: none; }
svg .couche-draine { fill: #ede6d6; }
svg .couche-non-draine { fill: #e3e0da; }
svg .limite-couche { stroke: #9a978f; stroke-width: 1; stroke-dasharray: 4 3; }
svg .masse { fill: #a52121; fill-opacity: 0.07; stroke: none; }
svg .cercle { fill: none; stroke: #a52121; stroke-width: 2; }
svg .centre { fill: #a52121; stroke: none; }
svg .rayon { stroke: #a52121; stroke-width: 0.8; stroke-dasharray: 3 3; }
svg .tranche { stroke: #a52121; stroke-opacity: 0.45; stroke-width: 0.8; }
svg .bande { fill: #e7eaee; stroke: #4a4842; stroke-width: 1; }
svg .bande.variable { fill: #a8442a; fill-opacity: 0.14; stroke: #a8442a; stroke-dasharray: 5 3; }
svg .cote-limite { stroke: #a52121; stroke-width: 1; stroke-dasharray: 6 3; }
svg .cote { stroke: #6a6862; stroke-width: 0.8; fill: #6a6862; font-size: 11px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
svg text.cote { stroke: none; }
svg .texte-coupe { fill: #4a4842; font-size: 11px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
svg .texte-eau { fill: #3a7ca5; font-size: 11px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
svg .texte-refus { fill: #a52121; font-size: 11px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
svg .titre-coupe { fill: #a52121; font-size: 12px; font-weight: 600; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
`;
