/** T1 : la saisie, sa lecture, son enregistrement. */

import { describe, expect, it } from 'vitest';
import { lireSaisie, nappeHorizontale, relire, saisieParDefaut, serialiser, talusType, verifier, type Saisie } from '../../app/src/form';
import { verifierTalus } from '../../src/talus';
import { ARGILE, LIMON, impose } from './_commun';

function refus(s: Saisie): string {
  const l = lireSaisie(s);
  if (l.ok) throw new Error('un refus etait attendu');
  return l.message;
}

function lue(s: Saisie) {
  const l = lireSaisie(s);
  if (!l.ok) throw new Error(l.message);
  return l.calcul;
}

const proche = (x: number, attendu: number, rel = 1e-4) => expect(Math.abs(x - attendu) / Math.abs(attendu)).toBeLessThanOrEqual(rel);

describe('valeurs par defaut', () => {
  it('talus 3H/2V de 10 m, limon sur argile, nappe, recherche limitee a -10 m, 1re generation DA1', () => {
    expect(lue(saisieParDefaut()).donnees).toEqual({
      generation: '1re',
      profilNormatif: 'recommande',
      risque: 'normal',
      approche: 'DA1',
      cc: 'CC2',
      profil: [{ x: -25, y: 10 }, { x: 0, y: 10 }, { x: 15, y: 0 }, { x: 40, y: 0 }],
      couches: [
        { nom: 'Limon', base: 4, gamma: 19, gammaSat: 20, drainage: 'draine', phiDeg: 30, c: 10 },
        { nom: 'Argile', base: -40, gamma: 20, gammaSat: 21, drainage: 'non_draine', cu: 60 },
      ],
      piezo: [{ x: -25, y: 7 }, { x: 0, y: 7 }, { x: 15, y: 0 }, { x: 40, y: 0 }],
      bandes: [],
      cercle: null,
      coteLimite: -10,
    });
  });

  it('cercle impose par defaut : O (5 ; 18), R 20 m', () => {
    const s = saisieParDefaut();
    expect([s.xc, s.yc, s.R]).toEqual(['5', '18', '20']);
    expect(s.modeCercle).toBe('recherche');
  });

  it('verifier rend le resultat du noyau, dans les deux generations', () => {
    const c1 = lue(saisieParDefaut());
    const r1 = verifier(c1);
    expect(r1.generation).toBe('1re');
    expect(r1.gouvernant).toBe('DA1-2');
    proche(r1.tauxMax, 0.87777);
    proche(r1.caracteristique.F, 1.58955);
    expect(r1.tauxMax).toBe(verifierTalus(c1.donnees).tauxMax);
    const r2 = verifier(lue({ ...saisieParDefaut(), generation: '2e' }));
    expect(r2.generation).toBe('2e');
    expect(r2.gouvernant).toBe('VC3 + M2');
    proche(r2.tauxMax, 0.87777);
  });

  it('verifier rend les coefficients de chaque combinaison, avec leur source', () => {
    const r = verifier(lue(saisieParDefaut()));
    expect(r.coefficients.map((c) => c.nom)).toEqual(['DA1-1', 'DA1-2']);
    expect(r.coefficients[1].sol.gCu.valeur).toBe(1.4);
    expect(r.coefficients[1].sol.gCu.source).toContain('tableau A.4');
    const a = verifier(lue({ ...saisieParDefaut(), profilNormatif: 'anb2022', risque: 'eleve' }));
    expect(a.coefficients[1].sol.gCu.valeur).toBe(1.55);
    expect(a.coefficients[1].sol.gCu.source).toContain('ANB');
    expect(a.profil).toContain('ANB:2022');
    expect(verifier(lue({ ...saisieParDefaut(), generation: '2e' })).coefficients.map((c) => c.nom)).toEqual(['VC3 + M2']);
  });

  it('cercle impose', () => {
    const c = lue(impose());
    expect(c.donnees.cercle).toEqual({ xc: 5, yc: 18, R: 20 });
    expect(c.donnees.coteLimite).toBeUndefined();
    proche(verifier(c).combinaisons[1].F, 1.2886);
  });
});

describe('lecture', () => {
  it('virgule decimale acceptee', () => {
    const s = saisieParDefaut();
    s.couches = [{ ...LIMON, phi: '32,5' }, ARGILE];
    expect(lue(s).donnees.couches[0].phiDeg).toBe(32.5);
  });

  it('un point illisible est refuse en nommant la ligne et le point', () => {
    const s = saisieParDefaut();
    s.profil = s.profil.map((p, i) => (i === 1 ? { ...p, y: 'abc' } : p));
    const m = refus(s);
    expect(m).toMatch(/profil/i);
    expect(m).toContain('point 2');
    expect(m).toMatch(/nombre attendu/);
    const n = saisieParDefaut();
    n.piezo = n.piezo.map((p, i) => (i === 2 ? { ...p, x: '' } : p));
    expect(refus(n)).toMatch(/piézométrique.*point 3|point 3.*piézométrique/);
  });

  it('une valeur de couche illisible nomme la couche', () => {
    const s = saisieParDefaut();
    s.couches = [LIMON, { ...ARGILE, gamma: 'x' }];
    expect(refus(s)).toContain('Argile');
  });

  it('une bande illisible est nommee par son rang', () => {
    expect(refus({ ...saisieParDefaut(), bandes: [{ x0: '0', x1: '4', q: 'abc', nature: 'G' }] })).toContain('bande 1');
  });

  it("phi hors de ]0 ; 90[ et c_u nul ou negatif : refus a la saisie, en nommant la couche", () => {
    for (const phi of ['0', '-5', '90']) {
      const m = refus({ ...saisieParDefaut(), couches: [{ ...LIMON, phi }, ARGILE] });
      expect(m).toMatch(/φ/);
      expect(m).toContain('Limon');
    }
    for (const cu of ['0', '-5']) {
      const m = refus({ ...saisieParDefaut(), couches: [LIMON, { ...ARGILE, cu }] });
      expect(m).toMatch(/c_u/);
      expect(m).toContain('Argile');
    }
  });

  it('couche sans nom : nommee par son rang', () => {
    expect(lue({ ...saisieParDefaut(), couches: [LIMON, { ...ARGILE, nom: '  ' }] }).donnees.couches[1].nom).toBe('Couche 2');
  });

  it('cercle impose illisible : refus qui nomme le cercle', () => {
    expect(refus(impose({ R: 'abc' }))).toMatch(/cercle/i);
  });
});

describe('champs masques', () => {
  it('couche drainee : c_u non lu ; non drainee : phi et c non lus', () => {
    const c = lue({ ...saisieParDefaut(), couches: [{ ...LIMON, cu: 'abc' }, { ...ARGILE, phi: 'x', c: 'y' }] }).donnees.couches;
    expect(c[0]).toEqual({ nom: 'Limon', base: 4, gamma: 19, gammaSat: 20, drainage: 'draine', phiDeg: 30, c: 10 });
    expect(c[1]).toEqual({ nom: 'Argile', base: -40, gamma: 20, gammaSat: 21, drainage: 'non_draine', cu: 60 });
  });

  it('sans nappe : la ligne piezometrique n est pas lue', () => {
    const s = { ...saisieParDefaut(), avecNappe: false };
    s.piezo = [{ x: 'a', y: 'b' }];
    expect(lue(s).donnees.piezo).toBeNull();
  });

  it('recherche : le cercle impose n est pas lu ; cote limite vide, pas de limite', () => {
    const c = lue({ ...saisieParDefaut(), xc: 'a', yc: 'b', R: 'c', coteLimite: ' ' }).donnees;
    expect(c.cercle).toBeNull();
    expect(c.coteLimite).toBeUndefined();
  });

  it('cercle impose : la cote limite n est pas lue', () => {
    expect(lue(impose({ coteLimite: 'abc' })).donnees.coteLimite).toBeUndefined();
  });

  it('ANB 2022 : approche DA1 imposee, quelle que soit la liste', () => {
    expect(lue({ ...saisieParDefaut(), profilNormatif: 'anb2022', approche1: 'DA3' }).donnees.approche).toBe('DA1');
  });
});

describe('aides a la saisie', () => {
  it('talus type : crete, parement, pied', () => {
    expect(talusType(10, 1.5, 25, 25)).toEqual(saisieParDefaut().profil);
    expect(talusType(3, 1.5, 5, 10)).toEqual([
      { x: '-5', y: '3' },
      { x: '0', y: '3' },
      { x: '4,5', y: '0' },
      { x: '14,5', y: '0' },
    ]);
  });

  it('nappe horizontale sur l emprise du profil', () => {
    expect(nappeHorizontale('6,5', saisieParDefaut().profil)).toEqual([
      { x: '-25', y: '6,5' },
      { x: '40', y: '6,5' },
    ]);
  });
});

describe('une seule saisie pour les deux generations', () => {
  it('basculer de generation ne change ni la geometrie ni les sols', () => {
    const s: Saisie = { ...saisieParDefaut(), approche1: 'DA3', consequences: 'CC3' };
    const a = lue({ ...s, generation: '1re' }).donnees;
    const b = lue({ ...s, generation: '2e' }).donnees;
    expect({ ...a, generation: '2e' }).toEqual(b);
    expect(a.approche).toBe('DA3');
    expect(b.cc).toBe('CC3');
  });
});

describe('enregistrement', () => {
  it('enregistrer puis relire rend la meme saisie', () => {
    const s: Saisie = {
      ...saisieParDefaut(),
      generation: '2e',
      profilNormatif: 'anb2022',
      risque: 'faible',
      approche1: 'DA2',
      consequences: 'CC1',
      avecNappe: false,
      bandes: [{ x0: '-12', x1: '-4', q: '10', nature: 'Q' }],
      modeCercle: 'impose',
      coteLimite: '',
    };
    expect(relire(serialiser(s))).toEqual(s);
  });

  it('format inconnu refuse', () => {
    expect(() => relire('{"format":"autre"}')).toThrow(/format/i);
  });

  it('champs absents : valeur par defaut ; element malforme ecarte', () => {
    const s = relire(
      JSON.stringify({
        format: 'stabilite-talus/1',
        R: '12',
        profil: [{ x: '0', y: '5' }, { x: 3 }, { x: '9', y: '0' }],
        couches: [{ nom: 'A' }, { ...LIMON, nom: 'B' }],
      })
    );
    expect(s.R).toBe('12');
    expect(s.xc).toBe(saisieParDefaut().xc);
    expect(s.profil).toEqual([{ x: '0', y: '5' }, { x: '9', y: '0' }]);
    expect(s.couches).toEqual([{ ...LIMON, nom: 'B' }]);
    expect(s.piezo).toEqual(saisieParDefaut().piezo);
    expect(s.generation).toBe('1re');
  });

  it('valeur de choix inconnue : valeur par defaut', () => {
    const s = relire(
      JSON.stringify({
        format: 'stabilite-talus/1',
        generation: '3e',
        profilNormatif: 'X',
        risque: 'Y',
        approche1: 'DA9',
        consequences: 'CC7',
        modeCercle: 'Z',
        bandes: [{ x0: '0', x1: '1', q: '5', nature: 'W' }],
        couches: [{ ...LIMON, drainage: 'autre' }],
      })
    );
    expect([s.generation, s.profilNormatif, s.risque, s.approche1, s.consequences, s.modeCercle]).toEqual(['1re', 'recommande', 'normal', 'DA1', 'CC2', 'recherche']);
    expect(s.bandes[0].nature).toBe('G');
    expect(s.couches[0].drainage).toBe('draine');
  });
});
