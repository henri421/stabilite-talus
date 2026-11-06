/**
 * La coupe du talus : terrain, couches, ligne piezometrique, cercle de glissement et
 * ses tranches, surcharges, cotes. PUR : aucun texte n'est lu au chargement du module.
 *
 * Une seule echelle, en x et en y : un talus raide reste raide a l'ecran. Le dessin ne
 * calcule rien d'autre que des positions (interpolation du profil pour les extremites de
 * l'arc). Aucun NaN ni Infinity n'atteint un attribut.
 */

import { echapper, langueCourante, nombreAffiche, notationSvg } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';

type Point = Calcul['donnees']['profil'][number];
type Couche = Calcul['donnees']['couches'][number];
type Tranche = Resultat['caracteristique']['resultat']['tranches'][number];
type Cercle = Resultat['caracteristique']['cercle'];

/** Largeur du viewBox, hauteur calculee. Marges en pixels, pour les textes et les cotes. */
const LARGEUR = 640;
const PAD = { gauche: 34, droite: 84, haut: 50, bas: 46 };
/** Hauteur maximale du talus dessine, en pixels. */
const HAUTEUR_MAX = 360;
const HAUTEUR_BANDE = 12;
const ECART_BANDE = 2;
/** Une dizaine de tranches, sur les 50 du calcul. */
const NB_TRANCHES_DESSINEES = 10;

interface Libelles {
  aria: string;
  titreCaracteristique: (F: string) => string;
  titreVue: (vue: string, F: string) => string;
  nappe: string;
  centre: (x: string, y: string) => string;
  rayon: (R: string) => string;
  coteLimite: (y: string) => string;
  longueur: (v: string) => string;
  hauteur: (v: string) => string;
  surcharge: (nature: 'G' | 'Q', q: string) => string;
  couche: (c: Couche) => string;
}

const valeur = (v: number | undefined): string => (v === undefined ? '—' : nombreAffiche(v));

/** Une couche : nom, puis ses parametres (drainee : φ'k et c'k ; non drainee : c_u,k). */
function libelleCouche(c: Couche, nonDrainee: string, drainee: (phi: string, cohesion: string) => string): string {
  if (c.drainage === 'non_draine') return `${c.nom} · ${nonDrainee}`;
  return `${c.nom} · ${drainee(valeur(c.phiDeg), valeur(c.c))}`;
}

const FR: Libelles = {
  aria: 'Coupe du talus, couches, ligne piézométrique et cercle de glissement',
  titreCaracteristique: (F) => `caractéristique : F = ${F}`,
  titreVue: (vue, F) => `${vue} : F_d = ${F}`,
  nappe: 'ligne piézométrique',
  centre: (x, y) => `O (${x} ; ${y})`,
  rayon: (R) => `R = ${R} m`,
  coteLimite: (y) => `cote limite ${y} m`,
  longueur: (v) => `L = ${v} m`,
  hauteur: (v) => `H = ${v} m`,
  surcharge: (nature, q) => `${nature} ${q} kPa`,
  couche: (c) =>
    libelleCouche(c, `c_u,k ${valeur(c.cu)} kPa (non drainé)`, (phi, cohesion) => `φ'k ${phi}° · c'k ${cohesion} kPa`),
};

const EN: Libelles = {
  aria: 'Cross-section of the slope, layers, piezometric line and sliding circle',
  titreCaracteristique: (F) => `characteristic : F = ${F}`,
  titreVue: (vue, F) => `${vue} : F_d = ${F}`,
  nappe: 'piezometric line',
  centre: (x, y) => `C (${x} ; ${y})`,
  rayon: (R) => `R = ${R} m`,
  coteLimite: (y) => `limit level ${y} m`,
  longueur: (v) => `L = ${v} m`,
  hauteur: (v) => `H = ${v} m`,
  surcharge: (nature, q) => `${nature} ${q} kPa`,
  couche: (c) =>
    libelleCouche(c, `c_u,k ${valeur(c.cu)} kPa (undrained)`, (phi, cohesion) => `φ'k ${phi}° · c'k ${cohesion} kPa`),
};

/** Nombre fini, ou 0 : jamais de NaN dans un attribut. */
const a = (v: number): string => (Number.isFinite(v) ? String(Number(v.toFixed(2))) : '0');

/** Ponctuation de la langue, puis notation (indices, exposants) pour tout texte de SVG. */
const ponctuer = (s: string): string => (langueCourante() === 'en' ? s.replace(/ ([:;])(?=\s)/g, '$1') : s);
const tx = (s: string): string => notationSvg(ponctuer(s));

function texte(x: number, y: number, classe: string, contenu: string, ancrage = 'start'): string {
  return `<text x="${a(x)}" y="${a(y)}" class="${classe}" text-anchor="${ancrage}">${tx(contenu)}</text>`;
}

function ligne(x1: number, y1: number, x2: number, y2: number, classe: string): string {
  return `<line class="${classe}" x1="${a(x1)}" y1="${a(y1)}" x2="${a(x2)}" y2="${a(y2)}"/>`;
}

/** Ordonnee du profil en x, interpolee lineairement ; hors du profil, le bord (comme le noyau). */
function ySur(p: readonly Point[], x: number): number {
  if (x <= p[0].x) return p[0].y;
  const n = p.length - 1;
  if (x >= p[n].x) return p[n].y;
  for (let i = 0; i < n; i++) {
    const g = p[i];
    const d = p[i + 1];
    if (x <= d.x) return g.y + ((d.y - g.y) * (x - g.x)) / (d.x - g.x);
  }
  return p[n].y;
}

/** Plus haute ordonnee du terrain entre x0 et x1 (bornes comprises). */
function maxSur(p: readonly Point[], x0: number, x1: number): number {
  let m = Math.max(ySur(p, x0), ySur(p, x1));
  for (const q of p) if (q.x > x0 && q.x < x1) m = Math.max(m, q.y);
  return m;
}

/** Abscisses ou le profil recoupe un niveau de couche : les formes de couche suivent exactement le terrain. */
function abscissesCouches(p: readonly Point[], niveaux: readonly number[]): number[] {
  const xs = p.map((q) => q.x);
  for (let i = 0; i + 1 < p.length; i++) {
    const g = p[i];
    const d = p[i + 1];
    for (const niveau of niveaux) {
      if ((niveau - g.y) * (niveau - d.y) < 0) xs.push(g.x + ((niveau - g.y) * (d.x - g.x)) / (d.y - g.y));
    }
  }
  return xs.sort((u, v) => u - v);
}

interface VueDe {
  cercle: Cercle;
  F: number;
  tranches: Tranche[];
}

function vueDe(r: Resultat, vue: string): VueDe {
  if (vue === 'caracteristique') {
    return {
      cercle: r.caracteristique.cercle,
      F: r.caracteristique.F,
      tranches: r.caracteristique.resultat.tranches,
    };
  }
  const c = r.combinaisons.find((x) => x.nom === vue);
  if (!c) throw new Error(`vue inconnue : ${vue}`);
  return { cercle: c.cercle, F: c.F, tranches: c.resultat.tranches };
}

/** 'caracteristique', puis les combinaisons dans l'ordre du noyau. */
export function vuesDisponibles(r: Resultat): string[] {
  return ['caracteristique', ...r.combinaisons.map((c) => c.nom)];
}

/** La vue qui s'ouvre d'abord : la combinaison gouvernante. */
export function vueGouvernante(r: Resultat): string {
  return r.gouvernant;
}

export function coupe(calcul: Calcul, r: Resultat, vue: string, options: { cotes: boolean; tranches: boolean }): string {
  const d = calcul.donnees;
  const L = langueCourante() === 'en' ? EN : FR;
  const v = vueDe(r, vue);
  const { cercle } = v;
  const profil = d.profil;
  const tranches = v.tranches;
  const n = tranches.length;
  const xa = tranches[0].x - tranches[0].b / 2;
  const xb = tranches[n - 1].x + tranches[n - 1].b / 2;
  const xp0 = profil[0].x;
  const xpN = profil[profil.length - 1].x;
  const piezo = d.piezo ?? [];
  const bases = d.couches.map((c) => c.base);
  const rechercheAvecLimite = d.cercle === null && d.coteLimite !== undefined;

  // Cadre : tout ce qui est dessine, centre du cercle compris. Il ne depend pas des options.
  const xs = [...profil.map((p) => p.x), cercle.xc, xa, xb, ...d.bandes.flatMap((b) => [b.x0, b.x1]), ...piezo.map((p) => p.x)];
  const ys = [...profil.map((p) => p.y), cercle.yc, ...tranches.map((t) => t.yBase), ...bases, ...piezo.map((p) => p.y)];
  if (rechercheAvecLimite && d.coteLimite !== undefined) ys.push(d.coteLimite);
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  const ymin = Math.min(...ys);
  const ymax = Math.max(...ys);
  const spanX = xmax - xmin || 1;
  const spanY = ymax - ymin || 1;

  // Une seule echelle, en x et en y.
  const s = Math.min((LARGEUR - PAD.gauche - PAD.droite) / spanX, HAUTEUR_MAX / spanY);
  const ox = (LARGEUR - PAD.gauche - PAD.droite - spanX * s) / 2;
  const X = (x: number): number => PAD.gauche + ox + (x - xmin) * s;
  const Y = (y: number): number => PAD.haut + (ymax - y) * s;
  const hauteur = PAD.haut + spanY * s + PAD.bas;

  const corps: string[] = [];

  // Couches : une forme par couche, bornee par le terrain (dessus) et par sa base (dessous).
  const niveaux = abscissesCouches(profil, bases);
  d.couches.forEach((c, k) => {
    const haut = k === 0 ? Infinity : bases[k - 1];
    const dessus = niveaux.map((x) => [X(x), Y(Math.max(c.base, Math.min(ySur(profil, x), haut)))]);
    const dessous = niveaux.map((x) => [X(x), Y(c.base)]).reverse();
    const points = [...dessus, ...dessous].map(([px, py]) => `${a(px)},${a(py)}`).join(' ');
    const classe = c.drainage === 'draine' ? 'couche-draine' : 'couche-non-draine';
    corps.push(`<polygon class="couche ${classe}" points="${points}"/>`);
  });
  d.couches.slice(0, -1).forEach((c) => {
    corps.push(ligne(X(xp0), Y(c.base), X(xpN), Y(c.base), 'limite-couche'));
  });
  d.couches.forEach((c) => {
    corps.push(texte(X(xp0) + 6, Y(c.base) - 5, 'texte-coupe', L.couche(c)));
  });

  // Terrain, puis ligne piezometrique.
  corps.push(`<polyline class="ligne-terrain" points="${profil.map((p) => `${a(X(p.x))},${a(Y(p.y))}`).join(' ')}"/>`);
  if (piezo.length > 0) {
    corps.push(`<polyline class="piezo" points="${piezo.map((p) => `${a(X(p.x))},${a(Y(p.y))}`).join(' ')}"/>`);
    corps.push(texte(X(piezo[0].x) + 6, Y(piezo[0].y) - 5, 'texte-eau', L.nappe));
  }

  // Arc de glissement : extremites sur le terrain, aux bords de la premiere et de la derniere tranche.
  const xA = X(xa);
  const yA = Y(ySur(profil, xa));
  const xB = X(xb);
  const yB = Y(ySur(profil, xb));
  const xC = X(cercle.xc);
  const yC = Y(cercle.yc);
  const rayonPx = cercle.R * s;
  // Balayage negatif (SVG sweep 0) : l'arc passe sous le centre, de gauche a droite. Grand arc si l'angle parcouru depasse 180 degres.
  const angle = (px: number, py: number): number => Math.atan2(py - yC, px - xC);
  const parcours = (((angle(xA, yA) - angle(xB, yB)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const grand = parcours > Math.PI ? 1 : 0;
  const arc = `A ${a(rayonPx)} ${a(rayonPx)} 0 ${grand} 0 ${a(xB)} ${a(yB)}`;
  // Masse glissante : l'arc, puis le terrain en sens inverse, jusqu'au depart.
  const terrainInverse = profil
    .filter((p) => p.x > xa && p.x < xb)
    .sort((g, h) => h.x - g.x)
    .map((p) => `L ${a(X(p.x))} ${a(Y(p.y))}`)
    .join(' ');
  corps.push(`<path class="masse" d="M ${a(xA)} ${a(yA)} ${arc} ${terrainInverse} Z"/>`);
  corps.push(`<path class="cercle" d="M ${a(xA)} ${a(yA)} ${arc}"/>`);

  // Centre, rayon jusqu'a l'arc (dans la direction de l'extremite droite), libelles.
  corps.push(`<circle class="centre" cx="${a(xC)}" cy="${a(yC)}" r="3"/>`);
  const dist = Math.hypot(xB - xC, yB - yC) || 1;
  const xE = xC + ((xB - xC) / dist) * rayonPx;
  const yE = yC + ((yB - yC) / dist) * rayonPx;
  corps.push(ligne(xC, yC, xE, yE, 'rayon'));
  corps.push(texte(xC + 7, yC - 6, 'texte-refus', L.centre(nombreAffiche(cercle.xc), nombreAffiche(cercle.yc))));
  corps.push(texte((xC + xE) / 2 + 6, (yC + yE) / 2 - 6, 'texte-refus', L.rayon(nombreAffiche(cercle.R))));

  // Tranches : une dizaine sur le total, du terrain a la base.
  if (options.tranches) {
    const pas = Math.max(1, Math.round(n / NB_TRANCHES_DESSINEES));
    for (let i = Math.floor(pas / 2); i < n; i += pas) {
      const t = tranches[i];
      corps.push(ligne(X(t.x), Y(t.ySol), X(t.x), Y(t.yBase), 'tranche'));
    }
  }

  // Surcharges en bande, posees sur le point le plus haut du terrain sous elles.
  for (const b of d.bandes) {
    const x0 = Math.min(b.x0, b.x1);
    const x1 = Math.max(b.x0, b.x1);
    const bas = Y(maxSur(profil, x0, x1)) - ECART_BANDE;
    const haut = bas - HAUTEUR_BANDE;
    const nature = b.nature === 'G' ? 'permanente' : 'variable';
    corps.push(
      `<rect class="bande ${nature}" x="${a(X(x0))}" y="${a(haut)}" width="${a(Math.max(0, (x1 - x0) * s))}" height="${HAUTEUR_BANDE}"/>`
    );
    corps.push(texte(X(x0) + 3, haut - 4, 'texte-coupe', L.surcharge(b.nature, nombreAffiche(b.q))));
  }

  // Cotes : retirees par l'option « cotes », cote limite comprise.
  if (options.cotes) {
    const yCote = Y(ymin) + 16;
    const x1 = X(xp0);
    const x2 = X(xpN);
    corps.push(ligne(x1, yCote, x2, yCote, 'cote'));
    corps.push(ligne(x1, yCote - 5, x1, yCote + 5, 'cote'));
    corps.push(ligne(x2, yCote - 5, x2, yCote + 5, 'cote'));
    corps.push(texte((x1 + x2) / 2, yCote + 14, 'cote', L.longueur(nombreAffiche(xpN - xp0)), 'middle'));

    const yMaxP = Math.max(...profil.map((p) => p.y));
    const yMinP = Math.min(...profil.map((p) => p.y));
    const H = yMaxP - yMinP;
    if (H > 0) {
      const xv = X(xpN) + 16;
      const yHaut = Y(yMaxP);
      const yBas = Y(yMinP);
      corps.push(ligne(xv, yHaut, xv, yBas, 'cote'));
      corps.push(ligne(xv - 5, yHaut, xv + 5, yHaut, 'cote'));
      corps.push(ligne(xv - 5, yBas, xv + 5, yBas, 'cote'));
      corps.push(texte(xv + 6, (yHaut + yBas) / 2 + 4, 'cote', L.hauteur(nombreAffiche(H))));
    }

    if (rechercheAvecLimite && d.coteLimite !== undefined) {
      corps.push(ligne(X(xp0), Y(d.coteLimite), X(xpN), Y(d.coteLimite), 'cote-limite'));
      corps.push(texte(X(xp0) + 6, Y(d.coteLimite) - 5, 'cote', L.coteLimite(nombreAffiche(d.coteLimite))));
    }
  }

  // Titre : la vue et son F.
  const F = nombreAffiche(v.F, 3);
  const titre = vue === 'caracteristique' ? L.titreCaracteristique(F) : L.titreVue(vue, F);
  corps.push(texte(PAD.gauche, 22, 'titre-coupe', titre));

  return `<svg viewBox="0 0 ${LARGEUR} ${a(hauteur)}" role="img" aria-label="${echapper(L.aria)}">${corps.join('')}</svg>`;
}
