/** Squelette (T1) : les types sont imposes par le plan, le corps reste a ecrire. */

import type { Approche, ClasseConsequences, CombinaisonStabilite, Risque } from 'sol-ec7';
import type { DonneesTalus, ResultatTalus } from '../../src/talus';

export type Generation = '1re' | '2e';

/** Un point saisi, en texte (virgule decimale acceptee). */
export interface PointSaisi {
  x: string;
  y: string;
}

/** Une couche saisie : les champs du comportement non retenu restent saisis mais ne sont pas lus. */
export interface CoucheSaisie {
  nom: string;
  drainage: 'draine' | 'non_draine';
  base: string;
  gamma: string;
  gammaSat: string;
  phi: string;
  c: string;
  cu: string;
}

export interface BandeSaisie {
  x0: string;
  x1: string;
  q: string;
  nature: 'G' | 'Q';
}

/** Une seule saisie pour les deux generations : tout est du texte, sauf les choix et les listes. */
export interface Saisie {
  generation: Generation;
  profilNormatif: 'recommande' | 'anb2022';
  risque: Risque;
  approche1: Approche;
  consequences: ClasseConsequences;
  profil: PointSaisi[];
  couches: CoucheSaisie[];
  avecNappe: boolean;
  piezo: PointSaisi[];
  bandes: BandeSaisie[];
  modeCercle: 'recherche' | 'impose';
  /** Recherche : cote sous laquelle le cercle ne descend pas ; vide, pas de limite. */
  coteLimite: string;
  xc: string;
  yc: string;
  R: string;
}

export interface Calcul {
  donnees: DonneesTalus;
}

export type Lecture = { ok: true; calcul: Calcul } | { ok: false; message: string };

/** Le resultat du noyau, avec la generation et les coefficients de chaque combinaison. */
export type Resultat = ResultatTalus & { generation: Generation; coefficients: CombinaisonStabilite[] };

export function saisieParDefaut(): Saisie {
  throw new Error('a ecrire');
}

export function lireSaisie(_s: Saisie): Lecture {
  throw new Error('a ecrire');
}

export function verifier(_calcul: Calcul): Resultat {
  throw new Error('a ecrire');
}

/**
 * « Talus type » : profil d'un talus de hauteur H (m), d'inclinaison n horizontal pour 1 vertical,
 * avec une crete et un pied horizontaux de longueurs donnees ; la crete finit en x = 0, a la cote H,
 * le pied commence a la cote 0. Nombres ecrits a la francaise, sans zero inutile.
 */
export function talusType(_H: number, _n: number, _crete: number, _pied: number): PointSaisi[] {
  throw new Error('a ecrire');
}

/** « Horizontale » : ligne piezometrique a la cote y, sur l'emprise en x du profil saisi. */
export function nappeHorizontale(_y: string, _profil: PointSaisi[]): PointSaisi[] {
  throw new Error('a ecrire');
}

export function serialiser(_s: Saisie): string {
  throw new Error('a ecrire');
}

export function relire(_contenu: string): Saisie {
  throw new Error('a ecrire');
}
