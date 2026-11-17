// Lot E (audit R4) : profil luxembourgeois de la 1re generation (valeurs recommandees presumees, sources AN-LU).
import { describe, expect, it } from 'vitest';
import { noteDeCalculHtml, texteVisible } from 'aedificium-ui';
import { profil1g } from 'sol-ec7';
import { profilLu1g } from '../../app/src/annexe';
import { relire, saisieParDefaut, serialiser } from '../../app/src/form';
import { noteDuCalcul } from '../../app/src/note';
import { calculer } from './_commun';

describe('annexe luxembourgeoise (EC7)', () => {
  it('memes valeurs que le profil recommande, sources ILNAS-EN 1997-1/AN-LU:2020', () => {
    const lu = profilLu1g();
    expect(lu.M2.gPhi.valeur).toBe(profil1g().M2.gPhi.valeur);
    expect(lu.M2.gPhi.source).toBe('ILNAS-EN 1997-1/AN-LU:2020, tableau A.4 : valeur recommandée présumée retenue, non vérifiée sur l’annexe');
    expect(lu.approcheImposee).toBeUndefined();
  });

  it('choix enregistre et relu ; le calcul emploie le profil LU, la note le dit', () => {
    const s = { ...saisieParDefaut(), generation: '1re' as const, profilNormatif: 'lu' as const };
    expect(relire(serialiser(s)).profilNormatif).toBe('lu');
    const { calcul, r } = calculer(s);
    expect(r.coefficients[0].sol.gPhi.source).toMatch(/AN-LU:2020/);
    const note = noteDuCalcul(calcul, r, { projet: 'P', element: 'E', date: '2026-11-17' });
    expect(note.cartouche.norme).toContain('AN-LU:2020');
    expect(note.avertissements?.some((a) => /^Annexe nationale luxembourgeoise/.test(a))).toBe(true);
    expect(texteVisible(noteDeCalculHtml(note, ''))).toContain('Luxembourg');
  });
});
