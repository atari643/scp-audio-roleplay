import { LanguageBranch, SUPPORTED_LANGUAGES, LANGUE_PAR_DEFAUT } from '../types/scp';

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
 * La barre d'adresse devient ainsi copiable à tout instant, sans bouton
 * « partager » à maintenir.
 */
export function ecrireEtatPartage(slug: string | null, langue: LanguageBranch): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  const params = new URLSearchParams(window.location.search);

  if (slug) params.set('scp', slug);
  else params.delete('scp');

  // La langue n'est écrite que si elle n'est pas celle par défaut : un lien vers
  // un dossier français n'a pas besoin de le préciser, et l'adresse reste courte.
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
