import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { handleTtsRequest } from './server/ttsHandler';
import { URL_SITE, adresseCanonique } from './src/services/adresseSite';
import { SUPPORTED_LANGUAGES, LANGUE_PAR_DEFAUT } from './src/types/scp';
import { EN } from './src/i18n/en';

/**
 * `/api/tts` en développement.
 *
 * Toute la logique vit dans `server/ttsHandler.ts`, partagée avec le serveur autonome
 * (`npm run serve`) et avec la fonction serverless `api/tts.ts` : c'est ce qui garantit que
 * la version buildée se comporte comme le mode développement. Auparavant ce plugin lançait
 * `python -m edge_tts` et n'existait que dans Vite, ce qui rendait le TTS neural absent de
 * tout ce qui n'était pas `npm run dev`.
 */
function ttsPlugin(): Plugin {
  return {
    name: 'tts-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', handleTtsRequest);
    }
  };
}

/** Échappe une valeur pour un attribut HTML ou un nœud XML. */
function echapper(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Ce que les robots lisent : balises d'aperçu, `robots.txt`, `sitemap.xml`, et la mesure
 * d'audience.
 *
 * `index.html` porte des jetons (`__URL_SITE__`, `__TITRE_SITE__`…) plutôt que des valeurs :
 * l'adresse vient de `adresseSite.ts` et les textes du dictionnaire anglais, qui sont aussi
 * ce que lisent le middleware des aperçus et l'application. Écrits en dur dans le HTML, ils
 * divergeraient au premier changement de domaine ou de formulation.
 *
 * Le plan du site n'est émis que pour un déploiement à la racine : sur le miroir Pages
 * (`VITE_BASE`), il serait servi sous le nom du dépôt, où aucun robot ne le cherche.
 */
function sitePlugin(base: string): Plugin {
  const liensLangues = SUPPORTED_LANGUAGES.map(
    l => `<a href="./?lang=${l.code}" hreflang="${l.code}" lang="${l.code}">${echapper(l.nativeName)}</a>`
  ).join(' · ');

  return {
    name: 'site-public',
    transformIndexHtml(html, ctx) {
      const page = html
        .split('__URL_SITE__').join(URL_SITE)
        .split('__TITRE_SITE__').join(echapper(EN['site.titre']))
        .split('__DESCRIPTION_SITE__').join(echapper(EN['site.description']))
        .split('__LIENS_LANGUES__').join(liensLangues);

      // Vercel Web Analytics : sans cookie, donc sans bandeau de consentement, et seule
      // façon de savoir quel canal amène des visiteurs (GitHub ne compte que le dépôt).
      // Uniquement dans un build fait par Vercel : ailleurs — miroir Pages, application
      // Android, `npm run serve` — le script n'existe pas et ne ferait qu'une erreur 404.
      // Il faut aussi activer « Analytics » dans le tableau de bord du projet.
      if (ctx.server || process.env.VERCEL !== '1') return page;
      return {
        html: page,
        tags: [{ tag: 'script', attrs: { defer: true, src: '/_vercel/insights/script.js' }, injectTo: 'body' }]
      };
    },
    generateBundle() {
      if (base !== '/') return;

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: [
          '# Tout est public, sauf le relais de synthèse : chaque appel y coûte une requête',
          '# au service de voix, et une page rendue par un robot n\'a rien à y écouter.',
          'User-agent: *',
          'Disallow: /api/',
          '',
          `Sitemap: ${URL_SITE}/sitemap.xml`,
          ''
        ].join('\n')
      });

      // L'accueil de chaque branche, avec ses équivalents dans les autres langues
      // (`hreflang`), puis le catalogue de démarrage de chaque branche : ce sont les
      // dossiers qu'un lecteur de cette langue cherche le plus.
      const alternatives = [
        ...SUPPORTED_LANGUAGES.map(l => ({ langue: l.code, adresse: adresseCanonique(null, l.code) })),
        { langue: 'x-default', adresse: adresseCanonique(null, LANGUE_PAR_DEFAUT.code) }
      ]
        .map(a => `    <xhtml:link rel="alternate" hreflang="${a.langue}" href="${echapper(a.adresse)}"/>`)
        .join('\n');

      const entrees: string[] = SUPPORTED_LANGUAGES.map(
        l => `  <url>\n    <loc>${echapper(adresseCanonique(null, l.code))}</loc>\n${alternatives}\n  </url>`
      );
      const vues = new Set<string>();
      for (const langue of SUPPORTED_LANGUAGES) {
        const chemin = path.resolve(`src/data/catalogue.${langue.code}.json`);
        if (!fs.existsSync(chemin)) continue;
        const catalogue = JSON.parse(fs.readFileSync(chemin, 'utf8')) as { slug?: string }[];
        for (const { slug } of catalogue) {
          if (!slug) continue;
          const adresse = adresseCanonique(slug, langue.code);
          if (vues.has(adresse)) continue;
          vues.add(adresse);
          entrees.push(`  <url><loc>${echapper(adresse)}</loc></url>`);
        }
      }

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          ...entrees,
          '</urlset>',
          ''
        ].join('\n')
      });
    }
  };
}

/**
 * Chemin de base du site.
 *
 * Vaut « / » partout sauf sur le miroir GitHub Pages, servi sous `/<dépôt>/` : le workflow
 * `.github/workflows/pages.yml` y pose `VITE_BASE`. Les chemins absolus du HTML (favicon,
 * manifeste, entrée JS) suivent automatiquement. L'appel `/api/tts`, lui, ne doit PAS suivre :
 * il pointe soit sur la racine du domaine (Vercel), soit sur une URL complète donnée par
 * `VITE_TTS_ENDPOINT` — voir `speechEngine.buildNeuralAudioUrl()`.
 */
const base = process.env.VITE_BASE ?? '/';

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react(), ttsPlugin(), sitePlugin(base)],
  server: {
    port: 5173,
    host: true
  },
  build: {
    // Le paquet d'entrée ne doit porter que l'aiguilleur : les deux vues sont en `lazy`
    // (`src/App.tsx`). Ce découpage-ci sépare en plus ce qui ne change jamais (React, les
    // bibliothèques) de ce qui change à chaque commit, pour que le cache du navigateur
    // survive aux mises à jour.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('scheduler')) return 'react';
            if (id.includes('@tanstack')) return 'tanstack';
            if (id.includes('lucide-react')) return 'icones';
            return 'vendor';
          }
          // 69 Ko de SVG en ligne, inutiles tant qu'aucune carte n'est affichée.
          if (id.includes('ScpIllustrations')) return 'illustrations';
          return undefined;
        }
      }
    },
    chunkSizeWarningLimit: 900
  }
});
