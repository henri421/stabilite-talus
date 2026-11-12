/**
 * Cablage de l'interface de stabilite de talus.
 *
 * Ce module ne calcule RIEN : il tient la saisie, appelle le noyau par `form`,
 * et confie la mise en forme aux modules purs. La generation n'est qu'un champ
 * de la saisie : la basculer ne touche a aucune valeur saisie.
 */

import {
  blocsEnTexte,
  brancherFeuilles,
  definirLangue,
  echapper,
  langueDuDocument,
  lireNombre,
  noteDeCalculHtml,
  notationHtml,
  ouvrirOuTelecharger,
  resultatsEnCsv,
  svgAutonome,
  telecharger,
  type BarreFeuilles,
  type Json,
  avertissement2eGeneration,
} from 'aedificium-ui';
import {
  lireSaisie,
  nappeHorizontale,
  relire,
  saisieParDefaut,
  serialiser,
  talusType,
  verifier,
  type BandeSaisie,
  type Calcul,
  type CoucheSaisie,
  type PointSaisi,
  type Resultat,
  type Saisie,
} from './form';
import { coupe, vueGouvernante, vuesDisponibles } from './dessin';
import { STYLES_TRACE } from './export';
import { noteDuCalcul } from './note';
import { textes } from './textes';
import { blocEntrees, blocsResultat, messageDErreur, tranchesHtml, verdictsHtml, voletsHtml } from './vue';
import './style.css';

// La langue d'abord : tout rendu la lit (`index.html` ou `en/index.html`).
definirLangue(langueDuDocument(document));

const CLE_SAISIE = 'stabilite-talus/saisie';
const CLE_CARTOUCHE = 'stabilite-talus:cartouche';

function exige<T extends Element>(selecteur: string): T {
  const e = document.querySelector<T>(selecteur);
  if (e === null) throw new Error(textes().page.elementAbsent(selecteur));
  return e;
}

const formulaire = exige<HTMLFormElement>('#formulaire');
const zones = {
  erreur: exige<HTMLElement>('[data-role="erreur"]'),
  profil: exige<HTMLElement>('[data-role="profil"]'),
  piezo: exige<HTMLElement>('[data-role="piezo"]'),
  bandes: exige<HTMLElement>('[data-role="bandes"]'),
  couches: exige<HTMLElement>('[data-role="couches"]'),
  vues: exige<HTMLElement>('[data-role="vues"]'),
  coupe: exige<HTMLElement>('[data-role="coupe"]'),
  tranches: exige<HTMLElement>('[data-role="tranches"]'),
  verdicts: exige<HTMLElement>('[data-role="verdicts"]'),
  volets: exige<HTMLElement>('[data-role="volets"]'),
};
const champProjet = exige<HTMLInputElement>('[data-role="projet"]');
const champElement = exige<HTMLInputElement>('[data-role="element"]');

function charger(): Saisie | null {
  try {
    const t = window.localStorage.getItem(CLE_SAISIE);
    return t === null ? null : relire(t);
  } catch {
    return null;
  }
}

function memoriser(): void {
  try {
    window.localStorage.setItem(CLE_SAISIE, serialiser(saisie));
  } catch {
    // Stockage indisponible : la page fonctionne sans.
  }
}

function lireCartouche(): { projet: string; element: string } {
  try {
    const t = window.localStorage.getItem(CLE_CARTOUCHE);
    if (t === null) return { projet: '', element: '' };
    const c = JSON.parse(t) as { projet?: unknown; element?: unknown };
    return {
      projet: typeof c.projet === 'string' ? c.projet : '',
      element: typeof c.element === 'string' ? c.element : '',
    };
  } catch {
    return { projet: '', element: '' };
  }
}

let saisie: Saisie = charger() ?? saisieParDefaut();

/**
 * Feuilles de calcul d'un projet de la suite. Dans un projet, chaque saisie
 * va dans la feuille courante, pas dans la memoire « hors projet » de l'app.
 */
let barre: BarreFeuilles | null = null;

interface Dernier {
  calcul: Calcul;
  resultat: Resultat;
}
let dernier: Dernier | null = null;
/** Vue du dessin : 'caracteristique' ou le nom d'une combinaison. */
let vue: string | null = null;

type Racine = Record<string, unknown>;
type ChampCouche = 'nom' | 'base' | 'gamma' | 'gammaSat' | 'phi' | 'c' | 'cu';
const CHAMPS_COUCHE: readonly string[] = ['nom', 'base', 'gamma', 'gammaSat', 'phi', 'c', 'cu'];
const CHAMPS_BANDE: readonly string[] = ['x0', 'x1', 'q', 'nature'];

function boutons(selecteur: string): HTMLButtonElement[] {
  return [...formulaire.querySelectorAll<HTMLButtonElement>(selecteur)];
}

/** Recopie la saisie dans les champs `data-champ`, puis redessine les listes. */
function ecrireSaisie(): void {
  for (const e of formulaire.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-champ]')) {
    const cle = e.dataset.champ;
    if (cle === undefined) continue;
    const v = (saisie as unknown as Racine)[cle];
    if (e instanceof HTMLInputElement && e.type === 'checkbox') e.checked = v === true;
    else e.value = String(v);
  }
  dessinerListes();
  ajusterAffichage();
}

function ligneDePoint(liste: 'profil' | 'piezo', p: PointSaisi, i: number): string {
  const t = textes().page;
  const cellule = (coord: 'x' | 'y'): string =>
    `<td><input type="text" inputmode="decimal" data-liste="${liste}" data-index="${i}" data-coord="${coord}" value="${echapper(p[coord])}" aria-label="${coord}, point ${i + 1}" /></td>`;
  return `<tr>${cellule('x')}${cellule('y')}<td><button type="button" data-action="retirer-point" data-liste="${liste}" data-index="${i}" aria-label="${t.retirerPoint(i + 1)}">×</button></td></tr>`;
}

function ligneDeBande(b: BandeSaisie, i: number): string {
  const t = textes();
  const cellule = (cle: 'x0' | 'x1' | 'q', aria: string): string =>
    `<td><input type="text" inputmode="decimal" data-bande="${i}" data-champ-bande="${cle}" value="${echapper(b[cle])}" aria-label="${aria}, ${t.page.surcharge(i + 1)}" /></td>`;
  const nature = (valeur: 'G' | 'Q'): string => (b.nature === valeur ? ' selected' : '');
  const champs = t.refus.champsBande;
  return `<tr>${cellule('x0', champs.x0)}${cellule('x1', champs.x1)}${cellule('q', champs.q)}
    <td><select data-bande="${i}" data-champ-bande="nature" aria-label="${t.page.nature}, ${t.page.surcharge(i + 1)}"><option value="G"${nature('G')}>G</option><option value="Q"${nature('Q')}>Q</option></select></td>
    <td><button type="button" data-action="retirer-bande" data-bande="${i}" aria-label="${t.page.retirerSurcharge(i + 1)}">×</button></td></tr>`;
}

/** Un bloc par couche (pas de tableau) : nom, comportement, cote de base, poids, puis φ’ et c’ ou c_u. */
function blocCouche(c: CoucheSaisie, i: number): string {
  const n = i + 1;
  const t = textes().page;
  const draine = c.drainage === 'draine';
  const champ = (cle: Exclude<ChampCouche, 'nom'>, libelle: string, aria: string): string =>
    `<label><span>${libelle}</span><input type="text" inputmode="decimal" data-couche="${i}" data-champ-couche="${cle}" value="${echapper(c[cle])}" aria-label="${t.champCouche(aria, n)}" /></label>`;
  return `<fieldset>
    <legend>${t.couche(n)}</legend>
    <label><span>${t.nom}</span><input type="text" data-couche="${i}" data-champ-couche="nom" value="${echapper(c.nom)}" aria-label="${t.nomCouche(n)}" /></label>
    <div class="boutons">
      <button type="button" data-couche="${i}" data-drainage="draine" aria-pressed="${draine}">${t.drainee}</button>
      <button type="button" data-couche="${i}" data-drainage="non_draine" aria-pressed="${!draine}">${t.nonDrainee}</button>
      <button type="button" data-action="retirer-couche" data-couche="${i}" aria-label="${t.retirerCouche(n)}">${t.retirer}</button>
    </div>
    ${champ('base', t.coteBaseLibelle, t.coteBase)}
    <label><span>γ (kN/m³)</span><input type="text" inputmode="decimal" data-couche="${i}" data-champ-couche="gamma" value="${echapper(c.gamma)}" aria-label="${t.champCouche('γ', n)}" /></label>
    <label><span>γ<sub>sat</sub> (kN/m³)</span><input type="text" inputmode="decimal" data-couche="${i}" data-champ-couche="gammaSat" value="${echapper(c.gammaSat)}" aria-label="${t.champCouche('γsat', n)}" /></label>
    ${draine ? champ('phi', 'φ’<sub>k</sub> (°)', 'φ’k') + champ('c', 'c’<sub>k</sub> (kPa)', 'c’k') : champ('cu', 'c<sub>u,k</sub> (kPa)', 'c_u,k')}
  </fieldset>`;
}

/** Les listes se redessinent quand leurs lignes changent ; une saisie ne les redessine pas (le curseur resterait perdu). */
function dessinerListes(): void {
  zones.profil.innerHTML = saisie.profil.map((p, i) => ligneDePoint('profil', p, i)).join('');
  zones.piezo.innerHTML = saisie.piezo.map((p, i) => ligneDePoint('piezo', p, i)).join('');
  zones.bandes.innerHTML = saisie.bandes.map((b, i) => ligneDeBande(b, i)).join('');
  zones.couches.innerHTML = saisie.couches.map((c, i) => blocCouche(c, i)).join('');
}

function montrerErreur(message: string | null): void {
  zones.erreur.hidden = message === null;
  zones.erreur.innerHTML = message === null ? '' : notationHtml(message);
}

/** Les lignes qui dependent d'un choix s'affichent avec lui ; leur valeur reste en memoire. */
function ajusterAffichage(): void {
  for (const b of boutons('[data-generation]')) {
    b.setAttribute('aria-pressed', String(b.dataset.generation === saisie.generation));
  }
  const bandeau = document.querySelector<HTMLElement>('[data-role="bandeau-2e-gen"]');
  if (bandeau !== null) {
    bandeau.hidden = saisie.generation !== '2e';
    bandeau.textContent = avertissement2eGeneration();
  }
  for (const b of boutons('[data-cercle]')) {
    b.setAttribute('aria-pressed', String(b.dataset.cercle === saisie.modeCercle));
  }
  for (const g of formulaire.querySelectorAll<HTMLElement>('[data-groupe]')) {
    g.hidden = g.dataset.groupe !== saisie.generation;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-cercle]')) {
    z.hidden = z.dataset.siCercle !== saisie.modeCercle;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-profil]')) {
    z.hidden = z.dataset.siProfil !== saisie.profilNormatif;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-nappe]')) {
    z.hidden = !saisie.avecNappe;
  }
  // ANB 2022 : l'approche est DA1, liste grisee (`lireSaisie` passe DA1 de toute facon).
  const approche = formulaire.querySelector<HTMLSelectElement>('[data-champ="approche1"]');
  if (approche !== null) {
    const anb = saisie.profilNormatif === 'anb2022';
    approche.disabled = anb;
    if (anb) approche.value = 'DA1';
  }
}

function optionsDessin(): { cotes: boolean; tranches: boolean } {
  return {
    cotes: exige<HTMLInputElement>('[data-option="cotes"]').checked,
    tranches: exige<HTMLInputElement>('[data-option="tranches"]').checked,
  };
}

const libelleVue = (v: string): string => (v === 'caracteristique' ? textes().page.caracteristique : v);

function dessinerVues(): void {
  const vues = dernier === null ? [] : vuesDisponibles(dernier.resultat);
  if (dernier !== null && (vue === null || !vues.includes(vue))) vue = vueGouvernante(dernier.resultat);
  zones.vues.innerHTML = vues
    .map((v) => `<button type="button" data-vue="${echapper(v)}" aria-pressed="${v === vue}">${echapper(libelleVue(v))}</button>`)
    .join('');
}

function renduDessin(): void {
  if (dernier === null || vue === null) {
    zones.coupe.innerHTML = '';
    zones.tranches.innerHTML = '';
    return;
  }
  zones.coupe.innerHTML = coupe(dernier.calcul, dernier.resultat, vue, optionsDessin());
  zones.tranches.innerHTML = tranchesHtml(dernier.resultat, vue);
}

function viderResultats(): void {
  dernier = null;
  vue = null;
  zones.vues.innerHTML = '';
  zones.verdicts.innerHTML = '';
  zones.volets.innerHTML = '';
  renduDessin();
}

function recalculer(): void {
  if (barre?.dansUnProjet()) barre.signaler();
  else memoriser();
  ajusterAffichage();
  const lecture = lireSaisie(saisie);
  if (!lecture.ok) {
    montrerErreur(lecture.message);
    viderResultats();
    return;
  }
  let resultat: Resultat;
  try {
    resultat = verifier(lecture.calcul);
  } catch (e) {
    montrerErreur(messageDErreur(e));
    viderResultats();
    return;
  }
  montrerErreur(null);
  dernier = { calcul: lecture.calcul, resultat };
  zones.verdicts.innerHTML = verdictsHtml(resultat);
  zones.volets.innerHTML = voletsHtml(resultat);
  dessinerVues();
  renduDessin();
}

/** Une saisie dans un champ : point, couche, surcharge ou champ simple. Les listes ne se redessinent pas ici. */
function lireEdition(cible: EventTarget | null): void {
  if (!(cible instanceof HTMLInputElement || cible instanceof HTMLSelectElement)) return;
  const d = cible.dataset;

  if (d.coord !== undefined && d.index !== undefined) {
    const liste = d.liste === 'piezo' ? saisie.piezo : saisie.profil;
    const p = liste[Number(d.index)];
    if (p === undefined) return;
    if (d.coord === 'x') p.x = cible.value;
    else p.y = cible.value;
  } else if (d.couche !== undefined && d.champCouche !== undefined) {
    const c = saisie.couches[Number(d.couche)];
    if (c === undefined || !CHAMPS_COUCHE.includes(d.champCouche)) return;
    c[d.champCouche as ChampCouche] = cible.value;
  } else if (d.bande !== undefined && d.champBande !== undefined) {
    const b = saisie.bandes[Number(d.bande)];
    if (b === undefined || !CHAMPS_BANDE.includes(d.champBande)) return;
    if (d.champBande === 'nature') b.nature = cible.value === 'Q' ? 'Q' : 'G';
    else b[d.champBande as 'x0' | 'x1' | 'q'] = cible.value;
  } else if (d.champ !== undefined) {
    const valeur = cible instanceof HTMLInputElement && cible.type === 'checkbox' ? cible.checked : cible.value;
    (saisie as unknown as Racine)[d.champ] = valeur;
    if (d.champ === 'avecNappe' || d.champ === 'profilNormatif') ajusterAffichage();
  } else {
    return;
  }
  recalculer();
}

formulaire.addEventListener('input', (evenement) => lireEdition(evenement.target));

for (const option of document.querySelectorAll<HTMLInputElement>('[data-option]')) {
  option.addEventListener('input', () => renduDessin());
}

function cartouche(): { projet: string; element: string; date: string } {
  return {
    projet: champProjet.value,
    element: champElement.value,
    date: new Date().toISOString().slice(0, 10),
  };
}

/** Lit un champ de la fiche « Talus type ». */
function nombreDuTalusType(type: string): number | null {
  return lireNombre(exige<HTMLInputElement>(`[data-type="${type}"]`).value);
}

/** Nombre ecrit comme a la saisie : virgule decimale, sans zero inutile. */
function nombreSaisi(v: number): string {
  return String(Math.round(v * 1000) / 1000).replace('.', ',');
}

/** Point ajoute : 5 m apres le dernier, a la meme cote ; (0 ; 0) si la liste est vide ou illisible. */
function pointSuivant(liste: { x: string; y: string }[]): { x: string; y: string } {
  const der = liste[liste.length - 1];
  const x = der === undefined ? null : lireNombre(der.x);
  return x === null || der === undefined ? { x: '0', y: '0' } : { x: nombreSaisi(x + 5), y: der.y };
}

document.addEventListener('click', (evenement) => {
  const cible = evenement.target;
  if (!(cible instanceof HTMLElement)) return;
  const d = cible.dataset;

  if (d.generation === '1re' || d.generation === '2e') {
    saisie.generation = d.generation;
    ecrireSaisie();
    return recalculer();
  }

  if (d.cercle === 'recherche' || d.cercle === 'impose') {
    saisie.modeCercle = d.cercle;
    ajusterAffichage();
    return recalculer();
  }

  if (d.drainage === 'draine' || d.drainage === 'non_draine') {
    const c = saisie.couches[Number(d.couche)];
    if (c === undefined) return;
    c.drainage = d.drainage;
    dessinerListes();
    return recalculer();
  }

  if (d.vue !== undefined) {
    vue = d.vue;
    dessinerVues();
    return renduDessin();
  }

  const action = d.action;
  if (action === undefined) return;

  if (action === 'ajouter-point') {
    saisie.profil.push(pointSuivant(saisie.profil));
    dessinerListes();
    return recalculer();
  }
  if (action === 'ajouter-point-nappe') {
    saisie.piezo.push(pointSuivant(saisie.piezo));
    dessinerListes();
    return recalculer();
  }
  if (action === 'retirer-point') {
    const liste = d.liste === 'piezo' ? saisie.piezo : saisie.profil;
    const i = Number(d.index);
    if (Number.isInteger(i)) liste.splice(i, 1);
    dessinerListes();
    return recalculer();
  }
  if (action === 'talus-type') {
    const H = nombreDuTalusType('H');
    const n = nombreDuTalusType('n');
    const crete = nombreDuTalusType('crete');
    const pied = nombreDuTalusType('pied');
    if (H === null || n === null || crete === null || pied === null) {
      return montrerErreur(textes().page.talusType);
    }
    saisie.profil = talusType(H, n, crete, pied);
    dessinerListes();
    return recalculer();
  }
  if (action === 'nappe-horizontale') {
    const y = exige<HTMLInputElement>('[data-role="cote-horizontale"]').value;
    saisie.piezo = nappeHorizontale(y, saisie.profil);
    dessinerListes();
    return recalculer();
  }
  if (action === 'ajouter-couche') {
    // Une nouvelle couche reprend la derniere, 10 m plus bas : la saisie reste calculable.
    const der = saisie.couches[saisie.couches.length - 1];
    const base = der === undefined ? null : lireNombre(der.base);
    saisie.couches.push(
      der === undefined || base === null
        ? { nom: '', drainage: 'draine', base: '-20', gamma: '19', gammaSat: '20', phi: '30', c: '0', cu: '' }
        : { ...der, nom: '', base: nombreSaisi(base - 10) }
    );
    dessinerListes();
    return recalculer();
  }
  if (action === 'retirer-couche') {
    const i = Number(d.couche);
    if (Number.isInteger(i)) saisie.couches.splice(i, 1);
    dessinerListes();
    return recalculer();
  }
  if (action === 'ajouter-bande') {
    // Une bande de 5 m au debut du profil, 10 kPa variable : a ajuster.
    const x0 = lireNombre(saisie.profil[0]?.x ?? '') ?? 0;
    saisie.bandes.push({ x0: nombreSaisi(x0 + 1), x1: nombreSaisi(x0 + 6), q: '10', nature: 'Q' });
    dessinerListes();
    return recalculer();
  }
  if (action === 'retirer-bande') {
    const i = Number(d.bande);
    if (Number.isInteger(i)) saisie.bandes.splice(i, 1);
    dessinerListes();
    return recalculer();
  }
  if (action === 'enregistrer') {
    return telecharger('stabilite-talus.json', serialiser(saisie), 'application/json;charset=utf-8');
  }
  if (action === 'reinitialiser') {
    saisie = saisieParDefaut();
    ecrireSaisie();
    return recalculer();
  }

  if (!action.startsWith('exporter-')) return;
  if (dernier === null || vue === null) return montrerErreur(textes().messages.rienAExporter);
  const e = dernier;
  if (action === 'exporter-coupe') {
    const trace = coupe(e.calcul, e.resultat, vue, optionsDessin());
    telecharger('stabilite-talus-coupe.svg', svgAutonome(trace, STYLES_TRACE), 'image/svg+xml;charset=utf-8');
  } else if (action === 'exporter-resultats') {
    const blocs = [blocEntrees(e.calcul), ...blocsResultat(e.resultat)];
    telecharger('stabilite-talus-resultats.csv', resultatsEnCsv(blocsEnTexte(blocs)), 'text/csv;charset=utf-8');
  } else if (action === 'exporter-note') {
    const note = noteDuCalcul(e.calcul, e.resultat, cartouche());
    ouvrirOuTelecharger('stabilite-talus-note.html', noteDeCalculHtml(note, STYLES_TRACE));
  }
});

exige<HTMLInputElement>('[data-role="ouvrir"]').addEventListener('change', async (e) => {
  const entree = e.target as HTMLInputElement;
  const f = entree.files?.[0];
  entree.value = '';
  if (f === undefined) return;
  try {
    saisie = relire(await f.text());
  } catch (err) {
    return montrerErreur(messageDErreur(err));
  }
  ecrireSaisie();
  recalculer();
});

const cartoucheMemorise = lireCartouche();
champProjet.value = cartoucheMemorise.projet;
champElement.value = cartoucheMemorise.element;
for (const champ of [champProjet, champElement]) {
  champ.addEventListener('input', () => {
    try {
      window.localStorage.setItem(CLE_CARTOUCHE, JSON.stringify({ projet: champProjet.value, element: champElement.value }));
    } catch {
      // Stockage indisponible : la page fonctionne sans.
    }
  });
}

barre = brancherFeuilles({
  app: 'stabilite-talus',
  nomApp: exige<HTMLElement>('header h1').textContent ?? 'stabilite-talus',
  conteneur: exige<HTMLElement>('[data-role="feuilles"]'),
  lire: () => JSON.parse(serialiser(saisie)) as Json,
  charger: (d) => {
    saisie = d === null ? saisieParDefaut() : relire(JSON.stringify(d));
    ecrireSaisie();
    recalculer();
  },
});

ecrireSaisie();
recalculer();

// Hors navigateur (tests), pas de service worker.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void import('./pwa').then((m) => m.enregistrerServiceWorker());
}
