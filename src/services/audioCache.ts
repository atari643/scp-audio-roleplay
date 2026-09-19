/**
 * Cache audio persistant, sur IndexedDB.
 *
 * `speechEngine` gardait ses blobs en mémoire, plafonnés à 120 et perdus au rechargement :
 * revenir sur un dossier la veille écouté resynthétisait tout, segment par segment. Or la
 * clé de cache (`voix_hauteur_débit_volume_texte`) est parfaitement stable d'une session à
 * l'autre — il n'y avait qu'à l'écrire quelque part.
 *
 * Trois gains : la reprise est instantanée, l'écoute reste possible sans réseau une fois le
 * dossier parcouru, et on cesse d'appeler Microsoft pour un audio déjà obtenu.
 *
 * `localStorage` ne convenait pas : il est synchrone, plafonné à quelques mégaoctets, et ne
 * stocke que du texte. IndexedDB accepte des binaires et de la place. La convention de
 * nommage versionnée du projet est conservée (`storageService`) : changer la forme des
 * données impose d'incrémenter le suffixe, l'ancienne base étant alors simplement ignorée.
 *
 * Tout est « au mieux » : navigation privée, quota atteint, base corrompue — chaque échec
 * est avalé et la synthèse reprend son cours normal. Un cache n'a jamais le droit de casser
 * la lecture.
 */

import type { WordBoundary } from './edgeTts';

const DB_NAME = 'scp_audio_cache_v1';
const STORE = 'segments';

/** Au-delà, on évince les entrées les plus anciennement utilisées. */
const MAX_BYTES = 150 * 1024 * 1024;
/** Marge d'éviction : on descend nettement sous le plafond pour ne pas évincer à chaque écriture. */
const TARGET_BYTES = 120 * 1024 * 1024;

interface StoredAudio {
  key: string;
  audio: ArrayBuffer;
  boundaries: WordBoundary[];
  bytes: number;
  lastUsed: number;
}

export interface CachedSegmentAudio {
  audio: ArrayBuffer;
  boundaries: WordBoundary[];
}

class AudioCache {
  private db: IDBDatabase | null = null;
  private opening: Promise<IDBDatabase | null> | null = null;
  private unavailable = false;
  /** Octets écrits depuis la dernière éviction, pour ne pas recompter la base à chaque fois. */
  private writtenSinceSweep = 0;

  private open(): Promise<IDBDatabase | null> {
    if (this.db) return Promise.resolve(this.db);
    if (this.unavailable) return Promise.resolve(null);
    if (this.opening) return this.opening;

    this.opening = new Promise<IDBDatabase | null>(resolve => {
      if (typeof indexedDB === 'undefined') {
        this.unavailable = true;
        resolve(null);
        return;
      }
      let request: IDBOpenDBRequest;
      try {
        request = indexedDB.open(DB_NAME, 1);
      } catch {
        this.unavailable = true;
        resolve(null);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'key' });
          store.createIndex('lastUsed', 'lastUsed');
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onerror = () => {
        this.unavailable = true;
        resolve(null);
      };
      // Navigation privée : la demande peut rester bloquée sans jamais répondre.
      request.onblocked = () => resolve(null);
    });

    return this.opening;
  }

  async get(key: string): Promise<CachedSegmentAudio | null> {
    const db = await this.open();
    if (!db) return null;

    return new Promise<CachedSegmentAudio | null>(resolve => {
      try {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const req = store.get(key);
        req.onsuccess = () => {
          const row = req.result as StoredAudio | undefined;
          if (!row) {
            resolve(null);
            return;
          }
          // La date de dernier usage sert à l'éviction : on la rafraîchit à la lecture.
          store.put({ ...row, lastUsed: Date.now() });
          resolve({ audio: row.audio, boundaries: row.boundaries || [] });
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async put(key: string, audio: ArrayBuffer, boundaries: WordBoundary[]): Promise<void> {
    const db = await this.open();
    if (!db) return;

    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({
        key,
        audio,
        boundaries,
        bytes: audio.byteLength,
        lastUsed: Date.now()
      } satisfies StoredAudio);
      this.writtenSinceSweep += audio.byteLength;
    } catch {
      return;
    }

    // Balayage amorti : inutile de mesurer la base à chaque segment.
    if (this.writtenSinceSweep > 8 * 1024 * 1024) {
      this.writtenSinceSweep = 0;
      void this.sweep();
    }
  }

  /** Évince les entrées les plus anciennement utilisées jusqu'à repasser sous la cible. */
  private async sweep(): Promise<void> {
    const db = await this.open();
    if (!db) return;

    try {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const total = await new Promise<number>(resolve => {
        let somme = 0;
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) {
            resolve(somme);
            return;
          }
          somme += (cursor.value as StoredAudio).bytes || 0;
          cursor.continue();
        };
        req.onerror = () => resolve(0);
      });

      if (total <= MAX_BYTES) return;

      let restant = total;
      const parDate = store.index('lastUsed').openCursor();
      parDate.onsuccess = () => {
        const cursor = parDate.result;
        if (!cursor || restant <= TARGET_BYTES) return;
        restant -= (cursor.value as StoredAudio).bytes || 0;
        cursor.delete();
        cursor.continue();
      };
    } catch {
      /* le cache reste simplement plus gros que prévu */
    }
  }

  /** Vide entièrement le cache persistant. Réservé à une action explicite de l'utilisateur. */
  async clear(): Promise<void> {
    const db = await this.open();
    if (!db) return;
    try {
      db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
    } catch {
      /* rien à faire */
    }
  }

  /** Taille approximative du cache, pour l'afficher dans les réglages. */
  async size(): Promise<{ entries: number; bytes: number }> {
    const db = await this.open();
    if (!db) return { entries: 0, bytes: 0 };

    return new Promise(resolve => {
      try {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
        let entries = 0;
        let bytes = 0;
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) {
            resolve({ entries, bytes });
            return;
          }
          entries++;
          bytes += (cursor.value as StoredAudio).bytes || 0;
          cursor.continue();
        };
        req.onerror = () => resolve({ entries, bytes });
      } catch {
        resolve({ entries: 0, bytes: 0 });
      }
    });
  }
}

export const audioCache = new AudioCache();
