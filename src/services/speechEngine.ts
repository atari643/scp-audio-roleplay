import { CharacterRole, PlayerStatus, SpeechSegment, VoiceProfile } from '../types/audioRoleplay';
import { DEFAULT_AI_ROLES_EN } from '../types/neuralVoices';
import { nomDuLocuteur, t } from '../i18n';
import { sfx } from './sfxService';
import { hasSpeakableContent } from './speechText';
import {
  assignationsParDefaut,
  ContexteLecture,
  parametresVoix,
  ParametresVoix,
  pauseAvant,
  PlageCensure,
  plagesCensure,
  preparerContexte,
  texteDit
} from './preparationLecture';
import { audioCache } from './audioCache';
import {
  chargerMoteurTimbre,
  composerAnnonce,
  Distribution,
  distribuerPersonnes,
  encoderWav,
  personneDe,
  transformerTimbre
} from './timbres';
import { canSynthesizeDirectly, synthesize, WordBoundary } from './edgeTts';
import { buildCues, SpokenCue, wordIndexAt } from './wordAlignment';
import { storageService } from './storageService';
import { NOM_SITE } from './adresseSite';

type SegmentCallback = (index: number, segment: SpeechSegment) => void;
type WordCallback = (segmentIndex: number, wordIndex: number) => void;
type StatusCallback = (status: PlayerStatus) => void;

export type TtsEngineMode = 'neural' | 'system';

/**
 * Où joindre le point d'accès de synthèse.
 *
 * « /api/tts » sur les hébergements qui servent la fonction avec le site (développement,
 * `npm run serve`, Vercel). Le miroir GitHub Pages, lui, est purement statique : sans URL
 * complète pointant sur la fonction déployée ailleurs, Chrome et Firefox retomberaient sur
 * `speechSynthesis` et perdraient les voix neurales. D'où cette variable, posée à la
 * compilation par le workflow Pages. Edge et la WebView Android ne passent de toute façon
 * pas par ici : `canSynthesizeDirectly()` leur fait joindre le service en direct.
 */
const POINT_ACCES_TTS = import.meta.env.VITE_TTS_ENDPOINT || '/api/tts';

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
  private languageCode: string = 'en';
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
  private censorSpans: PlageCensure[] = [];
  /** Minuteries qui coupent et rétablissent le son autour d'un caviardage. */
  private censorTimers: ReturnType<typeof setTimeout>[] = [];
  /** Vrai pendant un caviardage : le son est coupé volontairement, ne pas le rétablir. */
  private censorMuted: boolean = false;

  /** Durée du bip de censure, en secondes. */
  private static readonly BEEP_DURATION = 0.16;

  /**
   * L'unique élément <audio> de la lecture, dont on change la source à chaque segment.
   *
   * Écran éteint, un téléphone ne laisse vivre une page que tant qu'elle JOUE : un nouvel
   * élément par segment, lancé hors d'un geste de l'utilisateur, est refusé (iOS), et la
   * minuterie du silence entre deux segments était ralentie puis gelée en arrière-plan — la
   * lecture s'arrêtait au premier changement de réplique. Un seul élément, déverrouillé par
   * le premier appui sur lecture, qui enchaîne répliques ET silences sans jamais se taire :
   * c'est ce qui permet d'écouter un dossier comme un podcast, téléphone en poche.
   */
  private lecteur: HTMLAudioElement | null = null;
  /** Silences WAV prêts à jouer, par durée arrondie à 50 ms. */
  private silences = new Map<number, string>();
  /** Titre du dossier, pour l'écran de verrouillage. */
  private titreDossier = '';

  /** Attente en cours avant le segment suivant (voix système seulement). Annulée par pause/stop/saut. */
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
   * Annonces de locuteur et sigles à développer, par segment.
   *
   * Rempli une fois par dossier dans `setScript` (voir `ContexteLecture`). Le faire au fil
   * de la lecture rendrait le résultat dépendant de l'ordre des appels — le préchargement
   * synthétise trois segments d'avance — et la clé de cache changerait d'une écoute à
   * l'autre.
   */
  private contexteLecture: ContexteLecture = { annonces: new Map(), premieresMentions: new Map() };
  /** Qui joue quel personnage (Rémy ou Vivienne transformés) : voir `distribuerPersonnes`. */
  private distributionPersonnes: Distribution = new Map();

  private cues: SpokenCue[] = [];
  private currentWordIndex: number = -1;
  private wordRaf: number | null = null;
  private onWordChangeCb: WordCallback | null = null;

  private onSegmentStartCb: SegmentCallback | null = null;
  private onSegmentEndCb: SegmentCallback | null = null;
  private onStatusChangeCb: StatusCallback | null = null;

  constructor() {
    // Les profils AVANT les voix système : `loadSystemVoices` les répartit entre les rôles.
    // Quand le navigateur a déjà sa liste de voix au chargement (Edge, deuxième visite), il
    // les lisait encore vides et le singleton plantait à sa construction.
    this.voiceProfiles = storageService.getVoiceProfiles();
    this.aiVoiceAssignments = { ...DEFAULT_AI_ROLES_EN };
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadSystemVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadSystemVoices();
      }
    }
  }

  private loadSystemVoices(): void {
    if (!this.synth) return;
    this.availableSystemVoices = this.synth.getVoices();
    this.repartirVoixSysteme();
  }

  /**
   * Donne une voix différente à chaque rôle quand on tombe sur le moteur du navigateur.
   *
   * Sans ça, `fallbackSystemSpeech()` n'assignait AUCUNE voix : `voiceURI` vaut `''` dans
   * les profils par défaut, le navigateur prenait donc sa voix unique, et les sept rôles
   * sortaient de la même bouche à la hauteur près. C'est ce qu'entendent les visiteurs du
   * miroir statique, où le relais de synthèse n'existe pas.
   *
   * Deux précautions : on ne touche qu'aux profils encore vides — un choix explicite fait
   * dans le studio vocal doit primer — et on ne persiste rien, le catalogue de voix
   * dépendant de la machine et du navigateur.
   */
  private repartirVoixSysteme(): void {
    const candidates = this.classerVoixSysteme();
    if (candidates.length === 0) return;

    // Ordre fixe : le narrateur, le plus entendu, prend la meilleure voix. Les rôles
    // suivants se partagent le reste, et on reboucle s'il y en a moins que de rôles.
    const ordre: CharacterRole[] = [
      'narrator',
      'researcher',
      'anomaly',
      'classD',
      'agent',
      'commander',
      'intercom'
    ];

    ordre.forEach((role, rang) => {
      const profil = this.voiceProfiles[role];
      if (!profil || profil.voiceURI) return;
      this.voiceProfiles[role] = {
        ...profil,
        voiceURI: candidates[rang % candidates.length].voiceURI
      };
    });
  }

  /**
   * Classe les voix installées de la langue courante, de la plus convaincante à la moins.
   *
   * Le critère est le nom, faute de mieux : l'API du navigateur ne dit rien de la qualité
   * d'une voix. « Natural » et « Neural » désignent les voix modernes de Windows et
   * d'Android ; une voix distante (`localService === false`) est en général une voix de
   * serveur, meilleure que la synthèse locale ; eSpeak, à l'inverse, est le timbre
   * métallique qu'on veut éviter tant qu'il existe autre chose.
   */
  private classerVoixSysteme(): SpeechSynthesisVoice[] {
    const prefixe = this.languageCode.toLowerCase().split('-')[0];
    const note = (voix: SpeechSynthesisVoice): number => {
      const nom = voix.name.toLowerCase();
      if (nom.includes('espeak')) return -10;
      let points = 0;
      if (nom.includes('natural') || nom.includes('neural')) points += 6;
      if (!voix.localService) points += 3;
      if (nom.includes('google')) points += 2;
      if (nom.includes('microsoft')) points += 1;
      // Une voix de la locale exacte passe devant une simple correspondance de langue.
      if (voix.lang.toLowerCase() === this.languageCode.toLowerCase()) points += 1;
      return points;
    };

    return this.availableSystemVoices
      .filter(v => v.lang.toLowerCase().startsWith(prefixe))
      .map(v => ({ v, n: note(v) }))
      .filter(x => x.n > -10)
      .sort((a, b) => b.n - a.n || a.v.name.localeCompare(b.v.name))
      .map(x => x.v);
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
    // Sans voix neurale pour la branche, on garde les assignations en place.
    const assignations = assignationsParDefaut(langCode);
    if (assignations) this.aiVoiceAssignments = assignations;
    this.distribuer();

    // Le classement des voix du navigateur dépend de la langue : changer de branche doit
    // rebattre les cartes, sinon on lirait du russe avec des voix françaises en repli.
    this.repartirVoixSysteme();
  }

  /**
   * Vrai quand les voix neurales sont hors d'atteinte et qu'on parle avec le moteur du
   * navigateur : soit l'utilisateur l'a choisi, soit le point d'accès a échoué assez de
   * fois pour qu'on cesse d'essayer. L'interface s'en sert pour le dire, discrètement.
   */
  public isDegradedVoiceMode(): boolean {
    return this.engineMode === 'system' || this.neuralUnavailable;
  }

  public getAiVoiceAssignments(): Record<CharacterRole, string> {
    return this.aiVoiceAssignments;
  }

  public setAiVoiceAssignment(role: CharacterRole, voiceId: string): void {
    this.aiVoiceAssignments[role] = voiceId;
    // Une voix de base qui change de genre change aussi le vivier de personnes du rôle.
    this.distribuer();
  }

  /**
   * Répartit les personnes (`timbres.ts`) entre les personnages du dossier. À refaire dès que
   * le dossier, la langue ou une voix de base change : la personne dépend des trois.
   */
  private distribuer(): void {
    this.distributionPersonnes = distribuerPersonnes(
      this.segments,
      this.languageCode,
      segment => this.resolveVoiceParams(segment).voice
    );
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
    this.contexteLecture = preparerContexte(segments, this.languageCode);
    this.distribuer();
    this.currentIndex = 0;
    this.lastSpeaker = '';
    this.updateMediaSession(title);
    this.emitStatus();

    // High Reactivity: Immediately prefetch first 3 segments so play starts in 0ms!
    if (this.engineMode === 'neural') {
      this.prefetchUpcoming(0, 3);
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
    // Dans le geste de l'utilisateur, avant tout `await` : c'est ce qui autorise ensuite
    // l'élément à jouer seul, écran éteint (voir `lecteur`).
    this.deverrouillerLecteur();

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

    const delay = pauseAvant(this.segments[finishedIndex] ?? null, this.segments[nextIndex]);
    this.clearTransition();
    this.pendingNextIndex = nextIndex;

    if (this.engineMode === 'neural') {
      // Le silence est JOUÉ par l'élément, pas attendu par une minuterie : en arrière-plan,
      // une minuterie est ralentie, et un élément qui se tait laisse le téléphone suspendre
      // la page. Si le segment suivant n'est pas encore prêt (réseau lent), on prolonge le
      // silence par tranches plutôt que de laisser l'élément muet.
      const suivant = this.segments[nextIndex];
      let pret = !this.isSpeakable(suivant);
      if (!pret) {
        this.fetchAudio(suivant, false).then(
          () => (pret = true),
          () => (pret = true)
        );
      }
      const enchainer = (): void => {
        if (token !== this.playToken || !this.isPlaying || this.isPaused) return;
        if (!pret) {
          this.jouerSilence(250, token, enchainer);
          return;
        }
        this.pendingNextIndex = null;
        this.playSegment(nextIndex);
      };
      this.jouerSilence(delay, token, enchainer);
      return;
    }

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
    if (this.engineMode === 'neural') {
      // L'élément, qu'il joue une réplique ou le silence qui la suit.
      this.lecteur?.pause();
    } else if (this.synth) {
      this.synth.pause();
    }
    this.isPaused = true;
    this.isPlaying = false;
    this.emitStatus();
  }

  /** L'élément <audio> unique de la lecture (voir `lecteur`). */
  private element(): HTMLAudioElement {
    if (!this.lecteur) {
      this.lecteur = new Audio();
      this.lecteur.preload = 'auto';
    }
    return this.lecteur;
  }

  /** Un silence WAV de `ms` millisecondes (arrondi à 50 ms, 50 au moins), mis en cache. */
  private urlSilence(ms: number): string {
    const cle = Math.max(50, Math.round(ms / 50) * 50);
    let url = this.silences.get(cle);
    if (!url) {
      const frequence = 24000;
      const wav = encoderWav(new Float32Array(Math.round((cle / 1000) * frequence)), frequence);
      url = URL.createObjectURL(new Blob([wav as BlobPart], { type: 'audio/wav' }));
      this.silences.set(cle, url);
    }
    return url;
  }

  /**
   * Fait jouer l'élément une première fois DANS le geste de l'utilisateur. Sans ça, iOS
   * refuse ensuite de lancer la lecture d'un segment dont la synthèse a pris une seconde :
   * le geste est « consommé » par l'attente. Un élément qui a joué une fois reste autorisé.
   */
  private deverrouillerLecteur(): void {
    if (this.engineMode !== 'neural') return;
    const el = this.element();
    // Une seule fois : ensuite l'élément a toujours une source — la réplique en pause, qu'une
    // reprise doit retrouver, ou le dernier silence.
    if (el.src) return;
    el.onended = null;
    el.onerror = null;
    el.onplay = null;
    el.ontimeupdate = null;
    el.onloadedmetadata = null;
    el.src = this.urlSilence(50);
    el.play().catch(() => {});
  }

  /**
   * Joue `ms` de silence sur l'élément, puis `ensuite`. Si le navigateur refuse (lecture
   * automatique bloquée), une minuterie prend le relais — la lecture au premier plan ne
   * dépend pas de cette astuce.
   */
  private jouerSilence(ms: number, token: number, ensuite: () => void): void {
    const el = this.element();
    this.currentAudio = null;
    el.onplay = null;
    el.ontimeupdate = null;
    el.onloadedmetadata = null;
    let fait = false;
    const suite = (): void => {
      if (fait || token !== this.playToken) return;
      fait = true;
      ensuite();
    };
    el.onended = suite;
    el.onerror = suite;
    el.src = this.urlSilence(ms);
    el.defaultPlaybackRate = 1;
    el.playbackRate = 1;
    el.play().catch(() => {
      if (token !== this.playToken || fait) return;
      this.transitionTimer = setTimeout(() => {
        this.transitionTimer = null;
        suite();
      }, ms);
    });
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
    // Un silence de transition en cours se tait aussi.
    this.lecteur?.pause();
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
    this.lecteur?.pause();
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

  /**
   * La prosodie inscrite dans l'audio d'un segment — voir `parametresVoix`, qui décide du son
   * d'un dossier hors du moteur (`preparationLecture.ts`).
   */
  private resolveVoiceParams(segment: SpeechSegment): ParametresVoix {
    return parametresVoix(segment, this.languageCode, this.aiVoiceAssignments, this.voiceProfiles);
  }

  /** Le texte réellement prononcé — voir `texteDit`. */
  private speechTextFor(segment: SpeechSegment): string {
    return texteDit(segment, this.languageCode, this.contexteLecture);
  }

  /** Y a-t-il quelque chose à prononcer ? Un segment sans lettre ni chiffre n'a pas d'audio. */
  private isSpeakable(segment: SpeechSegment): boolean {
    return hasSpeakableContent(this.speechTextFor(segment));
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
    return `${this.cleBrute(segment, text)}${this.cleMontage(segment)}`;
  }

  /** La clé de l'audio tel que le service le rend : voix, prosodie et texte. */
  private cleBrute(segment: SpeechSegment, text: string): string {
    const { voice, pitch, rate, volume } = this.resolveVoiceParams(segment);
    return `${voice}_${pitch}_${rate}_${volume}_${text}`;
  }

  /**
   * Ce que la lecture ajoute à l'audio brut : la personne jouée (deux personnages qui disent
   * la même phrase avec la même voix de base ne partagent pas leur audio transformé) et la
   * voix qui annonce le locuteur.
   */
  private cleMontage(segment: SpeechSegment): string {
    const { voice } = this.resolveVoiceParams(segment);
    const personne = personneDe(segment, this.languageCode, voice, this.distributionPersonnes);
    const annonce = this.contexteLecture.annonces.has(segment.id) ? `|annonce:${this.resolveVoiceParams(this.voixOffDe(segment)).voice}` : '';
    return `${personne ? `|${personne.id}:${personne.demiTons}:${personne.formants}` : ''}${annonce}`;
  }

  /**
   * Le segment tel que l'Archiviste le dirait : même texte, voix et prosodie du narrateur.
   * C'est lui qui annonce le locuteur (voir `composerAnnonce`).
   */
  private voixOffDe(segment: SpeechSegment): SpeechSegment {
    return { id: segment.id, speaker: 'Archiviste', role: 'narrator', text: segment.text, rawText: segment.rawText };
  }

  /**
   * L'audio tel que le service le rend, depuis le cache persistant ou par synthèse. Le cache
   * vient avant toute synthèse : un segment déjà entendu, même lors d'une session précédente,
   * ne repart pas sur le réseau. On y garde l'audio brut ; ce que la lecture y ajoute (la
   * personne, l'annonce) se refait en quelques dizaines de millisecondes.
   */
  private async octetsBruts(segment: SpeechSegment, text: string): Promise<{ octets: ArrayBuffer; boundaries: WordBoundary[] }> {
    const cle = this.cleBrute(segment, text);
    const stocke = await audioCache.get(cle);
    if (stocke) return { octets: stocke.audio, boundaries: stocke.boundaries };

    const { bytes, boundaries } = canSynthesizeDirectly()
      ? await this.synthesizeDirect(segment, text)
      : await this.synthesizeViaEndpoint(segment, text);
    const octets = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    // Écriture au mieux : une base pleine ou indisponible ne doit pas gêner la lecture.
    void audioCache.put(cle, octets.slice(0), boundaries);
    return { octets, boundaries };
  }

  /** Décode un MP3 du service en échantillons, à 24 kHz — sa fréquence d'origine. */
  private async decoder(octets: ArrayBuffer): Promise<{ signal: Float32Array; frequence: number }> {
    const contexte = new OfflineAudioContext(1, 1, 24000);
    const decode = await contexte.decodeAudioData(octets.slice(0));
    return { signal: decode.getChannelData(0), frequence: decode.sampleRate };
  }

  /**
   * Prépare ce qu'on lira : la personne que joue le segment (`timbres.ts`), et, en tête de
   * prise de parole, l'annonce du locuteur par l'Archiviste suivie d'un silence
   * (`composerAnnonce`). Tout échec rend l'audio d'origine — mieux vaut la voix de base et
   * l'annonce collée que le silence.
   */
  private async preparerAudio(segment: SpeechSegment, text: string, brut: { octets: ArrayBuffer; boundaries: WordBoundary[] }): Promise<CachedAudio> {
    const original = (): CachedAudio => ({
      url: URL.createObjectURL(new Blob([brut.octets], { type: 'audio/mpeg' })),
      boundaries: brut.boundaries
    });
    const { voice } = this.resolveVoiceParams(segment);
    const personne = personneDe(segment, this.languageCode, voice, this.distributionPersonnes);
    const annonce = this.contexteLecture.annonces.get(segment.id);
    if (!personne && !annonce) return original();

    try {
      const { signal, frequence } = await this.decoder(brut.octets);
      let replique = signal;
      if (personne) replique = transformerTimbre(await chargerMoteurTimbre(), signal, frequence, personne);

      let sortie = replique;
      let boundaries = brut.boundaries;
      if (annonce && brut.boundaries.length) {
        const voixOff = await this.octetsBruts(this.voixOffDe(segment), text);
        const decodeVoixOff = await this.decoder(voixOff.octets);
        const monte = composerAnnonce({
          voixOff: decodeVoixOff.signal,
          frontieresVoixOff: voixOff.boundaries,
          replique,
          frontieresReplique: brut.boundaries,
          annonce,
          frequence
        });
        if (monte) {
          sortie = monte.signal;
          boundaries = monte.frontieres;
        }
      }
      if (sortie === signal) return original();
      return {
        url: URL.createObjectURL(new Blob([encoderWav(sortie, frequence) as BlobPart], { type: 'audio/wav' })),
        boundaries
      };
    } catch (err) {
      console.warn('[speechEngine] Montage de la voix non appliqué, audio d’origine conservé :', err);
      return original();
    }
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

    return `${POINT_ACCES_TTS}?${params.toString()}`;
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
        const brut = await this.octetsBruts(segment, text);
        this.neuralFailureStreak = 0;
        const entry = await this.preparerAudio(segment, text, brut);
        this.rememberBlob(key, entry);
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
        this.censorSpans = boundaries.length ? plagesCensure(boundaries, this.languageCode) : [];
        this.cues = boundaries.length ? buildCues(boundaries, segment.text) : [];
        this.currentWordIndex = -1;

        // Toujours le même élément (voir `lecteur`) : changer sa source, c'est ce qui reste
        // permis écran éteint. Le chargement remet la vitesse à `defaultPlaybackRate`, d'où
        // les deux réglages APRÈS la source.
        const audio = this.element();
        audio.src = audioSrc;
        // Playback speed lives here and only here — it is never baked into the
        // generated audio (see resolveVoiceParams).
        audio.defaultPlaybackRate = this.globalSpeed;
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
          this.majSessionMedia(segment);
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
    // Dernier recours indisponible : le moteur neural a déjà échoué et il n'y a pas
    // de `speechSynthesis` derrière (WebView restreinte, contexte non sécurisé).
    // Sortir en silence laissait l'interface figée sur « en lecture » pendant que
    // plus rien ne parlait ; un arrêt propre émet un statut, donc l'UI le montre.
    if (!this.synth) {
      console.warn('[speechEngine] Aucune synthèse disponible : ni neurale, ni système.');
      this.stop();
      return;
    }
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
    this.titreDossier = title;
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    this.majSessionMedia();

    // Les commandes de l'écran de verrouillage et du casque : lecture, pause, réplique
    // précédente ou suivante, arrêt. Un navigateur qui ne connaît pas une action la refuse
    // en levant une exception — elle ne doit pas empêcher d'installer les autres.
    const actions: [MediaSessionAction, () => void][] = [
      ['play', () => this.play()],
      ['pause', () => this.pause()],
      ['previoustrack', () => this.previous()],
      ['nexttrack', () => this.next()],
      ['stop', () => this.stop()]
    ];
    for (const [action, gestionnaire] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, gestionnaire);
      } catch {
        /* action inconnue de ce navigateur */
      }
    }
  }

  /**
   * Ce que montre l'écran de verrouillage : le dossier, qui parle, l'icône de l'application.
   * Des images matricielles : Android et iOS ignorent une icône SVG, et la notification
   * restait sans image.
   */
  private majSessionMedia(segment?: SpeechSegment): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.titreDossier,
      artist: segment ? nomDuLocuteur(segment.speaker) : NOM_SITE,
      album: NOM_SITE,
      artwork: [
        { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png' }
      ]
    });
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
    // L'écran de verrouillage montre lecture ou pause selon ce que dit la page, pas selon
    // l'élément : pendant un silence de transition, la lecture continue.
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : this.isPaused ? 'paused' : 'none';
    }
    this.onStatusChangeCb({
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentSegmentIndex: this.currentIndex,
      totalSegments: this.segments.length,
      currentSpeaker: currentSegment ? nomDuLocuteur(currentSegment.speaker) : t('roles.narrateur'),
      currentRole: currentSegment ? currentSegment.role : 'narrator',
      globalSpeed: this.globalSpeed,
      currentTime: this.currentTime,
      duration: this.duration,
      voixDegradee: this.isDegradedVoiceMode(),
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
