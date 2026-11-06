/** T5 : page `en/index.html` de meme squelette, et aucun reste de francais en anglais. */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { blocsEnTexte, constatsAffichage, contenuBalise, definirLangue, noteDeCalculHtml, notationHtml, resultatsEnCsv, tauxAffiche, texteVisible } from 'aedificium-ui';
import { lireSaisie, relire, saisieParDefaut } from '../../app/src/form';
import { blocEntrees, blocsResultat, messageDErreur, tranchesHtml, verdictsHtml, voletsHtml } from '../../app/src/vue';
import { coupe, vuesDisponibles } from '../../app/src/dessin';
import { noteDuCalcul } from '../../app/src/note';
import { STYLES_TRACE } from '../../app/src/export';
import { textes } from '../../app/src/textes';
import { verifierTalus, type DonneesTalus } from '../../src/talus';
import { ARGILE, calculer, impose, LIMON, lire, SAISIES } from './_commun';

const controler = (nom: string, html: string): string[] => constatsAffichage(texteVisible(html), { langue: 'en' }).map((c) => `${nom} : ${c}`);

function squelette(html: string): string[] {
  return [...html.matchAll(/\s(id|data-[a-z-]+|type|inputmode|accept|value)="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
}

function erreur(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    return messageDErreur(e);
  }
  throw new Error('une erreur etait attendue');
}

describe('page anglaise', () => {
  const fr = lire('../../app/index.html');
  const en = lire('../../app/en/index.html');

  it('meme squelette que la page francaise', () => {
    expect(squelette(en)).toEqual(squelette(fr));
  });

  it('langue, script commun, liens entre les deux versions', () => {
    expect(en).toContain('<html lang="en">');
    expect(en).toContain('src="../src/main.ts"');
    expect(en).toMatch(/class="barre-langue" href="\.\.\/"/);
    expect(fr).toMatch(/class="barre-langue" href="en\/"/);
  });

  it('titre anglais, aucun reste de francais', () => {
    expect(contenuBalise(en, 'h1')).toBe('Slope stability');
    expect(controler('page', en.replace(/lang="fr"[^>]*>FR</, '>'))).toEqual([]);
  });
});

describe('affichage en anglais', () => {
  beforeEach(() => definirLangue('en'));
  afterEach(() => definirLangue('fr'));

  for (const [nom, s] of SAISIES) {
    it(`${nom} : ecran, dessins, tranches, note, CSV`, () => {
      const { calcul, r } = calculer(s);
      const constats: string[] = [];
      constats.push(...controler('verdicts', verdictsHtml(r)));
      constats.push(...controler('volets', voletsHtml(r)));
      for (const v of vuesDisponibles(r)) {
        constats.push(...controler(`coupe ${v}`, coupe(calcul, r, v, { cotes: true, tranches: true })));
        constats.push(...controler(`tranches ${v}`, tranchesHtml(r, v)));
      }
      constats.push(...controler('note', noteDeCalculHtml(noteDuCalcul(calcul, r, { projet: 'Road', element: '', date: '2026-11-06' }), STYLES_TRACE)));
      const csv = resultatsEnCsv(blocsEnTexte([blocEntrees(calcul), ...blocsResultat(r)]));
      constats.push(...constatsAffichage(csv, { langue: 'en' }).map((c) => `csv : ${c}`));
      expect(constats).toEqual([]);
    });
  }

  it('titre de la note, normes inchangees', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    const n = noteDuCalcul(calcul, r, { projet: '', element: ' ', date: '2026-11-06' });
    expect(n.cartouche.element).toBe('Slope');
    expect(n.cartouche.norme).toBe('EN 1997-1:2004');
  });

  it('nombres a point decimal', () => {
    const { r } = calculer(saisieParDefaut());
    expect(texteVisible(verdictsHtml(r))).toContain(tauxAffiche(r.tauxMax));
    expect(tauxAffiche(r.tauxMax)).toMatch(/^0\.\d+$/);
    expect(resultatsEnCsv(blocsEnTexte(blocsResultat(r)))).toContain('Block,Symbol,Quantity,Value');
  });

  it('messages et erreurs du noyau traduits', () => {
    const lue = lireSaisie(saisieParDefaut());
    if (!lue.ok) throw new Error(lue.message);
    const d = lue.calcul.donnees;
    const v = (x: Partial<DonneesTalus>) => () => verifierTalus({ ...d, ...x });
    const [limon, argile] = d.couches;
    const lectures = [
      lireSaisie({ ...saisieParDefaut(), profil: [{ x: '0', y: 'abc' }, { x: '10', y: '0' }] }),
      lireSaisie({ ...saisieParDefaut(), piezo: [{ x: '', y: '0' }, { x: '10', y: '0' }] }),
      lireSaisie({ ...saisieParDefaut(), couches: [{ ...LIMON, gamma: 'x' }, ARGILE] }),
      lireSaisie({ ...saisieParDefaut(), couches: [{ ...LIMON, phi: '0' }, ARGILE] }),
      lireSaisie({ ...saisieParDefaut(), couches: [LIMON, { ...ARGILE, cu: '0' }] }),
      lireSaisie({ ...saisieParDefaut(), bandes: [{ x0: '0', x1: '4', q: 'x', nature: 'G' }] }),
      lireSaisie(impose({ R: 'abc' })),
    ];
    const messages = [
      ...lectures.flatMap((l) => (l.ok ? [] : [l.message])),
      erreur(() => relire('{"format":"autre"}')),
      erreur(v({ profil: [{ x: 0, y: 0 }] })),
      erreur(v({ profil: [{ x: 0, y: 0 }, { x: 0, y: 1 }] })),
      erreur(v({ couches: [] })),
      erreur(v({ couches: [{ ...limon, gamma: 0 }, argile] })),
      erreur(v({ couches: [argile, limon] })),
      erreur(v({ couches: [{ ...limon, phiDeg: 95 }, argile] })),
      erreur(v({ couches: [{ ...limon, c: undefined }, argile] })),
      erreur(v({ couches: [{ ...limon, c: -1 }, argile] })),
      erreur(v({ couches: [limon, { ...argile, cu: -1 }] })),
      erreur(v({ piezo: [{ x: 0, y: 0 }] })),
      erreur(v({ piezo: [{ x: 0, y: 0 }, { x: 0, y: 1 }] })),
      erreur(v({ bandes: [{ x0: 4, x1: 0, q: 10, nature: 'G' }] })),
      erreur(v({ bandes: [{ x0: 0, x1: 4, q: -1, nature: 'G' }] })),
      erreur(v({ cercle: { xc: 0, yc: 0, R: -1 } })),
      erreur(v({ cercle: { xc: 0, yc: 50, R: 5 } })),
      erreur(v({ cercle: { xc: 0, yc: 20, R: 200 } })),
      erreur(v({ coteLimite: 20 })),
      erreur(v({ profilNormatif: 'anb2022', approche: 'DA3' })),
      textes().messages.rienAExporter,
      textes().messages.nouvelleVersion,
    ];
    expect(messages.flatMap((m, i) => controler(`message ${i} « ${m} »`, notationHtml(m)))).toEqual([]);
  });

  it('alertes du noyau traduites', () => {
    const r = calculer({ ...saisieParDefaut(), piezo: [{ x: '-25', y: '10' }, { x: '40', y: '2' }] }).r;
    expect(r.alertes.length).toBeGreaterThan(0);
    expect(controler('verdicts', verdictsHtml(r))).toEqual([]);
    expect(controler('m_alpha', notationHtml(messageDErreur('m_α borné à 0,2 : sortie de glissement raide')))).toEqual([]);
  });
});
