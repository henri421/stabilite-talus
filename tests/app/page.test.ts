/** T1 : la page, sa configuration, le cablage de main.ts. */

import { describe, expect, it } from 'vitest';
import { JETONS, constatsAffichage, contenuBalise, texteVisible, valeursDesJetons } from 'aedificium-ui';
import { saisieParDefaut } from '../../app/src/form';
import { lire } from './_commun';

const page = lire('../../app/index.html');
const main = lire('../../app/src/main.ts');

describe('page', () => {
  it('titre', () => {
    expect(contenuBalise(page, 'h1')).toBe('Stabilité de talus');
    expect(contenuBalise(page, 'title')?.startsWith('Stabilité de talus')).toBe(true);
  });

  it('un champ par valeur simple ; les listes ont leur zone', () => {
    const A_BOUTONS = ['generation', 'modeCercle'];
    const LISTES = ['profil', 'couches', 'piezo', 'bandes'];
    for (const cle of Object.keys(saisieParDefaut())) {
      if (A_BOUTONS.includes(cle) || LISTES.includes(cle)) continue;
      expect(page).toContain(`data-champ="${cle}"`);
    }
    for (const l of LISTES) expect(page).toContain(`data-role="${l}"`);
  });

  it('boutons de generation et de cercle ; choix normatifs', () => {
    for (const a of ['data-generation="1re"', 'data-generation="2e"', 'data-groupe="1re"', 'data-groupe="2e"', 'data-cercle="recherche"', 'data-cercle="impose"']) {
      expect(page).toContain(a);
    }
    for (const v of ['recommande', 'anb2022', 'faible', 'normal', 'eleve', 'DA1', 'DA2', 'DA3', 'CC1', 'CC2', 'CC3']) expect(page).toContain(`value="${v}"`);
    expect(texteVisible(page)).toContain('ANB:2022');
  });

  it('les lignes qui dependent d un choix le disent', () => {
    expect(page).toContain('data-si-cercle="recherche"');
    expect(page).toContain('data-si-cercle="impose"');
    expect(page).toContain('data-si-nappe');
    expect(page).toContain('data-si-profil="anb2022"');
  });

  it('talus type, zones de resultat, options du dessin, sorties', () => {
    for (const r of ['talus-type', 'erreur', 'vues', 'coupe', 'verdicts', 'volets', 'tranches', 'projet', 'element', 'ouvrir']) {
      expect(page).toContain(`data-role="${r}"`);
    }
    for (const t of ['H', 'n', 'crete', 'pied']) expect(page).toContain(`data-type="${t}"`);
    for (const a of ['ajouter-point', 'talus-type', 'ajouter-couche', 'ajouter-point-nappe', 'nappe-horizontale', 'ajouter-bande', 'exporter-note', 'exporter-coupe', 'exporter-resultats', 'enregistrer', 'reinitialiser']) {
      expect(page).toContain(`data-action="${a}"`);
    }
    expect(page).toContain('data-option="cotes"');
    expect(page).toContain('data-option="tranches"');
  });

  it('le hors-perimetre est annonce', () => {
    const t = texteVisible(page);
    for (const m of ['non circulaires', 'couches inclinées', 'renforcements', 'séisme', 'fissures de traction', 'états limites de service']) expect(t).toContain(m);
  });

  it('notations, accents, phrases types', () => {
    expect(constatsAffichage(texteVisible(page))).toEqual([]);
  });

  it('pas de reste du gabarit', () => {
    for (const f of [page, main, lire('../../vite.config.ts'), lire('../../app/src/pwa.ts')]) {
      expect(f.toLowerCase()).not.toContain('semelle');
      expect(f.toLowerCase()).not.toContain('fondations-superficielles');
    }
    expect(lire('../../vite.config.ts')).toContain('stabilite-talus');
  });

  it('le :root de style.css concorde avec les jetons communs', () => {
    const css = valeursDesJetons(lire('../../app/src/style.css'));
    for (const [nom, valeur] of valeursDesJetons(JETONS)) expect(css.get(nom)).toBe(valeur);
  });
});

describe('main.ts', () => {
  it('passe par le formulaire et les modules purs', () => {
    for (const f of ['lireSaisie(', 'verifier(', 'verdictsHtml(', 'voletsHtml(', 'tranchesHtml(', 'coupe(', 'vuesDisponibles(', 'vueGouvernante(', 'talusType(', 'nappeHorizontale(', 'noteDuCalcul(', 'blocsEnTexte(', 'noteDeCalculHtml(']) {
      expect(main).toContain(f);
    }
    expect(main).toMatch(/import \{[^}]*\bnoteDeCalculHtml\b[^}]*\} from 'aedificium-ui'/);
  });

  it('memorise saisie et cartouche sous le nom de l outil', () => {
    expect(main).toContain("'stabilite-talus/saisie'");
    expect(main).toContain("'stabilite-talus:cartouche'");
  });

  it('l interface ne calcule rien', () => {
    expect(main).not.toContain('verifierTalus');
    expect(main).not.toContain('rechercherCercleCritique');
    expect(main).not.toContain('analyserCercle');
    for (const f of [main, lire('../../app/src/vue.ts'), lire('../../app/src/note.ts')]) {
      expect(f).not.toMatch(/Math\.(tan|sin|cos|atan|exp|sqrt)/);
    }
  });
});
