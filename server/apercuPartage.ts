/**
 * L'aperçu d'un lien partagé : titre, description et langue écrits dans le HTML.
 *
 * Discord, Reddit, X, WhatsApp, Slack et les moteurs de recherche lisent les
 * balises `<meta>` de la page **sans exécuter son JavaScript**. Or l'application
 * est une SPA : `?scp=scp-3008` et l'accueil servent le même `index.html`, donc
 * chaque dossier partagé s'affichait « SCP Audio Roleplay », sans un mot du dossier
 * dont on parlait. Ce module récrit l'en-tête pour ces robots-là.
 *
 * Deux appelants, un seul code :
 *  · `middleware.ts` sur Vercel, devant `/` ;
 *  · `server/index.ts` (`npm run serve`), qui sert de banc d'essai local :
 *      curl -A Discordbot "http://localhost:4173/?scp=scp-3008"
 *
 * **Réservé aux robots.** Le HTML récrit EST l'application — un humain qui le
 * recevrait par erreur n'y perdrait rien — mais il coûte une requête à Crom,
 * c'est-à-dire plusieurs centaines de millisecondes avant le premier octet. Un
 * visiteur n'a pas à les payer pour des balises qu'il ne lira jamais : son onglet,
 * lui, prend son titre du script (`ecrireEnTete`). Les deux produisent le même
 * titre, donc ce que voit le robot est ce que voit la personne.
 *
 * Tout échec rend `null` : l'appelant sert alors la page ordinaire. Un aperçu
 * générique vaut mieux qu'une page d'erreur.
 */

// Extensions `.js` explicites dans toute la chaîne : voir `api/tts.ts`.
import { SUPPORTED_LANGUAGES, LANGUE_PAR_DEFAUT } from '../src/types/scp.js';
import { NOM_SITE, adresseCanonique, titreDossier } from '../src/services/adresseSite.js';
import { FR } from '../src/i18n/fr.js';
import { EN } from '../src/i18n/en.js';
import de from '../src/i18n/langues/de.json';
import es from '../src/i18n/langues/es.json';
import it from '../src/i18n/langues/it.json';
import ja from '../src/i18n/langues/ja.json';
import ko from '../src/i18n/langues/ko.json';
import pl from '../src/i18n/langues/pl.json';
import ru from '../src/i18n/langues/ru.json';
import zhCN from '../src/i18n/langues/zh-CN.json';

type CleSite = 'site.titre' | 'site.description' | 'site.dossierDescription' | 'site.dossierTexte';

/**
 * Les dictionnaires de l'interface, pour les quatre clés `site.*` : les textes
 * d'aperçu sont traduits et audités avec le reste (`npm run i18n`), pas dans une
 * table à part qu'on oublierait de tenir à jour.
 */
const DICTIONNAIRES: Record<string, Record<CleSite, string>> = {
  fr: FR,
  en: EN,
  de,
  es,
  it,
  ja,
  ko,
  pl,
  ru,
  'zh-CN': zhCN
};

/** Même filtre que `lireEtatPartage()` : la valeur vient de l'adresse, donc de n'importe qui. */
const SLUG_VALIDE = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * Les robots qui fabriquent un aperçu ou indexent la page.
 *
 * « bot » couvre à lui seul Googlebot, bingbot, Twitterbot, Discordbot, redditbot,
 * Slackbot, TelegramBot, LinkedInBot, Applebot, GPTBot, ClaudeBot… Le reste nomme
 * ceux qui ne s'appellent pas ainsi. Un faux positif (un téléphone Cubot) reçoit
 * l'application avec de meilleures balises : sans conséquence.
 */
const ROBOTS =
  /bot|crawler|spider|facebookexternalhit|facebookcatalog|embedly|iframely|whatsapp|skypeuripreview|vkshare|pinterest|mastodon|bluesky|cardyb|preview/i;

export function estRobotDApercu(userAgent: string | null | undefined): boolean {
  return !!userAgent && ROBOTS.test(userAgent);
}

const CROM = 'https://api.crom.avn.sh/graphql';

/** Au-delà, le robot qui attend l'aperçu abandonne souvent lui-même. */
const DELAI_CROM = 2500;

interface NoeudAttribution {
  type: string;
  user?: { name?: string } | null;
}

interface PageCrom {
  alternateTitles?: { title: string }[] | null;
  attributions?: NoeudAttribution[] | null;
  translationOf?: { attributions?: NoeudAttribution[] | null } | null;
  wikidotInfo?: { title?: string } | null;
}

interface InfosDossier {
  nom: string;
  auteurs: string[];
}

/**
 * Titre et auteurs d'un dossier, en une requête.
 *
 * Les auteurs sont ceux de l'ORIGINAL sur une traduction : c'est l'œuvre qu'on
 * annonce, et la licence (CC BY-SA 3.0) demande de nommer qui l'a écrite. Même
 * logique que `CreditsDossier`, en plus court — trois noms au plus.
 */
async function infosDossier(slug: string, baseUrl: string): Promise<InfosDossier | null> {
  const requete = `
    query Apercu($url: URL!) {
      page(url: $url) {
        alternateTitles { title }
        attributions { type user { name } }
        translationOf { attributions { type user { name } } }
        wikidotInfo { title }
      }
    }
  `;

  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), DELAI_CROM);
  try {
    const reponse = await fetch(CROM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'SCP-Audio-Roleplay/1.0' },
      // Crom indexe les pages en `http://` : voir `cromApi.ts`.
      body: JSON.stringify({ query: requete, variables: { url: `${baseUrl}/${slug}` } }),
      signal: controleur.signal
    });
    if (!reponse.ok) return null;

    const donnees = (await reponse.json()) as { data?: { page?: PageCrom | null } };
    const page = donnees.data?.page;
    if (!page?.wikidotInfo) return null;

    const titreWiki = page.wikidotInfo.title?.trim() || undefined;
    const numero = slug.startsWith('scp-') ? slug.toUpperCase() : titreWiki || slug;
    const nom = titreDossier(numero, titreWiki, page.alternateTitles?.[0]?.title);

    const noms = (liste: NoeudAttribution[] | null | undefined, type: string) =>
      (liste ?? []).filter(a => a.type === type).map(a => a.user?.name).filter((n): n is string => !!n);
    const source = page.translationOf?.attributions?.length ? page.translationOf.attributions : page.attributions;
    const auteurs = [...new Set(noms(source, 'AUTHOR').length ? noms(source, 'AUTHOR') : noms(source, 'SUBMITTER'))];

    return { nom, auteurs };
  } catch {
    return null;
  } finally {
    clearTimeout(minuterie);
  }
}

/** Les quatre caractères qui comptent dans un attribut entre guillemets doubles. */
function echapper(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface EnTete {
  langue: string;
  locale: string;
  titre: string;
  description: string;
  adresse: string;
}

/** Les balises que l'aperçu remplace. `og:locale:alternate` n'en fait pas partie. */
const BALISES_REMPLACEES =
  /<meta\b[^>]*\b(?:name|property)="(?:description|og:title|og:description|og:locale|og:url|twitter:title|twitter:description)"[^>]*>\s*/g;

/**
 * Récrit l'en-tête de `index.html`. Les balises visées sont retirées puis réécrites
 * en bloc avant `</head>` : ne dépend ni de leur ordre, ni de leur mise en forme
 * sur une ou plusieurs lignes.
 */
export function injecterEnTete(html: string, entete: EnTete): string {
  const bloc = [
    `<meta name="description" content="${echapper(entete.description)}" />`,
    `<meta property="og:title" content="${echapper(entete.titre)}" />`,
    `<meta property="og:description" content="${echapper(entete.description)}" />`,
    `<meta property="og:locale" content="${echapper(entete.locale)}" />`,
    `<meta property="og:url" content="${echapper(entete.adresse)}" />`,
    `<meta name="twitter:title" content="${echapper(entete.titre)}" />`,
    `<meta name="twitter:description" content="${echapper(entete.description)}" />`,
    `<link rel="canonical" href="${echapper(entete.adresse)}" />`
  ].join('\n    ');

  // Remplacements par fonction : une chaîne de remplacement interpréterait les `$`
  // d'un titre de dossier (`$&`, `$1`…) au lieu de les recopier.
  return html
    .replace(/<html\b([^>]*?)\blang="[^"]*"/, (_, avant: string) => `<html${avant}lang="${echapper(entete.langue)}"`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${echapper(entete.titre)}</title>`)
    .replace(BALISES_REMPLACEES, '')
    .replace(/<link\b[^>]*\brel="canonical"[^>]*>\s*/g, '')
    .replace('</head>', () => `    ${bloc}\n  </head>`);
}

/**
 * La page `html` avec l'aperçu du lien `adresse`, ou `null` s'il n'y a rien à
 * récrire : ni dossier ni langue dans l'adresse, ou une adresse qui ne désigne
 * rien de connu.
 */
export async function pageAvecApercu(adresse: URL, html: string): Promise<string | null> {
  const brut = (adresse.searchParams.get('scp') ?? '').trim().toLowerCase();
  const slug = SLUG_VALIDE.test(brut) ? brut : null;

  const code = (adresse.searchParams.get('lang') ?? '').trim().toLowerCase();
  const demandee = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === code);
  if (!slug && !demandee) return null;

  const langue = demandee ?? LANGUE_PAR_DEFAUT;
  const textes = DICTIONNAIRES[langue.code] ?? EN;
  const locale = langue.locale.replace('-', '_');

  if (!slug) {
    return injecterEnTete(html, {
      langue: langue.code,
      locale,
      titre: textes['site.titre'],
      description: textes['site.description'],
      adresse: adresseCanonique(null, langue.code)
    });
  }

  const infos = await infosDossier(slug, langue.baseUrl);
  if (!infos) return null;

  // `split`/`join` et non `replace` : un `$` dans un pseudonyme serait lu comme un
  // motif de remplacement.
  const auteurs = infos.auteurs.length > 3 ? `${infos.auteurs.slice(0, 3).join(', ')}…` : infos.auteurs.join(', ');
  const credit = infos.auteurs.length ? ' ' + textes['site.dossierTexte'].split('{auteurs}').join(auteurs) : '';

  return injecterEnTete(html, {
    langue: langue.code,
    locale,
    titre: `${infos.nom} · ${NOM_SITE}`,
    description: `${textes['site.dossierDescription']}${credit}`,
    adresse: adresseCanonique(slug, langue.code)
  });
}
