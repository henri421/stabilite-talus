/** Saisies et lecture partagees par les tests d'acceptation de l'interface. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lireSaisie, saisieParDefaut, verifier, type Calcul, type CoucheSaisie, type Resultat, type Saisie } from '../../app/src/form';

export const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');

export function calculer(s: Saisie): { calcul: Calcul; r: Resultat } {
  const l = lireSaisie(s);
  if (!l.ok) throw new Error(l.message);
  return { calcul: l.calcul, r: verifier(l.calcul) };
}

const pts = (...p: [string, string][]) => p.map(([x, y]) => ({ x, y }));

export const LIMON: CoucheSaisie = { nom: 'Limon', drainage: 'draine', base: '4', gamma: '19', gammaSat: '20', phi: '30', c: '10', cu: '' };
export const ARGILE: CoucheSaisie = { nom: 'Argile', drainage: 'non_draine', base: '-40', gamma: '20', gammaSat: '21', phi: '', c: '', cu: '60' };

export const impose = (s: Partial<Saisie> = {}): Saisie => ({ ...saisieParDefaut(), modeCercle: 'impose', ...s });

/** Une surcharge variable au pied, du cote stabilisateur du cercle : non retenue. */
export const bandeAuPied = (s: Partial<Saisie> = {}): Saisie => ({ ...saisieParDefaut(), bandes: [{ x0: '20', x1: '28', q: '20', nature: 'Q' }], ...s });

/** Ligne piezometrique au-dessus du terrain au pied : le noyau le signale. */
export const eauHaute = (): Saisie => ({ ...saisieParDefaut(), piezo: pts(['-25', '10'], ['40', '2']) });

/** Argile molle : tous les taux depassent 1. */
export const instable = (): Saisie => ({ ...saisieParDefaut(), couches: [{ ...ARGILE, cu: '15' }], avecNappe: false });

/** Le meme talus, tourne vers la gauche. */
export const versLaGauche = (): Saisie => ({
  ...saisieParDefaut(),
  profil: pts(['-40', '0'], ['-15', '0'], ['0', '10'], ['25', '10']),
  piezo: pts(['-40', '0'], ['-15', '0'], ['0', '7'], ['25', '7']),
});

/** Toutes les formes de resultat que l'interface doit savoir afficher. */
export const SAISIES: [string, Saisie][] = [
  ['defaut', saisieParDefaut()],
  ['impose', impose()],
  ['DA2', { ...saisieParDefaut(), approche1: 'DA2' }],
  ['DA3', { ...saisieParDefaut(), approche1: 'DA3' }],
  ['ANB', { ...saisieParDefaut(), profilNormatif: 'anb2022' }],
  ['ANB risque eleve', { ...saisieParDefaut(), profilNormatif: 'anb2022', risque: 'eleve' }],
  ['2e', { ...saisieParDefaut(), generation: '2e' }],
  ['2e CC3', { ...saisieParDefaut(), generation: '2e', consequences: 'CC3' }],
  ['sans nappe', { ...saisieParDefaut(), avecNappe: false }],
  ['sans cote limite', { ...saisieParDefaut(), coteLimite: '' }],
  ['bande Q en crete', { ...saisieParDefaut(), bandes: [{ x0: '-12', x1: '-4', q: '10', nature: 'Q' }] }],
  ['bande G en crete', { ...saisieParDefaut(), bandes: [{ x0: '-12', x1: '-4', q: '10', nature: 'G' }] }],
  ['bande au pied', bandeAuPied()],
  ['eau haute', eauHaute()],
  ['instable', instable()],
  ['vers la gauche', versLaGauche()],
  ['une couche drainee', { ...saisieParDefaut(), couches: [{ ...LIMON, base: '-40' }] }],
];
