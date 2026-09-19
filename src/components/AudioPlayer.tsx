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
  User, 
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

const ROLE_BADGES: Record<CharacterRole, { label: string; color: string; bg: string; border: string; code: string }> = {
  narrator: { label: 'Archiviste', color: 'text-blue-400', bg: 'bg-blue-950/80', border: 'border-blue-700/60', code: 'ARCH-01' },
  researcher: { label: 'Chercheur', color: 'text-emerald-400', bg: 'bg-emerald-950/80', border: 'border-emerald-700/60', code: 'SCI-MED' },
  anomaly: { label: 'Entité SCP', color: 'text-red-400', bg: 'bg-red-950/90', border: 'border-red-700/80', code: 'ANOM-BIO' },
  classD: { label: 'Classe-D', color: 'text-amber-400', bg: 'bg-amber-950/80', border: 'border-amber-700/60', code: 'D-CORPS' },
  agent: { label: 'Agent FIM', color: 'text-cyan-400', bg: 'bg-cyan-950/80', border: 'border-cyan-700/60', code: 'MTF-OPS' },
  commander: { label: 'Commandement', color: 'text-purple-400', bg: 'bg-purple-950/80', border: 'border-purple-700/60', code: 'O5-COMM' },
  intercom: { label: 'Intercom', color: 'text-slate-400', bg: 'bg-slate-900/80', border: 'border-slate-700/60', code: 'PA-SITE19' }
};

const SPEEDS = [0.85, 1.0, 1.2, 1.4];

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
  onSeek,
  onSeekTime,
  onSeekPercent,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onOpenVoiceStudio
}) => {
  const roleBadge = ROLE_BADGES[status.currentRole] || ROLE_BADGES.narrator;

  // Segment overall progression
  const segmentProgressPercent = status.totalSegments > 0 
    ? Math.round(((status.currentSegmentIndex + 1) / status.totalSegments) * 100) 
    : 0;

  // Real-time audio progression inside current segment
  const audioProgressPercent = status.duration > 0
    ? Math.min(100, Math.max(0, (status.currentTime / status.duration) * 100))
    : 0;

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t-2 border-red-700/70 shadow-2xl scipnet-box select-none">
      {/* Top Technical Progress & Interactive Scrubber Bar */}
      <div className="relative w-full h-2 bg-slate-900/90 cursor-pointer group border-b border-red-950/80">
        {/* Dossier Segment Background Pip Track */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-red-950/40 border-r border-red-700/40 transition-all pointer-events-none"
          style={{ width: `${segmentProgressPercent}%` }}
        />

        {/* Real-time Audio Snippet Progress Bar */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-800 via-red-600 to-red-400 group-hover:from-red-600 group-hover:to-red-300 transition-all pointer-events-none"
          style={{ width: `${audioProgressPercent}%` }}
        >
          {/* Laser head cursor */}
          {status.isPlaying && (
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-lg shadow-red-500 animate-ping" />
          )}
        </div>

        {/* Interactive range slider for seeking */}
        <input
          type="range"
          min={0}
          max={status.duration > 0 ? status.duration : 100}
          step={0.1}
          value={status.duration > 0 ? status.currentTime : audioProgressPercent}
          onChange={handleScrubberChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          title={`Progression : ${formatTime(status.currentTime)} / ${formatTime(status.duration)}`}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left Deck: Speaker Identity & Audio Frequency Visualizer */}
        <div className="w-full sm:w-1/3 flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-scp-surface border border-scp-border flex items-center justify-center shrink-0 shadow relative group">
            <User className={`w-4 h-4 ${roleBadge.color}`} />
            {status.isPlaying && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-mono font-black text-white truncate tracking-wide">
                {status.currentSpeaker}
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${roleBadge.bg} ${roleBadge.color} ${roleBadge.border}`}>
                {roleBadge.label} // {roleBadge.code}
              </span>
            </div>

            {/* Sub-preview or live wave */}
            <div className="flex items-center gap-2 mt-0.5">
              {status.isPlaying && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="visualizer-bar" />
                  <span className="visualizer-bar" />
                  <span className="visualizer-bar" />
                  <span className="visualizer-bar" />
                </div>
              )}
              <p className="text-[10px] font-mono text-slate-400 truncate italic flex-1">
                {currentTextPreview || (status.isPlaying ? 'Transmission en cours...' : 'Lecture en pause')}
              </p>
              {/* Compact HeartRateMonitor on small screens */}
              <div className="lg:hidden shrink-0">
                <HeartRateMonitor
                  isPlaying={status.isPlaying}
                  currentRole={status.currentRole}
                  compact={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Deck: Playback Controls & Precision Chronometer */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Previous Segment */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onPrevious();
              }}
              disabled={status.currentSegmentIndex <= 0}
              title="Réplique précédente [Flèche Gauche]"
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Rewind 5s */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onSeekTime?.(Math.max(0, status.currentTime - 5));
              }}
              title="Reculer de 5 secondes"
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 transition-colors hidden sm:block"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Main Play / Pause Button */}
            <button
              onClick={() => {
                if (status.isPlaying) {
                  onPause();
                } else {
                  onPlay();
                }
              }}
              title={status.isPlaying ? 'Mettre en pause [Espace]' : 'Démarrer la lecture [Espace]'}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 border ${
                status.isPlaying
                  ? 'bg-red-700 hover:bg-red-600 text-white shadow-red-950/80 border-red-400 ring-2 ring-red-500/40'
                  : 'bg-red-800 hover:bg-red-700 text-white shadow-red-950/60 border-red-500/70'
              }`}
            >
              {status.isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            {/* Fast-Forward 5s */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onSeekTime?.(Math.min(status.duration || 600, status.currentTime + 5));
              }}
              title="Avancer de 5 secondes"
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 transition-colors hidden sm:block"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Next Segment */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onNext();
              }}
              disabled={status.currentSegmentIndex >= status.totalSegments - 1}
              title="Réplique suivante [Flèche Droite]"
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Stop Button */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onStop();
              }}
              title="Arrêter et réinitialiser"
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors hidden sm:block"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          {/* Time Counter & Segment Gauge Under Deck */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            {/* Real-time Time Elapsed / Duration Display */}
            <div className="flex items-center gap-1 bg-black/90 px-2 py-0.5 rounded border border-slate-800 text-slate-400 shadow-inner">
              <span className={`font-bold ${status.isPlaying ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formatTime(status.currentTime)}
              </span>
              <span className="text-slate-600">/</span>
              <span>{status.duration > 0 ? formatTime(status.duration) : '--:--'}</span>
            </div>

            {/* Segment Index */}
            <div className="text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 shrink-0">
              <span className="text-red-400 font-bold">{status.currentSegmentIndex + 1}</span>
              <span className="text-slate-600 mx-1">/</span>
              <span>{status.totalSegments}</span>
            </div>
          </div>
        </div>

        {/* Right Deck: Volume Controller, Speed, Site-19 Drone & Voice Studio */}
        <div className="w-full sm:w-1/3 flex items-center justify-between sm:justify-end gap-2 text-xs font-mono">
          {/* Volume Controller Slider & Mute Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg">
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onToggleMute?.();
              }}
              title={status.isMuted ? "Rétablir le son [M]" : "Couper le son [M]"}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {status.isMuted || status.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400 animate-pulse" />
              ) : status.volume < 0.5 ? (
                <Volume1 className="w-4 h-4 text-slate-300" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={status.isMuted ? 0 : status.volume}
              onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
              className="w-14 sm:w-18 h-1 accent-red-600 bg-slate-800 rounded cursor-pointer"
              title={`Volume : ${status.isMuted ? 'Muet' : `${Math.round(status.volume * 100)}%`}`}
            />
            <span className="text-[9px] text-slate-400 w-6 text-right font-mono">
              {status.isMuted ? 'OFF' : `${Math.round(status.volume * 100)}%`}
            </span>
          </div>

          {/* Biological Telemetry: HeartRateMonitor ECG on Desktop */}
          <div className="hidden xl:flex items-center bg-black/60 border border-slate-800/90 px-2 py-0.5 rounded-lg shrink-0">
            <HeartRateMonitor
              isPlaying={status.isPlaying}
              currentRole={status.currentRole}
            />
          </div>

          {/* Tape Speed Selector */}
          <div className="flex items-center gap-0.5 bg-scp-surface border border-scp-border px-1 py-0.5 rounded-lg">
            <Gauge className="w-3 h-3 text-slate-400 mr-0.5 hidden md:block" />
            {SPEEDS.map((sp) => (
              <button
                key={sp}
                onClick={() => {
                  sfx.playTerminalBeep();
                  onSpeedChange(sp);
                }}
                className={`px-1 py-0.5 rounded text-[9px] transition-colors ${
                  status.globalSpeed === sp
                    ? 'bg-red-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>

          {/* Containment Site-19 Ambient Drone Toggle */}
          <button
            onClick={onToggleAmbience}
            title={ambienceActive ? "Désactiver le drone de confinement Site-19" : "Activer le bruit de fond d'ambiance du Site-19"}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono transition-all ${
              ambienceActive
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-900/50'
                : 'bg-scp-surface border-scp-border text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${ambienceActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span className="hidden sm:inline">SITE-19</span>
          </button>

          {/* Voice Studio button */}
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onOpenVoiceStudio();
            }}
            title="Studio des voix & attribution des rôles"
            className="p-1.5 bg-scp-surface hover:bg-scp-card border border-scp-border hover:border-red-600/50 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
