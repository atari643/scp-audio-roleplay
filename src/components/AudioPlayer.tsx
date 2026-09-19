import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Square,
  Sliders,
  Gauge,
  Volume2,
  Volume1,
  VolumeX
} from 'lucide-react';
import { CharacterRole, PlayerStatus } from '../types/audioRoleplay';
import { sfx } from '../services/sfxService';
import { HeartRateMonitor } from './HeartRateMonitor';

interface AudioPlayerProps {
  status: PlayerStatus;
  currentTextPreview?: string;
  ambienceActive: boolean;
  onToggleAmbience: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (index: number) => void;
  onSeekTime?: (seconds: number) => void;
  onSeekPercent?: (fraction: number) => void;
  onVolumeChange?: (volume: number) => void;
  onToggleMute?: () => void;
  onSpeedChange: (speed: number) => void;
  onOpenVoiceStudio: () => void;
}

/**
 * Identité du rôle en cours de lecture.
 *
 * Seule la couleur du rôle subsiste — l'ancienne version peignait aussi le fond
 * et la bordure du badge, ce qui faisait changer de couleur tout le coin gauche
 * du lecteur à chaque réplique.
 */
const ROLE_BADGES: Record<CharacterRole, { label: string; couleur: string; code: string }> = {
  narrator: { label: 'Archiviste', couleur: 'var(--role-narrateur)', code: 'ARCH-01' },
  researcher: { label: 'Chercheur', couleur: 'var(--role-chercheur)', code: 'SCI-MED' },
  anomaly: { label: 'Entité SCP', couleur: 'var(--role-anomalie)', code: 'ANOM-BIO' },
  classD: { label: 'Classe-D', couleur: 'var(--role-classed)', code: 'D-CORPS' },
  agent: { label: 'Agent FIM', couleur: 'var(--role-agent)', code: 'MTF-OPS' },
  commander: { label: 'Commandement', couleur: 'var(--role-commandant)', code: 'O5-COMM' },
  intercom: { label: 'Intercom', couleur: 'var(--role-intercom)', code: 'PA-SITE19' }
};

const SPEEDS = [0.85, 1.0, 1.2, 1.4];

/**
 * Anneau de focus commun.
 *
 * Le lecteur est la barre la plus utilisée de l'application et elle se pilote au
 * clavier (espace, flèches). Sans anneau visible, la navigation au clavier se fait
 * à l'aveugle sur une douzaine de boutons alignés.
 */
const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-texte focus-visible:ring-offset-1 focus-visible:ring-offset-surface-1';

const BOUTON_TRANSPORT =
  'w-9 h-9 flex items-center justify-center rounded-sm text-texte-attenue ' +
  'hover:text-texte hover:bg-surface-3 disabled:opacity-25 disabled:hover:bg-transparent ' +
  'disabled:hover:text-texte-attenue transition-colors ' +
  FOCUS;

/** Groupe de réglages : même boîte pour le volume, la vitesse et l'ambiance. */
const GROUPE_REGLAGE =
  'flex items-center h-8 rounded-sm bg-surface-2 border border-bordure ' +
  'hover:border-bordure-forte transition-colors';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  status,
  currentTextPreview,
  ambienceActive,
  onToggleAmbience,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrevious,
  onSeekTime,
  onSeekPercent,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onOpenVoiceStudio
}) => {
  const roleBadge = ROLE_BADGES[status.currentRole] || ROLE_BADGES.narrator;

  // Avancement dans le dossier, segment par segment.
  const segmentProgressPercent =
    status.totalSegments > 0
      ? Math.round(((status.currentSegmentIndex + 1) / status.totalSegments) * 100)
      : 0;

  // Avancement dans le segment en cours.
  const audioProgressPercent =
    status.duration > 0 ? Math.min(100, Math.max(0, (status.currentTime / status.duration) * 100)) : 0;

  if (status.totalSegments === 0) return null;

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (status.duration > 0 && onSeekTime) {
      onSeekTime(val);
    } else if (onSeekPercent) {
      onSeekPercent(val / 100);
    }
  };

  return (
    // Le lecteur occupe toute la largeur : un `scipnet-box` y poserait ses
    // équerres hors de l'écran. Un filet supérieur fait le même office.
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-1/97 backdrop-blur-xl border-t border-bordure select-none shadow-relief">
      {/* Barre de progression : deux niveaux, un seul accent.
          Le fond sourd indique où l'on en est du dossier, l'aplat plein où l'on
          en est du segment.

          La piste s'épaissit au survol et sort une tête de lecture : à 1,5 px et
          sans repère, on visait un point de la bande sans savoir où l'on était,
          et le rail restait invisible tant qu'on ne cherchait pas le curseur. */}
      <div className="group/piste relative w-full h-1.5 hover:h-2.5 bg-fond transition-[height] duration-150 cursor-pointer">
        <div
          className="absolute inset-y-0 left-0 bg-accent/30 pointer-events-none transition-[width] duration-300"
          style={{ width: `${segmentProgressPercent}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-accent-texte pointer-events-none"
          style={{ width: `${audioProgressPercent}%` }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-3.5 bg-texte opacity-0 group-hover/piste:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `${audioProgressPercent}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={0}
          max={status.duration > 0 ? status.duration : 100}
          step={0.1}
          value={status.duration > 0 ? status.currentTime : audioProgressPercent}
          onChange={handleScrubberChange}
          className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 ${FOCUS}`}
          aria-label="Progression de la lecture"
          title={`Progression : ${formatTime(status.currentTime)} / ${formatTime(status.duration)}`}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Qui parle */}
        <div className="w-full sm:w-1/3 flex items-center gap-2.5 min-w-0">
          <span
            className="w-1 h-9 shrink-0 rounded-sm"
            style={{ backgroundColor: roleBadge.couleur }}
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="font-mono text-sm font-semibold text-texte truncate">
                {status.currentSpeaker}
              </span>
              <span
                className="font-mono text-xs tracking-technique uppercase shrink-0 hidden md:inline"
                style={{ color: roleBadge.couleur }}
              >
                {roleBadge.label}
              </span>
              {/* Le code de canal existait dans la table des rôles sans jamais être
                  affiché. Il donne l'identité du poste sans ajouter de couleur. */}
              <span className="font-mono text-xs text-texte-attenue tracking-technique shrink-0 hidden xl:inline">
                {roleBadge.code}
              </span>
              {status.voixDegradee && (
                // Signalement volontairement sobre : l'auditeur doit savoir qu'il
                // n'entend pas les voix neurales, sans que ça devienne une alarme.
                <span
                  className="font-mono text-xs text-texte-attenue border border-bordure rounded-sm px-1 shrink-0 hidden lg:inline"
                  title="Voix du navigateur : le moteur neural n'est pas joignable depuis cet hébergement. Ouvrez le studio des voix pour réessayer."
                >
                  VOIX DE SECOURS
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              {status.isPlaying && (
                <span className="flex items-end gap-0.5 h-3.5 shrink-0" aria-hidden="true">
                  <span className="visualizer-bar" />
                  <span className="visualizer-bar" />
                  <span className="visualizer-bar" />
                </span>
              )}
              <p className="font-serif text-xs text-texte-attenue truncate italic flex-1">
                {currentTextPreview || (status.isPlaying ? 'Transmission en cours…' : 'Lecture en pause')}
              </p>
              <div className="lg:hidden shrink-0">
                <HeartRateMonitor isPlaying={status.isPlaying} currentRole={status.currentRole} compact />
              </div>
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onPrevious();
              }}
              disabled={status.currentSegmentIndex <= 0}
              title="Réplique précédente [←]"
              aria-label="Réplique précédente"
              className={BOUTON_TRANSPORT}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onSeekTime?.(Math.max(0, status.currentTime - 5));
              }}
              title="Reculer de 5 secondes"
              aria-label="Reculer de 5 secondes"
              className={`${BOUTON_TRANSPORT} hidden sm:flex`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => (status.isPlaying ? onPause() : onPlay())}
              title={status.isPlaying ? 'Mettre en pause [Espace]' : 'Démarrer la lecture [Espace]'}
              aria-label={status.isPlaying ? 'Mettre en pause' : 'Démarrer la lecture'}
              className={`w-11 h-11 mx-1 rounded-sm flex items-center justify-center bg-accent hover:bg-accent-texte active:bg-accent-fort text-texte transition-colors ${FOCUS} ${
                // Un liseré pendant la lecture : le seul bouton dont l'état doit
                // se lire d'un coup d'œil depuis l'autre bout de l'écran.
                status.isPlaying ? 'ring-1 ring-inset ring-texte/25' : ''
              }`}
            >
              {status.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onSeekTime?.(Math.min(status.duration || 600, status.currentTime + 5));
              }}
              title="Avancer de 5 secondes"
              aria-label="Avancer de 5 secondes"
              className={`${BOUTON_TRANSPORT} hidden sm:flex`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onNext();
              }}
              disabled={status.currentSegmentIndex >= status.totalSegments - 1}
              title="Réplique suivante [→]"
              aria-label="Réplique suivante"
              className={BOUTON_TRANSPORT}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onStop();
              }}
              title="Arrêter et réinitialiser"
              aria-label="Arrêter la lecture"
              className={`${BOUTON_TRANSPORT} hidden sm:flex`}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Chronomètre et position : des compteurs, donc du cyan système.
              C'est la seule couleur de cette zone — le rouge y est réservé au
              bouton de lecture et à la barre de progression. */}
          <div className="flex items-center gap-2 font-mono text-xs text-texte-attenue tabular-nums">
            <span>
              <span className="text-systeme">{formatTime(status.currentTime)}</span>
              {' / '}
              {status.duration > 0 ? formatTime(status.duration) : '--:--'}
            </span>
            <span className="text-bordure-forte" aria-hidden="true">|</span>
            <span>
              <span className="text-systeme">{status.currentSegmentIndex + 1}</span>
              {' / '}
              {status.totalSegments}
            </span>
          </div>
        </div>

        {/* Réglages */}
        <div className="w-full sm:w-1/3 flex items-center justify-between sm:justify-end gap-2 font-mono text-xs">
          {/* Volume */}
          <div className={`${GROUPE_REGLAGE} gap-1.5 px-2`}>
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onToggleMute?.();
              }}
              title={status.isMuted ? 'Rétablir le son [M]' : 'Couper le son [M]'}
              aria-label={status.isMuted ? 'Rétablir le son' : 'Couper le son'}
              aria-pressed={status.isMuted}
              className={`rounded-sm ${FOCUS} ${
                status.isMuted ? 'text-accent-texte' : 'text-texte-attenue hover:text-texte transition-colors'
              }`}
            >
              {status.isMuted || status.volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : status.volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={status.isMuted ? 0 : status.volume}
              onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
              className="w-14 h-1 cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
              aria-label="Volume"
              title={`Volume : ${status.isMuted ? 'muet' : `${Math.round(status.volume * 100)} %`}`}
            />
            <span className="text-texte-attenue w-8 text-right tabular-nums">
              {status.isMuted ? 'OFF' : `${Math.round(status.volume * 100)}%`}
            </span>
          </div>

          <div className={`${GROUPE_REGLAGE} px-2 shrink-0 hidden xl:flex`}>
            <HeartRateMonitor isPlaying={status.isPlaying} currentRole={status.currentRole} />
          </div>

          {/* Vitesse de lecture */}
          <div className={`${GROUPE_REGLAGE} gap-0.5 px-1.5`}>
            <Gauge className="w-3.5 h-3.5 text-texte-attenue mr-0.5 hidden md:block" aria-hidden="true" />
            {SPEEDS.map((sp) => (
              <button
                key={sp}
                onClick={() => {
                  sfx.playTerminalBeep();
                  onSpeedChange(sp);
                }}
                aria-pressed={status.globalSpeed === sp}
                className={`px-1.5 py-0.5 rounded-sm transition-colors tabular-nums ${FOCUS} ${
                  status.globalSpeed === sp
                    ? 'bg-accent text-texte font-semibold'
                    : 'text-texte-attenue hover:text-texte'
                }`}
              >
                {sp}×
              </button>
            ))}
          </div>

          {/* Ambiance du Site-19 */}
          <button
            onClick={onToggleAmbience}
            title={ambienceActive ? 'Couper le fond sonore du Site-19' : 'Activer le fond sonore du Site-19'}
            aria-pressed={ambienceActive}
            className={`inline-flex items-center gap-1.5 h-8 px-2 rounded-sm border transition-colors ${FOCUS} ${
              ambienceActive
                ? 'bg-surface-3 border-accent-texte text-accent-texte'
                : 'bg-surface-2 border-bordure text-texte-attenue hover:text-texte hover:border-bordure-forte'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${ambienceActive ? 'bg-accent-texte' : 'bg-bordure-forte'}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">SITE-19</span>
          </button>

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onOpenVoiceStudio();
            }}
            title="Studio des voix et attribution des rôles"
            aria-label="Ouvrir le studio des voix"
            className={`w-8 h-8 flex items-center justify-center rounded-sm bg-surface-2 border text-texte-attenue hover:text-texte hover:border-bordure-forte transition-colors ${FOCUS} ${
              // En mode dégradé, le studio des voix est l'endroit où l'on peut
              // réessayer le moteur neural : le bouton se signale, sans crier.
              status.voixDegradee ? 'border-classe-euclid text-classe-euclid' : 'border-bordure'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
