/** T4 : la note commune d'aedificium-ui, sans verdict global ; le dessin exporte. */

import { describe, expect, it } from 'vitest';
import { constatsAffichage, noteDeCalculHtml, texteVisible, type ElementNote } from 'aedificium-ui';
import { saisieParDefaut, type Saisie } from '../../app/src/form';
import { blocEntrees } from '../../app/src/vue';
import { coupe, vueGouvernante } from '../../app/src/dessin';
import { noteDuCalcul } from '../../app/src/note';
import { STYLES_TRACE } from '../../app/src/export';
import { bandeAuPied, calculer, eauHaute, impose, lire, SAISIES } from './_commun';

const CARTOUCHE = { projet: 'Route N4', element: 'Déblai D2', date: '2026-11-06' };

function preparer(s: Saisie) {
  const { calcul, r } = calculer(s);
  return { calcul, r, note: noteDuCalcul(calcul, r, CARTOUCHE) };
}

const symboles = (els: ElementNote[] | undefined): string[] => (els ?? []).flatMap((e) => (e.type === 'bloc' ? e.bloc.lignes.map((l) => l.symbole) : []));
const titres = (els: ElementNote[] | undefined): string[] => (els ?? []).flatMap((e) => (e.type === 'bloc' ? [e.bloc.titre] : []));
const figures = (els: ElementNote[] | undefined) => (els ?? []).filter((e) => e.type === 'figure');

describe('cartouche', () => {
  it('projet, element, date, outil', () => {
    const { cartouche } = preparer(saisieParDefaut()).note;
    expect(cartouche.projet).toBe('Route N4');
    expect(cartouche.element).toBe('Déblai D2');
    expect(cartouche.date).toBe('2026-11-06');
    expect(cartouche.outil).toBe('stabilite-talus');
  });

  it('normes de la generation, et l annexe nationale quand elle est choisie', () => {
    expect(preparer(saisieParDefaut()).note.cartouche.norme).toBe('EN 1997-1:2004');
    expect(preparer({ ...saisieParDefaut(), profilNormatif: 'anb2022' }).note.cartouche.norme).toBe('EN 1997-1:2004, NBN EN 1997-1 ANB:2022');
    expect(preparer({ ...saisieParDefaut(), generation: '2e' }).note.cartouche.norme).toBe('EN 1997-1:2024, EN 1997-3:2025, EN 1990:2023');
  });

  it('element vide : Talus', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    expect(noteDuCalcul(calcul, r, { ...CARTOUCHE, element: ' ' }).cartouche.element).toBe('Talus');
  });

  it('le texte est echappe', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    const h = noteDeCalculHtml(noteDuCalcul(calcul, r, { ...CARTOUCHE, projet: 'Route <test>' }), STYLES_TRACE);
    expect(h).toContain('Route &lt;test&gt;');
    expect(h).not.toContain('Route <test>');
  });
});

describe('sections', () => {
  for (const generation of ['1re', '2e'] as const) {
    it(`ordre fixe, generation ${generation}`, () => {
      const html = noteDeCalculHtml(preparer({ ...saisieParDefaut(), generation }).note, STYLES_TRACE);
      expect([...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((x) => x[1])).toEqual([
        '1. Géométrie',
        '2. Matériaux',
        '3. Hypothèses',
        '4. Cas de charges',
        '5. Calculs et vérifications',
        '6. Conclusions',
      ]);
    });
  }

  for (const [nom, s] of [['defaut', saisieParDefaut()], ['impose avec bande', { ...impose(), bandes: bandeAuPied().bandes }], ['2e sans nappe', { ...saisieParDefaut(), generation: '2e', avecNappe: false }]] as const) {
    it(`toutes les lignes d entree rangees une fois : ${nom}`, () => {
      const { calcul, note } = preparer(s);
      const sc = note.sections;
      const ranges = [...symboles(sc.geometrie), ...symboles(sc.materiaux), ...symboles(sc.hypotheses), ...symboles(sc.charges)];
      expect([...ranges].sort()).toEqual(blocEntrees(calcul).lignes.map((l) => l.symbole).sort());
    });
  }

  it('chaque ligne a sa place', () => {
    const sc = preparer(bandeAuPied()).note.sections;
    expect(symboles(sc.geometrie)).toContain('profil');
    for (const x of ['couche 1', 'couche 2']) expect(symboles(sc.materiaux)).toContain(x);
    expect(symboles(sc.hypotheses)).toContain('nappe');
    expect(symboles(sc.charges)).toContain('bande 1');
  });

  it('sans surcharge : la section des charges le dit', () => {
    const c = preparer(saisieParDefaut()).note.sections.charges ?? [];
    expect(c.some((e) => e.type === 'texte' && e.texte.toLowerCase().includes('aucune surcharge'))).toBe(true);
  });

  it('geometrie : la coupe cotee de la vue gouvernante', () => {
    const { calcul, r, note } = preparer(saisieParDefaut());
    const f = figures(note.sections.geometrie);
    expect(f).toHaveLength(1);
    if (f[0].type === 'figure') expect(f[0].svg).toBe(coupe(calcul, r, vueGouvernante(r), { cotes: true, tranches: true }));
  });

  it('hypotheses : profil normatif et valeurs annoncees', () => {
    const t1 = texteVisible(noteDeCalculHtml(preparer(saisieParDefaut()).note, STYLES_TRACE));
    expect(t1).toContain('valeurs recommandées');
    expect(t1).toContain('9,81');
    const ta = texteVisible(noteDeCalculHtml(preparer({ ...saisieParDefaut(), profilNormatif: 'anb2022', risque: 'eleve' }).note, STYLES_TRACE));
    expect(ta).toContain('ANB:2022');
    expect(ta).toContain('élevé');
    expect(texteVisible(noteDeCalculHtml(preparer({ ...saisieParDefaut(), generation: '2e' }).note, STYLES_TRACE))).toContain('CC2');
  });

  it('calculs : un bloc par combinaison, et la caracteristique', () => {
    const { r, note } = preparer(saisieParDefaut());
    const t = titres(note.sections.calculs);
    for (const c of r.combinaisons) expect(t.some((x) => x.includes(c.nom))).toBe(true);
    expect(t.some((x) => x.toLowerCase().includes('caractéristique'))).toBe(true);
  });
});

describe('conclusions', () => {
  for (const [nom, s] of SAISIES) {
    it(`${nom} : une ligne par combinaison, taux du noyau`, () => {
      const { r, note } = preparer(s);
      expect(note.verifications).toHaveLength(r.combinaisons.length);
      note.verifications.forEach((v, i) => {
        expect(v.nom).toContain(r.combinaisons[i].nom);
        expect(v.nom).not.toMatch(/EN \d/);
        expect((v.clause ?? '').trim().length).toBeGreaterThan(0);
        expect(v.taux).toBe(r.combinaisons[i].taux);
        expect(v.ok).toBe(r.combinaisons[i].taux <= 1);
      });
    });
  }

  it('aucun verdict global', () => {
    const t = texteVisible(noteDeCalculHtml(preparer(saisieParDefaut()).note, STYLES_TRACE));
    expect(t).not.toContain('Conforme');
    expect(t).not.toContain('Non conforme');
    expect(t).toContain('Vérification déterminante');
  });

  it('alertes du noyau reprises', () => {
    const a = (preparer(eauHaute()).note.avertissements ?? []).join(' ');
    expect(a).toContain('au-dessus du terrain');
  });
});

describe('texte visible de la note', () => {
  for (const [nom, s] of SAISIES) {
    it(nom, () => {
      const h = noteDeCalculHtml(preparer(s).note, STYLES_TRACE);
      expect(h).not.toContain('NaN');
      expect(h).not.toContain('Infinity');
      expect(constatsAffichage(texteVisible(h))).toEqual([]);
    });
  }
});

describe('export', () => {
  it('STYLES_TRACE porte les traits du dessin', () => {
    for (const c of ['.ligne-terrain', '.piezo', '.cercle', '.tranche', '.bande', '.limite-couche']) expect(STYLES_TRACE).toContain(c);
  });

  it('main.ts exporte note, coupe et CSV', () => {
    const main = lire('../../app/src/main.ts');
    expect(main).toContain('svgAutonome(');
    expect(main).toContain('resultatsEnCsv(');
    expect(main).toContain('ouvrirOuTelecharger(');
  });
});
