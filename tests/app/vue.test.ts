/** T2 : verdicts, volets, tranches, blocs du CSV. Tout vient du resultat du noyau. */

import { describe, expect, it } from 'vitest';
import { NOMS_GRECS, blocsEnTexte, constatsAffichage, nombreAffiche, notationHtml, resultatsEnCsv, tauxAffiche, texteVisible } from 'aedificium-ui';
import { saisieParDefaut } from '../../app/src/form';
import { blocEntrees, blocsResultat, messageDErreur, tranchesHtml, verdictsHtml, voletsHtml } from '../../app/src/vue';
import { bandeAuPied, calculer, eauHaute, impose, instable, SAISIES } from './_commun';

/** Contenu d'un groupe de verdicts : `<section class="groupe-verdicts" data-groupe="...">`. */
function groupe(html: string, nom: string): string {
  const i = html.indexOf(`data-groupe="${nom}"`);
  expect(i).toBeGreaterThan(-1);
  const fin = html.indexOf('</section>', i);
  return html.slice(i, fin < 0 ? undefined : fin);
}

const groupes = (html: string): string[] => [...html.matchAll(/data-groupe="([a-z]+)"/g)].map((m) => m[1]);
const verifications = (html: string): string[] => [...html.matchAll(/data-verification="([^"]+)"/g)].map((m) => m[1]);

describe('verdicts', () => {
  const def = calculer(saisieParDefaut()).r;
  const html = verdictsHtml(def);

  it('deux groupes : stabilite, puis le F caracteristique a titre indicatif', () => {
    expect(groupes(html)).toEqual(['stabilite', 'indicatif']);
  });

  it('une carte par combinaison, dans l ordre du noyau, puis la caracteristique', () => {
    for (const [, s] of SAISIES) {
      const r = calculer(s).r;
      expect(verifications(verdictsHtml(r))).toEqual([...r.combinaisons.map((c) => c.nom), 'caracteristique']);
    }
  });

  it('chaque carte : F_d, taux, cercle ; la gouvernante le dit', () => {
    const t = texteVisible(groupe(html, 'stabilite'));
    for (const c of def.combinaisons) {
      expect(t).toContain(c.nom);
      expect(t).toContain(nombreAffiche(c.F, 3));
      expect(t).toContain(tauxAffiche(c.taux));
      expect(t).toContain(nombreAffiche(c.cercle.R, 1));
    }
    expect(t.toLowerCase()).toContain('gouvern');
  });

  it('caracteristique : F seul, sans jauge ni seuil', () => {
    const g = groupe(html, 'indicatif');
    expect(texteVisible(g)).toContain(nombreAffiche(def.caracteristique.F, 3));
    expect(g).not.toContain('width:');
    expect(g).not.toContain('depasse');
  });

  it('aucun verdict global ni cible F inventee', () => {
    const t = texteVisible(html);
    expect(t).not.toMatch(/\bConforme\b/);
    expect(t).not.toMatch(/Non conforme/);
    expect(t.toLowerCase()).not.toContain('cible');
  });

  it('profil normatif et clauses de la generation', () => {
    const t1 = texteVisible(html);
    expect(t1).toContain('§11.5.1');
    expect(t1).toContain('valeurs recommandées');
    expect(texteVisible(verdictsHtml(calculer({ ...saisieParDefaut(), profilNormatif: 'anb2022' }).r))).toContain('ANB:2022');
    const t2 = texteVisible(verdictsHtml(calculer({ ...saisieParDefaut(), generation: '2e' }).r));
    expect(t2).toContain('§4.6.3');
    expect(t2).toContain('tableau 4.2');
    expect(t2).not.toContain('§11.5');
  });

  it('un taux depasse est marque, dans son groupe seulement', () => {
    const h = verdictsHtml(calculer(instable()).r);
    expect(groupe(h, 'stabilite')).toContain('depasse');
    expect(groupe(h, 'indicatif')).not.toContain('depasse');
    expect(groupe(html, 'stabilite')).not.toContain('depasse');
  });

  it('alertes du noyau dites en clair', () => {
    expect(texteVisible(verdictsHtml(calculer(eauHaute()).r))).toContain('au-dessus du terrain');
  });

  it('jauges bornees : jamais de NaN, d Infinity ni de largeur au-dela de 100 %', () => {
    for (const [, s] of SAISIES) {
      const h = verdictsHtml(calculer(s).r);
      for (const x of ['NaN', 'Infinity', 'null', 'undefined']) expect(h).not.toContain(x);
      for (const m of h.matchAll(/width:\s*([\d.]+)%/g)) expect(Number(m[1])).toBeLessThan(100.01);
    }
  });
});

describe('tranches', () => {
  it('une ligne par tranche du cercle de la vue', () => {
    const r = calculer(saisieParDefaut()).r;
    for (const vue of ['caracteristique', ...r.combinaisons.map((c) => c.nom)]) {
      const h = tranchesHtml(r, vue);
      const res = vue === 'caracteristique' ? r.caracteristique.resultat : r.combinaisons.find((c) => c.nom === vue)?.resultat;
      expect((h.match(/data-tranche/g) ?? []).length).toBe(res?.tranches.length);
      expect(h).not.toContain('NaN');
    }
  });

  it('poids, pression d eau, matériau et m_α de chaque tranche', () => {
    const r = calculer(saisieParDefaut()).r;
    const t = texteVisible(tranchesHtml(r, 'DA1-2'));
    const tr = r.combinaisons[1].resultat.tranches;
    for (const k of [0, 10, 25, 49]) {
      expect(t).toContain(nombreAffiche(tr[k].W, 1));
      expect(t).toContain(nombreAffiche(tr[k].mAlpha, 3));
    }
    expect(t).toContain('Limon');
    expect(t).toContain('Argile');
  });

  it('une surcharge variable stabilisatrice est dite non retenue', () => {
    const r = calculer(bandeAuPied()).r;
    expect(r.combinaisons[1].resultat.tranches.some((x) => x.Q > 0 && !x.qRetenue)).toBe(true);
    expect(texteVisible(tranchesHtml(r, 'DA1-2'))).toContain('non retenue');
    expect(texteVisible(tranchesHtml(calculer(saisieParDefaut()).r, 'DA1-2'))).not.toContain('non retenue');
  });
});

describe('volets', () => {
  for (const [nom, s] of SAISIES) {
    it(`${nom} : coefficients de chaque combinaison, sans NaN`, () => {
      const r = calculer(s).r;
      const h = voletsHtml(r);
      expect(h).not.toContain('NaN');
      expect(h).not.toContain('Infinity');
      expect((h.match(/<details/g) ?? []).length).toBeGreaterThan(1);
      const t = texteVisible(h);
      for (const c of r.combinaisons) expect(t).toContain(c.nom);
    });
  }

  it('coefficients affiches avec leur source, selon le profil', () => {
    expect(texteVisible(voletsHtml(calculer(saisieParDefaut()).r))).toContain('tableau A.4');
    expect(texteVisible(voletsHtml(calculer({ ...saisieParDefaut(), profilNormatif: 'anb2022' }).r))).toContain('ANB');
    expect(texteVisible(voletsHtml(calculer({ ...saisieParDefaut(), generation: '2e' }).r))).toContain('EN 1997-3:2025, tableau 4.2');
  });

  it('hypotheses : Bishop, γw, nombre de tranches, surcharge stabilisatrice', () => {
    const t = texteVisible(voletsHtml(calculer(saisieParDefaut()).r));
    expect(t).toContain('Bishop');
    expect(t).toContain('9,81');
    expect(t).toContain('50');
    expect(t.toLowerCase()).toContain('stabilisatrice');
  });
});

describe('blocs : donnees et resultats', () => {
  it('entrees : symboles uniques', () => {
    for (const [, s] of SAISIES) {
      const symboles = blocEntrees(calculer(s).calcul).lignes.map((l) => l.symbole);
      expect(new Set(symboles).size).toBe(symboles.length);
    }
  });

  it('entrees : couches numerotees, nappe et bandes seulement si saisies', () => {
    const a = blocEntrees(calculer(saisieParDefaut()).calcul).lignes.map((l) => l.symbole);
    for (const x of ['profil', 'couche 1', 'couche 2', 'nappe', 'cote limite']) expect(a).toContain(x);
    expect(a).not.toContain('bande 1');
    expect(a).not.toContain('cercle');
    const b = blocEntrees(calculer({ ...bandeAuPied(), avecNappe: false }).calcul).lignes.map((l) => l.symbole);
    expect(b).toContain('bande 1');
    expect(b).not.toContain('nappe');
    const c = blocEntrees(calculer(impose()).calcul).lignes.map((l) => l.symbole);
    expect(c).toContain('cercle');
    expect(c).not.toContain('cote limite');
  });

  it('entrees : le sol suit le comportement de chaque couche', () => {
    const l = blocEntrees(calculer(saisieParDefaut()).calcul).lignes;
    const limon = JSON.stringify(l.find((x) => x.symbole === 'couche 1'));
    const argile = JSON.stringify(l.find((x) => x.symbole === 'couche 2'));
    expect(limon).toContain('Limon');
    expect(limon).toContain('φ');
    expect(limon).not.toContain('c_u');
    expect(argile).toContain('c_u');
    expect(argile).not.toContain('φ');
  });

  it('entrees : champs propres a la generation seulement', () => {
    const t1 = JSON.stringify(blocEntrees(calculer(saisieParDefaut()).calcul));
    expect(t1).toContain('DA1');
    expect(t1).not.toContain('CC2');
    const t2 = JSON.stringify(blocEntrees(calculer({ ...saisieParDefaut(), generation: '2e' }).calcul));
    expect(t2).toContain('CC2');
    expect(t2).not.toContain('DA1');
  });

  it('resultats : F_d et taux de chaque combinaison, F caracteristique', () => {
    const r = calculer(saisieParDefaut()).r;
    const t = JSON.stringify(blocsResultat(r));
    for (const c of r.combinaisons) {
      expect(t).toContain(tauxAffiche(c.taux));
      expect(t).toContain(nombreAffiche(c.F, 3));
    }
    expect(t).toContain(nombreAffiche(r.caracteristique.F, 3));
  });

  for (const [nom, s] of SAISIES) {
    it(`CSV ${nom} : texte brut`, () => {
      const { calcul, r } = calculer(s);
      const c = resultatsEnCsv(blocsEnTexte([blocEntrees(calcul), ...blocsResultat(r)]));
      expect(c).not.toContain('_');
      expect(c).not.toMatch(NOMS_GRECS);
      expect(c).not.toContain('<');
      expect(c).not.toContain('NaN');
      expect(c).not.toContain('Infinity');
    });
  }
});

describe('texte visible : notations, arrondis, accents', () => {
  for (const [nom, s] of SAISIES) {
    it(nom, () => {
      const { calcul, r } = calculer(s);
      const html = [verdictsHtml(r), voletsHtml(r), tranchesHtml(r, r.gouvernant)].join('');
      expect(constatsAffichage(texteVisible(html))).toEqual([]);
      expect(constatsAffichage(texteVisible(notationHtml(blocEntrees(calcul).titre)))).toEqual([]);
    });
  }

  it('message d erreur : celui du noyau', () => {
    expect(messageDErreur(new Error('Au moins une couche est nécessaire.'))).toContain('couche');
    expect(messageDErreur('texte')).toBe('texte');
  });
});
