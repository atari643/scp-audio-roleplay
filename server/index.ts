/**
 * Serveur autonome : sert `dist/` et `/api/tts`.
 *
 * C'est ce qui manquait pour que l'application existe ailleurs qu'en `npm run dev`.
 * `vite preview` ne connaît pas le middleware TTS, donc la version buildée retombait sur la
 * voix du navigateur — tout le travail sur les voix, la prononciation et les pauses était
 * invisible dès qu'on quittait le mode développement.
 *
 *   npm run build && npm run serve
 *
 * Aucune dépendance : `node:http` pour le service, et le WebSocket intégré de Node pour
 * joindre le service de synthèse.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleTtsRequest } from './ttsHandler';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4173;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  if (url.pathname === '/api/tts') {
    await handleTtsRequest(req, res);
    return;
  }

  // Résolution du fichier statique. `path.normalize` puis vérification du préfixe : sans
  // ça, « /../.. » sortirait de `dist/`.
  const demande = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)));
  const cible = demande.startsWith(DIST) && fs.existsSync(demande) && fs.statSync(demande).isFile()
    ? demande
    : path.join(DIST, 'index.html'); // l'application est une SPA : tout le reste retombe ici

  try {
    const contenu = fs.readFileSync(cible);
    res.setHeader('Content-Type', TYPES[path.extname(cible)] || 'application/octet-stream');
    res.end(contenu);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  if (!fs.existsSync(DIST)) {
    console.warn(`dist/ est absent — lance « npm run build » d'abord.`);
  }
  console.log(`SCP Audio sur http://localhost:${PORT}  (TTS neural actif, sans Python)`);
});
