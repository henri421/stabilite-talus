/** Squelette (T3). */

import type { Calcul, Resultat } from './form';

/** 'caracteristique', puis les combinaisons dans l'ordre du noyau. */
export function vuesDisponibles(_r: Resultat): string[] {
  throw new Error('a ecrire');
}

export function vueGouvernante(_r: Resultat): string {
  throw new Error('a ecrire');
}

export function coupe(_calcul: Calcul, _r: Resultat, _vue: string, _options: { cotes: boolean; tranches: boolean }): string {
  throw new Error('a ecrire');
}
