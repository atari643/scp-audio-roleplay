import { CharacterRole, PlayerStatus, SpeechSegment, VoiceProfile } from '../types/audioRoleplay';
import { DEFAULT_AI_ROLES_EN, DEFAULT_AI_ROLES_FR, NEURAL_VOICES_BY_LANG } from '../types/neuralVoices';
import { sfx } from './sfxService';
import {
  acronymPattern,
  censoredSpokenWord,
  glossaryFor,
  hasSpeakableContent,
  normalizeForSpeech
} from './speechText';
import { stageEffectFor } from './speechLexicon';
import { audioCache } from './audioCache';
import { canSynthesizeDirectly, synthesize, WordBoundary } from './edgeTts';
import { buildCues, SpokenCue, wordIndexAt } from './wordAlignment';
import { storageService } from './storageService';

type SegmentCallback = (index: number, segment: SpeechSegment) => void;
type WordCallback = (segmentIndex: number, wordIndex: number) => void;
type StatusCallback = (status: PlayerStatus) => void;

export type TtsEngineMode = 'neural' | 'system';

/** Un caviardage repéré dans l'audio synthétisé, en secondes. */
interface CensorSpan {
  start: number;
  end: number;
}

/**
 * Ce qu'on garde en cache pour un texte donné : l'audio, et les frontières de mots quand le
 * service les a fournies. Les frontières servent à deux choses — placer le bip de censure
 * à l'endroit exact, et suivre la lecture mot à mot à l'écran.
 */
interface CachedAudio {
  url: string;
  boundaries: WordBoundary[];
}

/** Sortie brute d'une synthèse, avant qu'on en fasse une URL et une entrée de cache. */
interface SynthesizedAudio {
  bytes: Uint8Array;
  boundaries: WordBoundary[];
}

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private segments: SpeechSegment[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private globalSpeed: number = 1.0;
  private languageCode: string = 'fr';
  private engineMode: TtsEngineMode = 'neural';
  private voiceProfiles: Record<CharacterRole, VoiceProfile>;
  private aiVoiceAssignments: Record<CharacterRole, string>;
  private availableSystemVoices: SpeechSynthesisVoice[] = [];
  private lastSpeaker: string = '';
  private volume: number = 1.0;
  private isMuted: boolean = false;
  private previousVolume: number = 1.0;
  private currentTime: number = 0;
  private duration: number = 0;

  // Performance & Reactivity: In-memory Audio Blob Cache & Prefetch Pipeline
  private blobCache: Map<string, CachedAudio> = new Map();
  private inFlightFetches: Map<string, Promise<CachedAudio>> = new Map();

  /** Blob URLs are never garbage-collected on their own — cap the cache and revoke evictions. */
  private static readonly MAX_CACHED_BLOBS = 120;
  /** Consecutive TTS failures before we stop hammering a dead endpoint. */
  private static readonly NEURAL_FAILURE_LIMIT = 3;
  private neuralFailureStreak: number = 0;
  private neuralUnavailable: boolean = false;

  /**
   * Incremented on every play/stop/jump. Async audio callbacks compare against it so a
   * segment the user already navigated away from can't resume playback or trigger a
   * second, overlapping voice.
   */
  private playToken: number = 0;
  /** Last time we pushed a status update, to keep `ontimeupdate` from flooding React. */
  private lastStatusEmit: number = 0;

  /**
   * Silence entre deux segments, en millisecondes.
   *
   * edge-tts n'accepte aucun SSML : impossible de demander une pause au moteur. Le seul
   * levier interne au texte est la ponctuation, et il est faible — passer d'une virgule à
   * un point n'achète que 0,36 s, mesuré. Une vraie respiration ne peut donc venir que d'ici,
   * entre deux éléments audio.
   *
   * Sans ce délai, `onended` enchaînait immédiatement : un titre de section, un changement
   * d'interlocuteur et une phrase de corps se collaient, et les bruitages de transition
   * (intercom, friture radio) se superposaient aux premiers mots au lieu de les précéder.
   */
  private static readonly PAUSES = {
    /** Même locuteur, suite du récit : juste de quoi ne pas coller les phrases. */
    suite: 120,
    /** Quelqu'un d'autre prend la parole. */
    locuteur: 350,
    /** Autour d'un titre de section : c'est ce qui rend la structure du dossier audible. */
    titre: 500,
    /** Ouverture ou fermeture de journal — le bruitage d'intercom a besoin de la place. */
    journal: 600,
    /** Une note de bas de page s'insère dans le corps ; il faut l'en détacher. */
    note: 300
  };

  /**
   * Caviardages du segment en cours.
   *
   * `sfx.playCensorBeep()` existait sans appelant utile : le bip partait une fois, au début
   * du segment, alors que le caviardage tombe au milieu d'une phrase neuf fois sur dix.
   *
   * La première version découpait le segment en morceaux séparés par un bip, ce qui plaçait
   * bien le bip mais donnait à chaque morceau une intonation de fin de phrase. Les
   * frontières de mots renvoyées par le service permettent mieux : on synthétise la phrase
   * ENTIÈRE, d'un seul tenant et avec sa prosodie intacte, puis on coupe le son sur les
   * seuls mots « donnée expurgée » en jouant le bip par-dessus. C'est la convention des
   * lectures SCP, et la phrase ne se casse plus.
   */
  private censorSpans: CensorSpan[] = [];
  /** Minuteries qui coupent et rétablissent le son autour d'un caviardage. */
  private censorTimers: ReturnType<typeof setTimeout>[] = [];
  /** Vrai pendant un caviardage : le son est coupé volontairement, ne pas le rétablir. */
  private censorMuted: boolean = false;

  /** Durée du bip de censure, en secondes. */
  private static readonly BEEP_DURATION = 0.16;

  /** Attente en cours avant le segment suivant. Annulée par pause/stop/saut. */
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Segment que la pause de transition va lancer. Mémorisé pour qu'une mise en pause
   * PENDANT le silence reprenne sur le segment suivant, et non sur celui qui vient de finir.
   */
  private pendingNextIndex: number | null = null;

  /**
   * Suivi de lecture mot à mot.
   *
   * Les frontières de mots sont dans le repère du texte PRONONCÉ, qui n'est pas celui du
   * texte affiché : `buildCues` fait la correspondance une fois par segment.
   *
   * Le suivi passe par son propre rappel et une boucle d'animation, pas par `emitStatus` :
   * un mot dure environ trois dixièmes de seconde, la mise à jour d'état est bridée à
   * 250 ms et redessine tout l'arbre du lecteur. On n'émet donc que lorsque le mot CHANGE,
   * et seul le texte de la réplique se redessine.
   */
  /**
   * Sigles à développer, par segment : `id du segment → sigles`.
   *
   * Rempli une fois par dossier dans `setScript`. Le faire au fil de la lecture rendrait le
   * résultat dépendant de l'ordre des appels — le préchargement synthétise trois segments
   * d'avance — et la clé de cache changerait d'une écoute à l'autre.
   */
  private glossaryFirstMentions: Map<number, Set<string>> = new Map();

  /**
   * Segment id → annonce orale du locuteur (« L'Œil qui Voit : »), à insérer dans le texte
   * PRONONCÉ du premier segment de chaque prise de parole. Deux voix différentes ne disent
   * pas qui elles sont : à l'écran le badge du locuteur suffit, à l'oreille il n'existe pas.
   *
   * Rempli une fois par dossier dans `setScript`, même raison que pour
   * `glossaryFirstMentions` : le préchargement synthétise trois segments d'avance et
   * appelle `speechTextFor` hors du flux de lecture — une annonce calculée à la volée y
   * serait fondée sur un locuteur périmé et rendrait la clé de cache instable.
   */
  private annoncesLocuteur: Map<number, string> = new Map();

  private cues: SpokenCue[] = [];
  private currentWordIndex: number = -1;
  private wordRaf: number | null = null;
  private onWordChangeCb: WordCallback | null = null;

  private onSegmentStartCb: SegmentCallback | null = null;
  private onSegmentEndCb: SegmentCallback | null = null;
  private onStatusChangeCb: StatusCallback | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadSystemVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadSystemVoices();
      }
    }
    this.voiceProfiles = storageService.getVoiceProfiles();
    this.aiVoiceAssignments = { ...DEFAULT_AI_ROLES_FR };
  }

  private loadSystemVoices(): void {
    if (!this.synth) return;
    this.availableSystemVoices = this.synth.getVoices();
  }

  public getEngineMode(): TtsEngineMode {
    return this.engineMode;
  }

  public setEngineMode(mode: TtsEngineMode): void {
    if (mode === 'neural') {
      // An explicit user choice clears an earlier automatic downgrade.
      this.neuralFailureStreak = 0;
      this.neuralUnavailable = false;
    }
    this.engineMode = mode;
  }

  public getAvailableSystemVoices(langPrefix?: string): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (!langPrefix) return this.availableSystemVoices;
    const prefix = langPrefix.toLowerCase().split('-')[0];
    return this.availableSystemVoices.filter(v => v.lang.toLowerCase().startsWith(prefix));
  }

  public setLanguage(langCode: string): void {
    this.languageCode = langCode;
    if (langCode === 'en') {
      this.aiVoiceAssignments = { ...DEFAULT_AI_ROLES_EN };
    } else if (langCode === 'fr') {
      this.aiVoiceAssignments = { ...DEFAULT_AI_ROLES_FR };
    } else {
      const voices = NEURAL_VOICES_BY_LANG[langCode];
      if (voices && voices.length > 0) {
        const defaultVoice = voices[0].id;
        const assigned: Record<string, string> = {};
        const roles: CharacterRole[] = ['narrator', 'researcher', 'anomaly', 'classD', 'agent', 'commander', 'intercom'];
        roles.forEach((r, idx) => {
          assigned[r] = voices[idx % voices.length].id || defaultVoice;
        });
        this.aiVoiceAssignments = assigned as Record<CharacterRole, string>;
      }
    }
  }

  public getAiVoiceAssignments(): Record<CharacterRole, string> {
    return this.aiVoiceAssignments;
  }

  public setAiVoiceAssignment(role: CharacterRole, voiceId: string): void {
    this.aiVoiceAssignments[role] = voiceId;
  }

  public getVoiceProfiles(): Record<CharacterRole, VoiceProfile> {
    return this.voiceProfiles;
  }

  public updateVoiceProfile(role: CharacterRole, updates: Partial<VoiceProfile>): void {
    this.voiceProfiles[role] = { ...this.voiceProfiles[role], ...updates };
    storageService.saveVoiceProfiles(this.voiceProfiles);
  }

  public setScript(segments: SpeechSegment[], title: string = 'SCP Dossier'): void {
    this.stop();
    this.segments = segments;
    this.buildGlossaryFirstMentions();
    this.buildAnnoncesLocuteur();
    this.currentIndex = 0;
    this.lastSpeaker = '';
    this.updateMediaSession(title);
    this.emitStatus();

    // High Reactivity: Immediately prefetch first 3 segments so play starts in 0ms!
    if (this.engineMode === 'neural') {
      this.prefetchUpcoming(0, 3);
    }
  }

  /**
   * Précalcule, par segment, l'annonce orale d'un changement de locuteur.
   *
   * Le premier segment de chaque prise de parole d'un personnage reçoit « Nom : » — les
   * suivants du même locuteur non. Narrateur et intercom sont exclus : l'Archiviste se
   * présente assez, et annoncer chaque paragraphe « Archiviste : » noierait le dossier.
   * Les segments structurels (en-têtes, bornes de journal, notes) aussi : ils ont leur
   * propre traitement ou leur badge.
   */
  private buildAnnoncesLocuteur(): void {
    this.annoncesLocuteur = new Map();
    let dernierLocuteur = '';
    for (const segment of this.segments) {
      if (segment.isHeader || segment.isLogMarker || segment.isFootnote) continue;
      if (segment.role === 'narrator' || segment.role === 'intercom') continue;
      if (!segment.speaker) continue;
      if (segment.speaker !== dernierLocuteur) {
        const deuxPoints = this.languageCode === 'en' ? ':' : ' :';
        this.annoncesLocuteur.set(segment.id, `${segment.speaker}${deuxPoints}`);
        dernierLocuteur = segment.speaker;
      }
    }
  }

  /**
   * Repère, pour chaque sigle du glossaire, le segment où il apparaît en premier.
   *
   * Parcours dans l'ordre de lecture : le premier segment qui contient le sigle le
   * développera, tous les autres le laisseront abrégé.
   */
  private buildGlossaryFirstMentions(): void {
    this.glossaryFirstMentions = new Map();
    const glossaire = glossaryFor(this.languageCode);
    const restants = new Set(Object.keys(glossaire));

    for (const segment of this.segments) {
      if (restants.size === 0) break;
      for (const sigle of restants) {
        if (!acronymPattern(sigle).test(segment.text)) continue;
        const deja = this.glossaryFirstMentions.get(segment.id);
        if (deja) deja.add(sigle);
        else this.glossaryFirstMentions.set(segment.id, new Set([sigle]));
        restants.delete(sigle);
      }
    }
  }

  public onSegmentStart(cb: SegmentCallback): void {
    this.onSegmentStartCb = cb;
  }

  /** Prévenu à chaque changement de mot prononcé. `wordIndex` vaut -1 hors lecture. */
  public onWordChange(cb: WordCallback): void {
    this.onWordChangeCb = cb;
  }

  /** Suit la position de lecture image par image et signale les changements de mot. */
  private startWordTracking(audio: HTMLAudioElement, index: number, token: number): void {
    this.stopWordTracking();
    if (this.cues.length === 0 || typeof requestAnimationFrame === 'undefined') return;

    const boucle = () => {
      if (token !== this.playToken || audio.paused) {
        this.wordRaf = null;
        return;
      }
      const mot = wordIndexAt(this.cues, audio.currentTime || 0);
      if (mot !== this.currentWordIndex) {
        this.currentWordIndex = mot;
        if (this.onWordChangeCb) this.onWordChangeCb(index, mot);
      }
      this.wordRaf = requestAnimationFrame(boucle);
    };
    this.wordRaf = requestAnimationFrame(boucle);
  }

  private stopWordTracking(resetWord: boolean = false): void {
    if (this.wordRaf !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.wordRaf);
    }
    this.wordRaf = null;
    if (resetWord && this.currentWordIndex !== -1) {
      this.currentWordIndex = -1;
      if (this.onWordChangeCb) this.onWordChangeCb(this.currentIndex, -1);
    }
  }

  public onSegmentEnd(cb: SegmentCallback): void {
    this.onSegmentEndCb = cb;
  }

  public onStatusChange(cb: StatusCallback): void {
    this.onStatusChangeCb = cb;
    // Push the current state straight away. Without this, any status emitted before the
    // subscriber attached (the script is parsed and `setScript` runs in an effect that
    // fires *before* the one registering this callback) is lost, leaving the UI with
    // totalSegments = 0 — which is exactly the condition AudioPlayer hides itself on.
    this.emitStatus();
  }

  public setGlobalSpeed(speed: number): void {
    this.globalSpeed = Math.max(0.7, Math.min(2.0, speed));
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.globalSpeed;
    }
    this.emitStatus();
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.volume > 0) {
      this.isMuted = false;
      this.previousVolume = this.volume;
    } else {
      this.isMuted = true;
    }
    if (this.currentAudio) {
      this.currentAudio.volume = this.isMuted ? 0 : this.volume;
    }
    this.emitStatus();
  }

  public toggleMute(): void {
    if (this.isMuted) {
      this.isMuted = false;
      this.volume = this.previousVolume > 0 ? this.previousVolume : 1.0;
    } else {
      this.previousVolume = this.volume;
      this.isMuted = true;
    }
    // Pendant un caviardage le son est coupé volontairement : le rétablir ici laisserait
    // entendre les mots que le bip est censé couvrir.
    if (this.currentAudio && !this.censorMuted) {
      this.currentAudio.volume = this.isMuted ? 0 : this.volume;
    }
    this.emitStatus();
  }

  public seekTime(seconds: number): void {
    if (isNaN(seconds) || !this.currentAudio) return;
    const target = Math.max(0, Math.min(this.duration || 600, seconds));
    this.currentAudio.currentTime = target;
    this.currentTime = target;
    // Les minuteries de censure sont relatives à la position de lecture : après un saut,
    // elles ne veulent plus rien dire et doivent être refaites.
    this.scheduleCensorBeeps(this.currentAudio, this.playToken);
    this.emitStatus();
  }

  public seekPercent(fraction: number): void {
    if (!this.currentAudio || !this.duration) return;
    const target = Math.max(0, Math.min(1, fraction)) * this.duration;
    this.seekTime(target);
  }

  public play(): void {
    if (this.segments.length === 0) return;

    // Reprise pendant le silence de transition : le segment courant est celui qui vient de
    // se terminer, le reprendre le rejouerait en entier. On repart sur le suivant.
    if (this.isPaused && this.pendingNextIndex !== null) {
      const resumeIndex = this.pendingNextIndex;
      this.pendingNextIndex = null;
      this.isPaused = false;
      this.isPlaying = true;
      this.playSegment(resumeIndex);
      return;
    }

    if (this.isPaused) {
      if (this.engineMode === 'neural') {
        if (this.currentAudio) {
          this.currentAudio.play().catch(() => {});
          this.isPaused = false;
          this.isPlaying = true;
          this.emitStatus();
          return;
        }
        // Neural mode with no live element — the user jumped to a segment while paused.
        // Resuming speechSynthesis here (as the old order did) resumed an empty queue and
        // played nothing at all; replay the selected segment instead.
        this.isPaused = false;
        this.isPlaying = true;
        this.playSegment(this.currentIndex);
        return;
      } else if (this.synth) {
        this.synth.resume();
        this.isPaused = false;
        this.isPlaying = true;
        this.emitStatus();
        return;
      }
      // If paused without an active audio element (e.g. jumped while paused)
      this.isPaused = false;
      this.isPlaying = true;
      this.playSegment(this.currentIndex);
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.playSegment(this.currentIndex);
  }

  /**
   * Combien de silence avant `next` ?
   *
   * On regarde les deux segments : le titre qu'on quitte compte autant que celui qu'on
   * aborde, sinon une section s'ouvrirait sans respiration après son propre intitulé.
   */
  private pauseBefore(prev: SpeechSegment | null, next: SpeechSegment): number {
    const P = SpeechEngine.PAUSES;
    // « (Pause) », « (soupir) », « (rit) » : l'auteur demande explicitement du temps. On
    // l'ajoute à la transition plutôt que de le remplacer, sinon un « (Pause) » entre deux
    // interlocuteurs raccourcirait le silence au lieu de l'allonger.
    const didascalie = stageEffectFor(next.stageDirections).pause ?? 0;
    if (!prev) return didascalie;
    if (prev.isLogMarker || next.isLogMarker) return P.journal + didascalie;
    if (prev.isHeader || next.isHeader) return P.titre + didascalie;
    if (next.isFootnote || prev.isFootnote) return P.note + didascalie;
    if (prev.speaker !== next.speaker) return P.locuteur + didascalie;
    return P.suite + didascalie;
  }

  /**
   * Annule une transition en attente. À appeler partout où la lecture change de cap.
   *
   * Le silence entre deux parties d'un même segment (autour d'un bip) est annulé avec, pour
   * la même raison : sans ça, une pause pendant un bip laisse la phrase reprendre seule.
   */
  private clearTransition(keepPending: boolean = false): void {
    if (this.transitionTimer !== null) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    this.clearCensorTimers();
    if (!keepPending) this.pendingNextIndex = null;
  }

  /** Annule les coupures de son programmées pour les caviardages du segment en cours. */
  private clearCensorTimers(): void {
    for (const t of this.censorTimers) clearTimeout(t);
    this.censorTimers = [];
    if (this.censorMuted) {
      this.censorMuted = false;
      if (this.currentAudio) this.currentAudio.volume = this.isMuted ? 0 : this.volume;
    }
  }

  /**
   * Enchaîne sur le segment suivant après le silence qui convient à la transition.
   *
   * `playToken` est revérifié au déclenchement : entre-temps l'utilisateur a pu sauter
   * ailleurs, et le timer serait alors devenu une seconde voix qui démarre par-dessus.
   */
  private scheduleNext(finishedIndex: number, token: number): void {
    const nextIndex = finishedIndex + 1;
    if (nextIndex >= this.segments.length) {
      this.stop();
      return;
    }

    const delay = this.pauseBefore(this.segments[finishedIndex] ?? null, this.segments[nextIndex]);
    this.clearTransition();
    this.pendingNextIndex = nextIndex;
    this.transitionTimer = setTimeout(() => {
      this.transitionTimer = null;
      this.pendingNextIndex = null;
      if (token !== this.playToken) return;
      if (!this.isPlaying || this.isPaused) return;
      this.playSegment(nextIndex);
    }, delay);
  }

  public pause(): void {
    // Une pause pendant le silence de transition doit garder en mémoire le segment visé,
    // sinon la reprise rejouerait celui qui vient de se terminer.
    this.clearTransition(true);
    this.stopWordTracking();
    sfx.duckAmbience(false);
    if (this.engineMode === 'neural' && this.currentAudio) {
      this.currentAudio.pause();
    } else if (this.synth) {
      this.synth.pause();
    }
    this.isPaused = true;
    this.isPlaying = false;
    this.emitStatus();
  }

  public stop(): void {
    // Invalidate any in-flight segment so its callbacks become no-ops.
    this.playToken++;
    this.clearTransition();
    this.stopWordTracking(true);
    sfx.duckAmbience(false);
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.currentTime = 0;
    this.duration = 0;
    this.emitStatus();
  }

  public jumpToSegment(index: number): void {
    if (index < 0 || index >= this.segments.length) return;
    // Invalidate the segment being left so its callbacks can't advance playback.
    this.playToken++;
    this.clearTransition();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentIndex = index;
    this.currentTime = 0;
    this.duration = 0;

    if (this.isPlaying) {
      this.playSegment(index);
    } else {
      this.emitStatus();
      if (this.onSegmentStartCb && this.segments[index]) {
        this.onSegmentStartCb(index, this.segments[index]);
      }
      // Preload next audio when user navigates
      this.prefetchUpcoming(index, 2);
    }
  }

  public next(): void {
    if (this.currentIndex < this.segments.length - 1) {
      this.jumpToSegment(this.currentIndex + 1);
    }
  }

  public previous(): void {
    if (this.currentIndex > 0) {
      this.jumpToSegment(this.currentIndex - 1);
    }
  }

  // Generate a unique cache key for a segment configuration
  /**
   * Resolve the voice, pitch and rate baked into the *generated* audio for a segment.
   *
   * IMPORTANT: `globalSpeed` is deliberately NOT part of this. Playback speed is applied
   * at play time via `HTMLAudioElement.playbackRate`, which is instant and needs no
   * refetch. Baking it in here too would (a) apply the speed twice and (b) make the
   * blob cache key disagree with the URL, so a cached clip would keep playing at the
   * old speed forever.
   */
  /**
   * Un pourcentage au format attendu par edge-tts (« +10% », « -8% »).
   */
  private static toPercent(ratio: number): string {
    const pct = Math.round((ratio - 1) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  }

  /**
   * Le wiki écrit ses avertissements en capitales.
   *
   * `softenUppercaseRun` les remet en casse de phrase avant la synthèse — nécessaire, sinon
   * le repli navigateur épelle — mais ce faisant il efface l'intention. Le cri redevient une
   * phrase ordinaire. On la récupère ici, où elle s'exprime en volume et en débit plutôt
   * qu'en typographie. La détection se fait sur `segment.text`, l'original, pas sur le texte
   * normalisé qui n'a justement plus de capitales.
   */
  private static isShouted(segment: SpeechSegment): boolean {
    const lettres = segment.text.replace(/[^\p{L}]/gu, '');
    if (lettres.length < 12) return false;
    const capitales = segment.text.replace(/[^\p{Lu}]/gu, '');
    return capitales.length / lettres.length >= 0.9;
  }

  private resolveVoiceParams(segment: SpeechSegment): {
    voice: string;
    pitch: string;
    rate: string;
    volume: string;
  } {
    const profile = this.voiceProfiles[segment.role] || this.voiceProfiles.narrator;

    const voice =
      segment.voiceSignature?.voiceId ||
      this.aiVoiceAssignments[segment.role] ||
      (this.languageCode === 'en' ? 'en-US-AndrewMultilingualNeural' : 'fr-FR-RemyMultilingualNeural');

    let pitch = segment.voiceSignature?.pitch;
    if (!pitch) {
      pitch = '+0Hz';
      if (segment.role === 'anomaly') {
        pitch = '-18Hz'; // deep, unsettling unnatural timbre
      } else if (segment.role === 'classD') {
        pitch = '+10Hz'; // stressed, agitated
      } else if (segment.role === 'agent') {
        pitch = '-5Hz'; // disciplined tactical
      } else if (profile.pitch < 0.9) {
        pitch = '-15Hz';
      } else if (profile.pitch > 1.1) {
        pitch = '+15Hz';
      }
    }

    let rate = segment.voiceSignature?.rate;
    if (!rate) {
      rate = '+0%';
      let calculatedRate = profile.rate;
      if (segment.role === 'classD') calculatedRate *= 1.08; // slightly hurried
      else if (segment.role === 'anomaly') calculatedRate *= 0.92; // ominous lingering delivery

      // Un titre de section lu au débit du corps ne s'entend pas comme un titre. Avec la
      // pause qui l'entoure (PAUSES.titre), c'est ce qui rend la structure du dossier
      // audible — jusqu'ici `isHeader` n'était consommé nulle part dans le moteur.
      if (segment.isHeader) calculatedRate *= 0.92;
      else if (SpeechEngine.isShouted(segment)) calculatedRate *= 0.95;

      if (calculatedRate !== 1.0) {
        rate = SpeechEngine.toPercent(calculatedRate);
      }
    }

    // Didascalies : « (lentement) », « (murmure) », « (crie) ». Appliquées PAR-DESSUS le
    // débit du rôle, y compris quand le personnage a sa propre signature vocale — une
    // indication de jeu vaut pour ce passage-là, pas pour le personnage en général.
    const didascalie = stageEffectFor(segment.stageDirections);
    if (didascalie.rate) {
      const actuel = parseInt(rate, 10);
      rate = SpeechEngine.toPercent((1 + (isNaN(actuel) ? 0 : actuel) / 100) * didascalie.rate);
    }

    // edge-tts accepte --volume, que le middleware ne transmettait pas : un levier de
    // prosodie disponible et inutilisé. Il sert ici au seul cas mesurable, l'avertissement
    // en capitales, dont l'insistance disparaissait à la normalisation.
    const volume = didascalie.volume ?? (SpeechEngine.isShouted(segment) ? '+12%' : '+0%');

    return { voice, pitch, rate, volume };
  }

  /**
   * Le texte réellement prononcé. Distinct de `segment.text`, qui reste ce qui est AFFICHÉ :
   * les crochets, les capitales de style et les marqueurs « (s) » se lisent mal à voix haute.
   */
  private speechTextFor(segment: SpeechSegment): string {
    const normalized = normalizeForSpeech(segment.text, this.languageCode, {
      expandAcronyms: this.glossaryFirstMentions.get(segment.id)
    });
    // La normalisation peut réduire un segment à de la ponctuation (« ... » → « … »,
    // « — » → « , »). edge-tts refuse ce genre d'entrée avec NoAudioReceived, donc on
    // revient au texte d'origine dès qu'il ne reste plus rien de prononçable.
    const spoken = hasSpeakableContent(normalized) ? normalized : segment.text;

    // Une note de bas de page est annoncée à voix haute. Sans ça, elle s'enchaîne au
    // paragraphe précédent et on ne distingue plus l'annotation du corps du dossier —
    // à l'écran le badge du locuteur suffit, à l'oreille il n'existe pas.
    if (segment.isFootnote) {
      const prefix = this.languageCode === 'en' ? 'Note:' : 'Note :';
      // Ne pas doubler l'annonce si le texte de la note commence déjà par « Note ».
      if (!/^\s*(?:note|footnote)\b/i.test(spoken)) {
        return `${prefix} ${spoken}`;
      }
    }

    // Annonce du locuteur au changement de prise de parole — précalculée dans setScript,
    // jamais ici : le préchargement appelle cette fonction avec un contexte périmé.
    const annonce = this.annoncesLocuteur.get(segment.id);
    if (annonce && !spoken.startsWith(annonce)) {
      return `${annonce} ${spoken}`;
    }

    return spoken;
  }

  /** Y a-t-il quelque chose à prononcer ? Un segment sans lettre ni chiffre n'a pas d'audio. */
  private isSpeakable(segment: SpeechSegment): boolean {
    return hasSpeakableContent(this.speechTextFor(segment));
  }

  /**
   * Repère les caviardages dans l'audio à partir des frontières de mots.
   *
   * `normalizeForSpeech` a déjà remplacé « ██ » par une formule fixe (« donnée expurgée ») ;
   * il suffit donc de retrouver cette suite de mots dans les frontières. Le balayage est
   * séquentiel, et les caviardages consécutifs sont fusionnés : « ██ ██ ██ » ne doit donner
   * qu'un seul bip, trois à la suite sonneraient comme un défaut.
   */
  private censorSpansFrom(boundaries: WordBoundary[]): CensorSpan[] {
    const simplifier = (mot: string) =>
      mot
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^\p{L}\p{N}]/gu, '');

    const attendus = censoredSpokenWord(this.languageCode).split(/\s+/).map(simplifier);
    const spans: CensorSpan[] = [];

    for (let i = 0; i < boundaries.length; i++) {
      let k = 0;
      while (
        k < attendus.length &&
        i + k < boundaries.length &&
        simplifier(boundaries[i + k].text) === attendus[k]
      ) {
        k++;
      }
      if (k !== attendus.length) continue;

      const debut = boundaries[i].offset;
      const fin = boundaries[i + k - 1].offset + boundaries[i + k - 1].duration;
      const precedent = spans[spans.length - 1];
      // Fusion des caviardages qui se suivent de près.
      if (precedent && debut - precedent.end < 0.35) precedent.end = fin;
      else spans.push({ start: debut, end: fin });
      i += k - 1;
    }

    return spans;
  }

  /**
   * Programme la coupure du son et le bip pour chaque caviardage.
   *
   * Appelée au démarrage ET à la reprise (l'événement `play` couvre les deux), ainsi qu'après
   * un déplacement du curseur : les minuteries sont relatives à la position courante, donc
   * elles doivent être refaites dès que cette position saute.
   */
  private scheduleCensorBeeps(audio: HTMLAudioElement, token: number): void {
    this.clearCensorTimers();
    if (this.censorSpans.length === 0) return;

    const depuis = audio.currentTime || 0;
    for (const span of this.censorSpans) {
      if (span.end <= depuis) continue;

      const versDebut = (Math.max(span.start, depuis) - depuis) / this.globalSpeed;
      const versFin = (span.end - depuis) / this.globalSpeed;

      this.censorTimers.push(
        setTimeout(() => {
          if (token !== this.playToken) return;
          this.censorMuted = true;
          audio.volume = 0;
          sfx.playCensorBeep(Math.min(0.6, (span.end - span.start) / this.globalSpeed));
        }, versDebut * 1000)
      );
      this.censorTimers.push(
        setTimeout(() => {
          if (token !== this.playToken) return;
          this.censorMuted = false;
          audio.volume = this.isMuted ? 0 : this.volume;
        }, versFin * 1000)
      );
    }
  }

  private getCacheKey(segment: SpeechSegment, text: string = this.speechTextFor(segment)): string {
    const { voice, pitch, rate, volume } = this.resolveVoiceParams(segment);
    return `${voice}_${pitch}_${rate}_${volume}_${text}`;
  }

  // Construct query URL for TTS backend
  private buildNeuralAudioUrl(segment: SpeechSegment, text: string = this.speechTextFor(segment)): string {
    const { voice, pitch, rate, volume } = this.resolveVoiceParams(segment);

    const params = new URLSearchParams({
      text,
      voice,
      rate,
      pitch,
      volume
    });

    return `/api/tts?${params.toString()}`;
  }

  // Pre-fetch an audio segment and store its blob URL in memory
  /**
   * @param countFailure  Ne compter l'échec dans le compteur de bascule que pour une vraie
   *   lecture. Le préchargement lance jusqu'à trois requêtes d'un coup dès l'ouverture du
   *   dossier ; un `edge-tts` qui démarre à froid en fait échouer une ou deux, ce qui
   *   suffisait à désactiver les voix neurales AVANT même le premier appui sur lecture.
   */
  private async fetchAudio(
    segment: SpeechSegment,
    countFailure: boolean = true,
    text: string = this.speechTextFor(segment)
  ): Promise<CachedAudio> {
    const key = this.getCacheKey(segment, text);

    if (this.blobCache.has(key)) {
      return this.blobCache.get(key)!;
    }
    if (this.inFlightFetches.has(key)) {
      return this.inFlightFetches.get(key)!;
    }

    const fetchPromise = (async () => {
      try {
        // Le cache persistant vient avant toute synthèse : un segment déjà entendu, même
        // lors d'une session précédente, ne repart pas sur le réseau.
        const stocke = await audioCache.get(key);
        if (stocke) {
          const entry: CachedAudio = {
            url: URL.createObjectURL(new Blob([stocke.audio], { type: 'audio/mpeg' })),
            boundaries: stocke.boundaries
          };
          this.rememberBlob(key, entry);
          return entry;
        }

        const { bytes, boundaries } = canSynthesizeDirectly()
          ? await this.synthesizeDirect(segment, text)
          : await this.synthesizeViaEndpoint(segment, text);

        this.neuralFailureStreak = 0;
        const entry: CachedAudio = {
          url: URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'audio/mpeg' })),
          boundaries
        };
        this.rememberBlob(key, entry);
        // Écriture au mieux : une base pleine ou indisponible ne doit pas gêner la lecture.
        void audioCache.put(key, bytes.buffer.slice(0) as ArrayBuffer, boundaries);
        return entry;
      } catch (err) {
        if (countFailure) this.neuralFailureStreak++;
        if (
          countFailure &&
          this.neuralFailureStreak >= SpeechEngine.NEURAL_FAILURE_LIMIT &&
          this.engineMode === 'neural'
        ) {
          // Reste possible sans réseau, ou si le service de Microsoft change ses règles.
          // Plutôt que d'échouer à chaque segment, on bascule une fois et on le dit à l'UI.
          console.warn('[speechEngine] Voix neurales injoignables — bascule sur les voix système.');
          this.engineMode = 'system';
          this.neuralUnavailable = true;
          this.emitStatus();
        }
        throw err instanceof Error ? err : new Error(String(err));
      } finally {
        this.inFlightFetches.delete(key);
      }
    })();

    this.inFlightFetches.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Synthèse en direct, sans serveur.
   *
   * Possible dès que le contexte se présente comme Edge — c'est-à-dire dans l'APK Android,
   * dont `capacitor.config.ts` force l'User-Agent de la WebView. Le service refuse les
   * autres navigateurs, qui passent alors par `/api/tts`.
   */
  private async synthesizeDirect(segment: SpeechSegment, text: string): Promise<SynthesizedAudio> {
    const { voice, pitch, rate, volume } = this.resolveVoiceParams(segment);
    const { audio, boundaries } = await synthesize({
      text,
      voice,
      pitch,
      rate,
      volume,
      wordBoundaries: true
    });
    return { bytes: audio, boundaries };
  }

  /** Synthèse via `/api/tts`, servi par Vite en développement et par `npm run serve` sinon. */
  private async synthesizeViaEndpoint(segment: SpeechSegment, text: string): Promise<SynthesizedAudio> {
    const res = await fetch(`${this.buildNeuralAudioUrl(segment, text)}&boundaries=1`);
    if (!res.ok) throw new Error(`TTS HTTP error: ${res.status}`);

    const type = res.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      const data = (await res.json()) as { audio: string; boundaries: WordBoundary[] };
      const binaire = atob(data.audio);
      const octets = new Uint8Array(binaire.length);
      for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
      if (octets.length === 0) throw new Error('TTS returned an empty payload');
      return { bytes: octets, boundaries: data.boundaries || [] };
    }

    // Repli : un point d'accès plus ancien qui ne renvoie que le MP3.
    const blob = await res.blob();
    if (blob.size === 0 || (blob.type && !blob.type.startsWith('audio'))) {
      throw new Error(`TTS returned non-audio content (${blob.type || 'unknown'})`);
    }
    return { bytes: new Uint8Array(await blob.arrayBuffer()), boundaries: [] };
  }

  private rememberBlob(key: string, entry: CachedAudio): void {
    this.blobCache.set(key, entry);
    while (this.blobCache.size > SpeechEngine.MAX_CACHED_BLOBS) {
      const oldestKey = this.blobCache.keys().next().value;
      if (oldestKey === undefined) break;
      const stale = this.blobCache.get(oldestKey);
      if (stale) URL.revokeObjectURL(stale.url);
      this.blobCache.delete(oldestKey);
    }
  }

  /**
   * Vide le cache persistant. Réservé à une action explicite de l'utilisateur : le cache
   * mémoire se vide en quittant un dossier, celui-ci a justement vocation à survivre.
   */
  public async purgeStoredAudio(): Promise<void> {
    await audioCache.clear();
  }

  /** Taille du cache persistant, pour l'afficher dans les réglages. */
  public getStoredAudioSize(): Promise<{ entries: number; bytes: number }> {
    return audioCache.size();
  }

  /** Release every cached blob URL. Call when leaving a dossier. */
  public clearAudioCache(): void {
    for (const entry of this.blobCache.values()) {
      URL.revokeObjectURL(entry.url);
    }
    this.blobCache.clear();
  }

  public isNeuralUnavailable(): boolean {
    return this.neuralUnavailable;
  }

  // Pre-buffer upcoming segments in background
  private prefetchUpcoming(startIndex: number, count: number = 3): void {
    if (this.engineMode !== 'neural' || this.neuralUnavailable) return;
    for (let i = 1; i <= count; i++) {
      const idx = startIndex + i;
      if (idx < this.segments.length) {
        const seg = this.segments[idx];
        // Best-effort : ni rejet non capturé, ni comptage dans la bascule vers les voix système.
        this.fetchAudio(seg, false).catch(() => {});
      }
    }
  }

  private async playSegment(index: number): Promise<void> {
    if (index >= this.segments.length) {
      this.stop();
      return;
    }

    // Stop currently running audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }

    // Un segment sans rien de prononçable (ponctuation seule, symboles decoratifs) ferait
    // echouer le moteur : on l'annonce comme joue et on passe au suivant.
    if (!this.isSpeakable(this.segments[index])) {
      this.currentIndex = index;
      this.emitStatus();
      if (this.isPlaying && !this.isPaused && index + 1 < this.segments.length) {
        this.playSegment(index + 1);
      } else if (index + 1 >= this.segments.length) {
        this.stop();
      }
      return;
    }

    const token = ++this.playToken;
    // Une transition programmée par le segment précédent n'a plus lieu d'être : c'est
    // celui-ci qu'on joue maintenant.
    this.clearTransition();
    this.stopWordTracking(true);
    this.censorSpans = [];
    this.cues = [];

    this.currentIndex = index;
    this.currentTime = 0;
    this.duration = 0;
    this.emitStatus();
    const segment = this.segments[index];

    // SFX Triggers for Immersion
    if (segment.isLogMarker) {
      sfx.playIntercom();
    } else if (this.lastSpeaker && this.lastSpeaker !== segment.speaker) {
      // Radio static when switching to tactical agents or intercom
      if (segment.role === 'agent' || segment.role === 'intercom') {
        sfx.playRadioStatic(0.1);
      } else {
        sfx.playRadioStatic(0.04);
      }
    }

    // Le bip de censure n'est pas déclenché ici : il est programmé à l'instant exact du
    // caviardage à partir des frontières de mots, voir scheduleCensorBeeps().

    // Ce passage renvoie ailleurs dans le wiki : un signal court, jamais un mot ajouté.
    // La narration doit rester identique que les liens soient résolus ou non.
    if (segment.links && segment.links.length > 0) {
      sfx.playSynapticPulse(620);
    }

    this.lastSpeaker = segment.speaker;

    // 1. NEURAL AI MODE (Ultra-fast cached playback)
    if (this.engineMode === 'neural') {
      try {
        // Retrieve blob from memory cache or fetch immediately
        const { url: audioSrc, boundaries } = await this.fetchAudio(segment);

        // If the user changed segment while the fetch was in flight, abort.
        if (token !== this.playToken) return;

        // Caviardages et repères de suivi sont calculés une fois par segment, avant
        // lecture : les frontières de mots servent aux deux.
        this.censorSpans = boundaries.length ? this.censorSpansFrom(boundaries) : [];
        this.cues = boundaries.length ? buildCues(boundaries, segment.text) : [];
        this.currentWordIndex = -1;

        const audio = new Audio(audioSrc);
        // Playback speed lives here and only here — it is never baked into the
        // generated audio (see resolveVoiceParams).
        audio.playbackRate = this.globalSpeed;
        audio.volume = this.isMuted ? 0 : this.volume;
        this.currentAudio = audio;

        audio.onloadedmetadata = () => {
          if (token !== this.playToken) return;
          this.duration = audio.duration || 0;
          this.emitStatus();
        };

        audio.ontimeupdate = () => {
          if (token !== this.playToken) return;
          this.currentTime = audio.currentTime || 0;
          if (!this.duration && audio.duration) {
            this.duration = audio.duration;
          }
          // `timeupdate` fires ~4x/second; emitting every time re-renders the whole
          // player tree. Throttle to ~4 fps worth of real change.
          this.emitStatus({ throttle: true });
        };

        audio.onplay = () => {
          if (token !== this.playToken) return;
          this.isPlaying = true;
          this.isPaused = false;
          // `play` couvre le démarrage ET la reprise après pause : c'est le bon endroit
          // pour (re)programmer les coupures, qui sont relatives à la position courante.
          this.scheduleCensorBeeps(audio, token);
          this.startWordTracking(audio, index, token);
          // L'ambiance recule sous la voix et revient dans les silences de transition.
          sfx.duckAmbience(true);
          this.emitStatus();
          if (this.onSegmentStartCb) {
            this.onSegmentStartCb(index, segment);
          }
          // Preload next 3 segments in background for zero latency
          this.prefetchUpcoming(index, 3);
        };

        audio.onended = () => {
          if (token !== this.playToken) return;
          this.stopWordTracking(true);
          sfx.duckAmbience(false);
          this.currentTime = this.duration;
          this.emitStatus();
          if (this.onSegmentEndCb) {
            this.onSegmentEndCb(index, segment);
          }
          if (this.isPlaying && !this.isPaused) {
            this.scheduleNext(index, token);
          }
        };

        audio.onerror = (e) => {
          // A stale element erroring after the user moved on must not start a second voice.
          if (token !== this.playToken) return;
          console.warn('Neural audio playback failed, falling back to Web Speech API:', e);
          this.fallbackSystemSpeech(index, segment, token);
        };

        await audio.play();
      } catch (err) {
        if (token !== this.playToken) return;
        console.warn('Audio play error, falling back:', err);
        this.fallbackSystemSpeech(index, segment, token);
      }
      return;
    }

    // 2. SYSTEM FALLBACK MODE
    this.fallbackSystemSpeech(index, segment, token);
  }

  private fallbackSystemSpeech(index: number, segment: SpeechSegment, token: number = this.playToken): void {
    if (!this.synth) return;
    if (token !== this.playToken) return;

    const utterance = new SpeechSynthesisUtterance(this.speechTextFor(segment));
    const profile = this.voiceProfiles[segment.role] || this.voiceProfiles.narrator;

    if (profile.voiceURI) {
      const targetVoice = this.availableSystemVoices.find(v => v.voiceURI === profile.voiceURI);
      if (targetVoice) utterance.voice = targetVoice;
    }

    utterance.pitch = Math.max(0.5, Math.min(2.0, profile.pitch));
    utterance.rate = Math.max(0.5, Math.min(2.5, profile.rate * this.globalSpeed));
    utterance.volume = profile.volume;
    utterance.lang = this.languageCode;

    utterance.onstart = () => {
      if (token !== this.playToken) return;
      this.isPlaying = true;
      this.isPaused = false;
      sfx.duckAmbience(true);
      this.emitStatus();
      if (this.onSegmentStartCb) this.onSegmentStartCb(index, segment);
    };

    utterance.onend = () => {
      if (token !== this.playToken) return;
      sfx.duckAmbience(false);
      if (this.onSegmentEndCb) this.onSegmentEndCb(index, segment);
      if (this.isPlaying && !this.isPaused) {
        this.scheduleNext(index, token);
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  private updateMediaSession(title: string): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: 'Fondation SCP - Archive Audio Roleplay',
      album: 'Dossiers Classifiés',
      artwork: [
        { src: '/favicon.svg', sizes: '96x96', type: 'image/svg+xml' },
        { src: '/favicon.svg', sizes: '256x256', type: 'image/svg+xml' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => this.play());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
  }

  private emitStatus(options?: { throttle?: boolean }): void {
    if (!this.onStatusChangeCb) return;

    if (options?.throttle) {
      const now = Date.now();
      if (now - this.lastStatusEmit < 250) return;
      this.lastStatusEmit = now;
    } else {
      this.lastStatusEmit = Date.now();
    }

    const currentSegment = this.segments[this.currentIndex];
    this.onStatusChangeCb({
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentSegmentIndex: this.currentIndex,
      totalSegments: this.segments.length,
      currentSpeaker: currentSegment ? currentSegment.speaker : 'Narrateur',
      currentRole: currentSegment ? currentSegment.role : 'narrator',
      globalSpeed: this.globalSpeed,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isMuted: this.isMuted
    });
  }

  public async previewVoice(role: CharacterRole, textSample: string): Promise<void> {
    if (this.engineMode === 'neural') {
      try {
        const dummySegment: SpeechSegment = {
          id: 0,
          speaker: 'Preview',
          role,
          text: textSample,
          rawText: textSample
        };
        const { url: audioSrc } = await this.fetchAudio(dummySegment);
        const audio = new Audio(audioSrc);
        audio.play().catch(() => {});
      } catch (err) {
        console.warn('Voice preview error:', err);
      }
    } else if (this.synth) {
      this.synth.cancel();
      const profile = this.voiceProfiles[role] || this.voiceProfiles.narrator;
      const utterance = new SpeechSynthesisUtterance(textSample);
      utterance.pitch = profile.pitch;
      utterance.rate = profile.rate;
      utterance.lang = this.languageCode;
      this.synth.speak(utterance);
    }
  }
}

export const speechEngine = new SpeechEngine();
