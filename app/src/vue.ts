/** Squelette (T2). */

import type { BlocResultat } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';

export function verdictsHtml(_r: Resultat): string {
  throw new Error('a ecrire');
}

export function voletsHtml(_r: Resultat): string {
  throw new Error('a ecrire');
}

/** Tableau des tranches du cercle de la vue (nom de combinaison ou 'caracteristique'). */
export function tranchesHtml(_r: Resultat, _vue: string): string {
  throw new Error('a ecrire');
}

export function blocEntrees(_calcul: Calcul): BlocResultat {
  throw new Error('a ecrire');
}

export function blocsResultat(_r: Resultat): BlocResultat[] {
  throw new Error('a ecrire');
}

export function messageDErreur(_e: unknown): string {
  throw new Error('a ecrire');
}
