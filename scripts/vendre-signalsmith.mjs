/**
 * Régénère `src/vendor/signalsmith-stretch/fabrique.js` depuis le paquet npm officiel.
 *
 *   node scripts/vendre-signalsmith.mjs
 *
 * Signalsmith Stretch (licence MIT) est le moteur qui change la « personne » d'une voix —
 * hauteur et formants — pour faire jouer plusieurs personnages à Rémy et Vivienne (voir
 * `src/services/timbres.ts`). Le paquet npm ne publie qu'un nœud AudioWorklet : pratique pour
 * de la lecture en direct, inutilisable pour traiter un fichier, et absent de Node. Il contient
 * pourtant la fabrique WASM complète (WASM inclus en base64, aucune dépendance) ; ce script
 * l'en extrait, pour traiter l'audio d'une réplique d'un bloc, dans le navigateur comme sous
 * Node.
 *
 * Pourquoi une copie plutôt qu'une dépendance : on ne garde qu'une partie du fichier, et
 * cette découpe n'a pas sa place au milieu d'un build. La version est épinglée ici.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '1.3.2';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DESTINATION = path.join(ICI, '..', 'src', 'vendor', 'signalsmith-stretch');
const MARQUE = 'SignalsmithStretch = ((Module, audioNodeKey)';

const travail = fs.mkdtempSync(path.join(os.tmpdir(), 'signalsmith-'));
const archive = path.join(travail, 'paquet.tgz');
const reponse = await fetch(`https://registry.npmjs.org/signalsmith-stretch/-/signalsmith-stretch-${VERSION}.tgz`);
if (!reponse.ok) throw new Error(`Téléchargement impossible : HTTP ${reponse.status}`);
fs.writeFileSync(archive, Buffer.from(await reponse.arrayBuffer()));
// Chemins relatifs : le tar de Git Bash prend « C: » pour un hôte distant.
execFileSync('tar', ['xzf', path.basename(archive)], { cwd: travail });

const source = fs.readFileSync(path.join(travail, 'package', 'SignalsmithStretch.mjs'), 'utf8');
const coupe = source.indexOf(MARQUE);
if (coupe < 0) throw new Error('Structure du paquet inattendue : la fabrique WASM est introuvable.');

fs.mkdirSync(DESTINATION, { recursive: true });
fs.writeFileSync(
  path.join(DESTINATION, 'fabrique.js'),
  `/* Signalsmith Stretch ${VERSION} — fabrique WASM extraite du paquet npm « signalsmith-stretch ».
 * Copyright (c) 2022 Geraint Luff / Signalsmith Audio Ltd. — licence MIT (LICENSE.txt).
 * Fichier GÉNÉRÉ par scripts/vendre-signalsmith.mjs : ne pas modifier à la main. */
/* eslint-disable */
// @ts-nocheck
${source.slice(0, coupe)}
export default SignalsmithStretch;
`
);
fs.rmSync(travail, { recursive: true, force: true });
console.log(`fabrique.js écrit (${VERSION}) dans ${path.relative(process.cwd(), DESTINATION)}`);
