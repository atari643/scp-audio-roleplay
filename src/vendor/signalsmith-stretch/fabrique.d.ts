/**
 * Types de la fabrique WASM de Signalsmith Stretch (fichier généré `fabrique.js`).
 *
 * Seules les fonctions dont `src/services/timbres.ts` se sert sont décrites. Les tailles et
 * positions sont en échantillons ; les fréquences, normalisées par la fréquence
 * d'échantillonnage (comme le fait le nœud AudioWorklet du paquet).
 */
export interface ModuleSignalsmith {
  _presetDefault(canaux: number, frequence: number): void;
  _inputLatency(): number;
  _outputLatency(): number;
  /** Alloue les tampons d'entrée puis de sortie, et renvoie l'adresse du premier. */
  _setBuffers(canaux: number, longueur: number): number;
  _setTransposeSemitones(demiTons: number, tonaliteNormalisee: number): void;
  _setFormantSemitones(demiTons: number, compenser: number | boolean): void;
  _setFormantBase(frequenceNormalisee: number): void;
  _process(echantillonsEntree: number, echantillonsSortie: number): void;
  HEAPF32?: Float32Array;
  HEAP8: Int8Array;
}

declare const fabrique: (options?: Record<string, unknown>) => Promise<ModuleSignalsmith>;
export default fabrique;
