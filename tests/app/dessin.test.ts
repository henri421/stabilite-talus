/**
 * T3 : la coupe, lue dans le SVG lui-meme.
 *
 * Classes imposees :
 *  - `polyline.ligne-terrain` : le profil, un sommet par point saisi ;
 *  - `polyline.piezo` : la ligne piezometrique, absente sans nappe ;
 *  - `line.limite-couche` : une par limite entre deux couches ;
 *  - `path.cercle` : l'arc de glissement, commande `A r r ...` ; `circle.centre` : son centre ;
 *  - `line.tranche` : quelques tranches (option « tranches ») ;
 *  - `rect.bande`, avec `permanente` ou `variable` : les surcharges ;
 *  - `line.cote-limite` : la cote limite de la recherche ;
 *  - `.cote` : ce que retire l'option « cotes ».
 */

import { describe, expect, it } from 'vitest';
import { constatsAffichage, nombreAffiche, texteVisible } from 'aedificium-ui';
import { saisieParDefaut, type Resultat } from '../../app/src/form';
import { coupe, vueGouvernante, vuesDisponibles } from '../../app/src/dessin';
import { calculer, impose, LIMON, SAISIES, versLaGauche } from './_commun';

const TOUT = { cotes: true, tranches: true };
const balises = (svg: string, element: string, classe: string): string[] =>
  [...svg.matchAll(new RegExp(`<${element}\\b[^>]*>`, 'g'))].map((m) => m[0]).filter((b) => new RegExp(`class="[^"]*\\b${classe}\\b`).test(b));
const une = (svg: string, element: string, classe: string): string => {
  const l = balises(svg, element, classe);
  expect(l, `${element}.${classe}`).toHaveLength(1);
  return l[0];
};
const attribut = (balise: string, nom: string): string => new RegExp(`\\s${nom}="([^"]*)"`).exec(balise)?.[1] ?? '';
const sommets = (balise: string): { X: number; Y: number }[] =>
  attribut(balise, 'points')
    .trim()
    .split(/\s+/)
    .map((p) => p.split(',').map(Number))
    .map(([X, Y]) => ({ X, Y }));

const cercleDe = (r: Resultat, vue: string) => (vue === 'caracteristique' ? r.caracteristique.cercle : r.combinaisons.find((c) => c.nom === vue)?.cercle);
const FDe = (r: Resultat, vue: string) => (vue === 'caracteristique' ? r.caracteristique.F : r.combinaisons.find((c) => c.nom === vue)?.F);

/** Echelle et origine lues sur le profil dessine. */
function repere(svg: string, profil: { x: number; y: number }[]) {
  const s = sommets(une(svg, 'polyline', 'ligne-terrain'));
  expect(s).toHaveLength(profil.length);
  const n = profil.length - 1;
  const ex = (s[n].X - s[0].X) / (profil[n].x - profil[0].x);
  const i = profil.findIndex((p) => p.y !== profil[0].y);
  const ey = -(s[i].Y - s[0].Y) / (profil[i].y - profil[0].y);
  return { ex, ey, X: (x: number) => s[0].X + (x - profil[0].x) * ex, Y: (y: number) => s[0].Y - (y - profil[0].y) * ex };
}

describe('vues', () => {
  it('la caracteristique, puis chaque combinaison', () => {
    expect(vuesDisponibles(calculer(saisieParDefaut()).r)).toEqual(['caracteristique', 'DA1-1', 'DA1-2']);
    expect(vuesDisponibles(calculer({ ...saisieParDefaut(), generation: '2e' }).r)).toEqual(['caracteristique', 'VC3 + M2']);
  });

  it('la vue gouvernante ouvre le dessin', () => {
    expect(vueGouvernante(calculer(saisieParDefaut()).r)).toBe('DA1-2');
    expect(vueGouvernante(calculer({ ...saisieParDefaut(), approche1: 'DA3' }).r)).toBe('DA3');
  });
});

describe('coupe a l echelle', () => {
  for (const [nom, s] of [['defaut', saisieParDefaut()], ['impose', impose()], ['vers la gauche', versLaGauche()], ['sans cote limite', { ...saisieParDefaut(), coteLimite: '' }]] as const) {
    it(`${nom} : meme echelle en x et en y, centre et rayon du cercle de chaque vue`, () => {
      const { calcul, r } = calculer(s);
      for (const vue of vuesDisponibles(r)) {
        const svg = coupe(calcul, r, vue, TOUT);
        const p = repere(svg, calcul.donnees.profil);
        expect(Math.abs(p.ey - p.ex) / p.ex).toBeLessThan(0.01);
        const c = cercleDe(r, vue);
        if (!c) throw new Error('vue inconnue');
        const centre = une(svg, 'circle', 'centre');
        expect(Math.abs(Number(attribut(centre, 'cx')) - p.X(c.xc))).toBeLessThan(1);
        expect(Math.abs(Number(attribut(centre, 'cy')) - p.Y(c.yc))).toBeLessThan(1);
        const arc = /A\s*([\d.]+)[\s,]+([\d.]+)/.exec(attribut(une(svg, 'path', 'cercle'), 'd'));
        expect(arc).not.toBeNull();
        expect(Math.abs(Number(arc?.[1]) - c.R * p.ex) / (c.R * p.ex)).toBeLessThan(0.01);
        const [vx, vy, vw, vh] = attribut(svg.slice(0, svg.indexOf('>') + 1), 'viewBox').split(/\s+/).map(Number);
        const dedans = (X: number, Y: number) => X >= vx && X <= vx + vw && Y >= vy && Y <= vy + vh;
        expect(dedans(p.X(c.xc), p.Y(c.yc))).toBe(true);
        for (const q of calcul.donnees.profil) expect(dedans(p.X(q.x), p.Y(q.y))).toBe(true);
      }
    });
  }
});

describe('elements du dessin', () => {
  const { calcul, r } = calculer(saisieParDefaut());
  const svg = coupe(calcul, r, 'DA1-2', TOUT);

  it('nappe, limites de couche, cote limite', () => {
    expect(balises(svg, 'polyline', 'piezo')).toHaveLength(1);
    expect(balises(svg, 'line', 'limite-couche')).toHaveLength(1);
    expect(balises(svg, 'line', 'cote-limite')).toHaveLength(1);
    const sans = calculer({ ...saisieParDefaut(), avecNappe: false, couches: [{ ...LIMON, base: '-40' }] });
    const s2 = coupe(sans.calcul, sans.r, 'DA1-2', TOUT);
    expect(balises(s2, 'polyline', 'piezo')).toHaveLength(0);
    expect(balises(s2, 'line', 'limite-couche')).toHaveLength(0);
    const i = calculer(impose());
    expect(balises(coupe(i.calcul, i.r, 'DA1-2', TOUT), 'line', 'cote-limite')).toHaveLength(0);
  });

  it('bandes de surcharge, permanentes ou variables', () => {
    const { calcul: c, r: x } = calculer({
      ...saisieParDefaut(),
      bandes: [
        { x0: '-12', x1: '-4', q: '10', nature: 'Q' },
        { x0: '-20', x1: '-14', q: '15', nature: 'G' },
      ],
    });
    const s = coupe(c, x, 'DA1-2', TOUT);
    expect(balises(s, 'rect', 'bande')).toHaveLength(2);
    expect(balises(s, 'rect', 'variable')).toHaveLength(1);
    expect(balises(s, 'rect', 'permanente')).toHaveLength(1);
    expect(balises(svg, 'rect', 'bande')).toHaveLength(0);
  });

  it('options : tranches et cotes', () => {
    const n = balises(svg, 'line', 'tranche').length;
    expect(n).toBeGreaterThanOrEqual(5);
    expect(n).toBeLessThanOrEqual(12);
    expect(balises(coupe(calcul, r, 'DA1-2', { cotes: true, tranches: false }), 'line', 'tranche')).toHaveLength(0);
    expect(svg).toMatch(/class="[^"]*\bcote\b/);
    expect(coupe(calcul, r, 'DA1-2', { cotes: false, tranches: true })).not.toMatch(/class="[^"]*\bcote\b/);
  });

  it('titre : la vue et son F', () => {
    for (const vue of vuesDisponibles(r)) {
      const t = texteVisible(coupe(calcul, r, vue, TOUT));
      expect(t).toContain(nombreAffiche(FDe(r, vue) as number, 3));
      expect(t).toContain(vue === 'caracteristique' ? 'caractéristique' : vue);
    }
  });

  it('couches nommees sur le dessin', () => {
    const t = texteVisible(svg);
    expect(t).toContain('Limon');
    expect(t).toContain('Argile');
  });
});

describe('toutes les saisies, toutes les vues', () => {
  for (const [nom, s] of SAISIES) {
    it(nom, () => {
      const { calcul, r } = calculer(s);
      for (const vue of vuesDisponibles(r)) {
        const svg = coupe(calcul, r, vue, TOUT);
        for (const x of ['NaN', 'Infinity', 'undefined', 'null']) expect(svg).not.toContain(x);
        expect(constatsAffichage(texteVisible(svg))).toEqual([]);
      }
    });
  }
});
