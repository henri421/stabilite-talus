// Tests d'acceptation du noyau stabilite-talus (PLAN.md, T4). Attendus calcules a part
// (forme fermee ou Bishop independant a 4000 tranches). A ne pas modifier.
import { describe, expect, it } from 'vitest';
import { verifierTalus, type DonneesTalus } from '../src/talus';

const proche = (x: number, attendu: number, rel = 0.005) =>
  expect(Math.abs(x - attendu) / Math.abs(attendu)).toBeLessThanOrEqual(rel);

// Talus 1/1 de 10 m, limon draine sur argile non drainee, ligne piezometrique (cas B de sol-ec7).
function base(): DonneesTalus {
  return {
    generation: '1re',
    profilNormatif: 'recommande',
    risque: 'normal',
    approche: 'DA1',
    cc: 'CC2',
    profil: [{ x: -25, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 }, { x: 35, y: 0 }],
    couches: [
      { nom: 'Limon', base: 4, gamma: 19, gammaSat: 20, drainage: 'draine', phiDeg: 30, c: 5 },
      { nom: 'Argile', base: -40, gamma: 20, gammaSat: 21, drainage: 'non_draine', cu: 60 },
    ],
    piezo: [{ x: -25, y: 7 }, { x: 0, y: 7 }, { x: 10, y: 0 }, { x: 35, y: 0 }],
    bandes: [],
    cercle: { xc: 2, yc: 16, R: 15 },
  };
}

// Argile cu = 30 sur terrain horizontal, cercle (0 ; 3) R = 5, bande de 50 kPa sur [0 ; 4] :
// F_k = cu.2θ.R² / (q a²/2) = 3,47736 (θ = acos 0,6).
function argile(nature: 'G' | 'Q'): DonneesTalus {
  return {
    ...base(),
    profil: [{ x: -20, y: 0 }, { x: 20, y: 0 }],
    couches: [{ nom: 'Argile', base: -50, gamma: 18, gammaSat: 18, drainage: 'non_draine', cu: 30 }],
    piezo: null,
    bandes: [{ x0: 0, x1: 4, q: 50, nature }],
    cercle: { xc: 0, yc: 3, R: 5 },
  };
}
const FA = 3.47736;

describe('T4 : verifierTalus', () => {
  it('1re generation, DA1 : deux combinaisons, la plus defavorable gouverne', () => {
    const r = verifierTalus(base());
    expect(r.combinaisons.map((c) => c.nom)).toEqual(['DA1-1', 'DA1-2']);
    proche(r.combinaisons[0].F, 1.45237);
    proche(r.combinaisons[1].F, 1.44585);
    expect(r.gouvernant).toBe('DA1-2');
    expect(r.tauxMax).toBeCloseTo(1 / r.combinaisons[1].F, 10);
    expect(r.combinaisons.every((c) => c.conforme === c.taux <= 1)).toBe(true);
  });

  it('F caracteristique rendu a titre indicatif, sans seuil', () => {
    const r = verifierTalus(base());
    proche(r.caracteristique.F, 1.99074);
    expect(r.caracteristique).not.toHaveProperty('conforme');
  });

  it('profil ANB 2022 : gamma_Q = 1,10 en DA1-2', () => {
    const r = verifierTalus({ ...argile('Q'), profilNormatif: 'anb2022' });
    proche(r.combinaisons[1].F, FA / 1.4 / 1.1);
    expect(r.profil).toContain('ANB:2022');
  });

  it('profil ANB 2022, risque faible : cu / 1,25', () => {
    const r = verifierTalus({ ...argile('G'), profilNormatif: 'anb2022', risque: 'faible' });
    proche(r.combinaisons[1].F, FA / 1.25);
  });

  it("profil ANB 2022 avec une autre approche que la DA1 : refus", () => {
    expect(() => verifierTalus({ ...base(), profilNormatif: 'anb2022', approche: 'DA3' })).toThrow(/approche/);
  });

  it('2e generation, CC2 puis CC3 : VC3 + M2', () => {
    const r2 = verifierTalus({ ...argile('Q'), generation: '2e' });
    expect(r2.combinaisons.map((c) => c.nom)).toEqual(['VC3 + M2']);
    proche(r2.combinaisons[0].F, FA / 1.4 / 1.3);
    expect(r2.tauxMax).toBeCloseTo(1 / r2.combinaisons[0].F, 10);
    const r3 = verifierTalus({ ...argile('G'), generation: '2e', cc: 'CC3' });
    proche(r3.combinaisons[0].F, FA / 1.54);
  });

  it('DA2 : taux = 1,1 / F', () => {
    const r = verifierTalus({ ...argile('G'), approche: 'DA2' });
    proche(r.combinaisons[0].F, FA / 1.35);
    proche(r.tauxMax, 0.42705);
  });

  it('cercle non impose : recherche par combinaison, F au plus celui du cercle donne', () => {
    const r = verifierTalus({ ...base(), cercle: null });
    expect(r.combinaisons[0].F).toBeLessThanOrEqual(1.45237 * 1.005);
    expect(r.combinaisons[1].F).toBeLessThanOrEqual(1.44585 * 1.005);
    for (const c of r.combinaisons) expect(c.cercle.R).toBeGreaterThan(0);
  });

  it('cercle impose invalide : erreur en clair, jamais de valeur', () => {
    expect(() => verifierTalus({ ...base(), cercle: { xc: 0, yc: 40, R: 5 } })).toThrow(/cercle/i);
  });

  it('saisie en degres : phi hors de ]0 ; 90[ refuse', () => {
    const d = base();
    d.couches[0] = { ...d.couches[0], phiDeg: 90 };
    expect(() => verifierTalus(d)).toThrow(/φ/);
  });

  it("nappe au-dessus du terrain : alerte en clair", () => {
    const d = { ...base(), piezo: [{ x: -25, y: 7 }, { x: 0, y: 7 }, { x: 10, y: 2 }, { x: 35, y: 2 }] };
    const r = verifierTalus(d);
    expect(r.alertes.join(' ')).toMatch(/au-dessus du terrain/);
  });
});
