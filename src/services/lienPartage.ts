import { LanguageBranch, SUPPORTED_LANGUAGES, LANGUE_PAR_DEFAUT } from '../types/scp';
import { NOM_SITE, adresseCanonique } from './adresseSite';

/**
 * Les liens partageables : `?scp=scp-173&lang=en`.
 *
 * Sans eux, toute adresse copiée renvoyait à l'accueil. C'est un défaut pour
 * l'utilisateur — on ne peut pas dire « écoute celui-là » — mais surtout pour la
 * diffusion : un lien posté dans une communauté anglophone ouvrait l'application
 * en français, c'est-à-dire sur un catalogue que le lecteur ne cherchait pas.
 *
 * Volontairement un **paramètre de requête, pas un routeur**. Le miroir GitHub
 * Pages est servi sous un sous-chemin (`VITE_BASE`) et Vercel à la racine : un
 * chemin obligerait à traiter les deux cas, là où une requête vaut partout et ne
 * touche à aucune configuration de déploiement.
 *
 * Tout passe par `useScpApp()` : c'est l'état partagé des deux vues, donc il n'y
 * a qu'une implémentation à maintenir.
 */

export interface EtatPartage {
  slug: string | null;
  langue: LanguageBranch | null;
}

/** Un slug de dossier, tel que Wikidot les écrit : `scp-173`, `scp-5618-fr`. */
const SLUG_VALIDE = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * Ce que l'adresse courante demande d'ouvrir.
 *
 * Les deux paramètres sont indépendants : `?lang=en` seul ouvre l'application sur
 * la branche anglaise, ce qui est exactement ce qu'on veut d'un lien partagé dans
 * une communauté anglophone.
 *
 * Tout ce qui ne ressemble pas à un slug est ignoré plutôt que corrigé : la valeur
 * vient de l'adresse, donc de n'importe qui, et elle finit dans une requête.
 */
export function lireEtatPartage(recherche: string = window.location.search): EtatPartage {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(recherche);
  } catch {
    return { slug: null, langue: null };
  }

  const brut = (params.get('scp') ?? '').trim().toLowerCase();
  const slug = SLUG_VALIDE.test(brut) ? brut : null;

  const code = (params.get('lang') ?? '').trim().toLowerCase();
  const langue = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === code) ?? null;

  return { slug, langue };
}

/**
 * Met l'adresse à jour sans ajouter d'entrée d'historique.
 *
 * `replaceState` et non `pushState` : la navigation entre dossiers a déjà sa
 * propre pile (`navigationStack` dans `useScpApp`), et empiler aussi dans
 * l'historique du navigateur ferait que le bouton « précédent » ne correspondrait
 * plus à ce que montre l'interface.
 *
 * La barre d'adresse devient ainsi copiable à tout instant. Elle ne suffit pas pour
 * autant : l'application Android n'en a pas, et sur téléphone personne ne va la
 * chercher — d'où `partagerLien()` et le bouton des deux lecteurs.
 */
export function ecrireEtatPartage(slug: string | null, langue: LanguageBranch): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  const params = new URLSearchParams(window.location.search);

  if (slug) params.set('scp', slug);
  else params.delete('scp');

  // La langue n'est écrite que si elle n'est pas celle par défaut : un lien vers
  // un dossier anglais n'a pas besoin de le préciser, et l'adresse reste courte.
  if (langue.code === LANGUE_PAR_DEFAUT.code) params.delete('lang');
  else params.set('lang', langue.code);

  const requete = params.toString();
  // `window.location.pathname` et non une racine codée en dur : sur le miroir
  // Pages, le chemin porte le nom du dépôt.
  const url = requete ? `${window.location.pathname}?${requete}` : window.location.pathname;

  try {
    window.history.replaceState(null, '', url);
  } catch {
    // Contexte où l'historique est refusé (iframe cloisonnée, `file://`). Sans
    // conséquence : l'application fonctionne, seule l'adresse ne suit pas.
  }
}

/** Le titre d'onglet livré par `index.html` (ou par le middleware des aperçus). */
let titreInitial: string | null = null;

/**
 * Le titre de l'onglet et le lien canonique suivent le dossier ouvert.
 *
 * Le titre, parce qu'un onglet, un favori ou une entrée d'historique intitulés
 * « SCP Audio Roleplay » pour chacun des dossiers écoutés ne servent à rien. Le
 * lien canonique, parce que le miroir Pages sert la même application sous un
 * autre domaine : il désigne Vercel des deux côtés, et un moteur de recherche ne
 * voit plus qu'un site. Google lit un canonique posé par le script, à condition
 * qu'il n'y en ait qu'un — d'où la mise à jour de la balise existante plutôt qu'un
 * ajout.
 *
 * `titreAccueil` est fourni par l'appelant (`t('site.titre')`) : ce module ne
 * dépend pas du dictionnaire, et le middleware le charge sans lui.
 */
export function ecrireEnTete(
  nomDossier: string | null,
  slug: string | null,
  codeLangue: string,
  titreAccueil: string
): void {
  if (typeof document === 'undefined') return;
  if (titreInitial === null) titreInitial = document.title;

  document.title = nomDossier ? `${nomDossier} · ${NOM_SITE}` : titreAccueil || titreInitial;

  let lien = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!lien) {
    lien = document.createElement('link');
    lien.rel = 'canonical';
    document.head.appendChild(lien);
  }
  lien.href = adresseCanonique(slug, codeLangue);
}

/**
 * Ce qu'il est advenu d'un partage. `annule` : la feuille de partage native a été
 * fermée sans choisir d'application — ce n'est pas un échec, rien à signaler.
 */
export type IssuePartage = 'partage' | 'copie' | 'annule' | 'echec';

/**
 * Partage un lien : feuille native si on la demande et qu'elle existe, sinon copie.
 *
 * La feuille native (`navigator.share`) est réservée au téléphone : sur ordinateur,
 * Chrome ouvre le panneau de partage de Windows, ce qu'on n'attend pas d'un bouton
 * posé à côté de « Source ». La WebView Android ne l'a pas du tout — l'application
 * installée passe donc par la copie.
 *
 * La copie a elle-même un repli : `navigator.clipboard` manque hors contexte
 * sécurisé et peut être refusé dans une WebView, alors que `execCommand('copy')`,
 * déprécié mais universel, fonctionne encore partout où il y a un geste de
 * l'utilisateur.
 */
export async function partagerLien(adresse: string, titre: string, natif: boolean): Promise<IssuePartage> {
  if (natif && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: titre, url: adresse });
      return 'partage';
    } catch (erreur) {
      if (erreur instanceof DOMException && erreur.name === 'AbortError') return 'annule';
      // Refus pour une autre raison (permission, contexte) : on retombe sur la copie.
    }
  }

  try {
    await navigator.clipboard.writeText(adresse);
    return 'copie';
  } catch {
    // `clipboard` absent ou refusé : repli ci-dessous.
  }

  try {
    const zone = document.createElement('textarea');
    zone.value = adresse;
    zone.setAttribute('readonly', '');
    zone.style.position = 'fixed';
    zone.style.opacity = '0';
    document.body.appendChild(zone);
    zone.select();
    const copie = document.execCommand('copy');
    zone.remove();
    return copie ? 'copie' : 'echec';
  } catch {
    return 'echec';
  }
}
