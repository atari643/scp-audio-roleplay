import React, { useState } from 'react';
import { 
  Play, Pause, Square, SkipBack, SkipForward, RotateCcw, RotateCw,
  Volume2, VolumeX, Radio, Sparkles, ChevronDown, ListMusic, User
} from 'lucide-react';
import { PlayerStatus, SpeechSegment } from '../../types/audioRoleplay';
import { sfx } from '../../services/sfxService';

interface MobileAudioSheetProps {
  status: PlayerStatus;
  segments: SpeechSegment[];
  currentTextPreview?: string;
  ambienceActive: boolean;
  onToggleAmbience: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (index: number) => void;
  onSeekTime: (seconds: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleMute: () => void;
  onOpenVoiceStudio: () => void;
  onClose?: () => void;
}

export const MobileAudioSheet: React.FC<MobileAudioSheetProps> = ({
  status,
  segments,
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
  onSpeedChange,
  onToggleMute,
  onOpenVoiceStudio,
  onClose
}) => {
  const [showSegmentList, setShowSegmentList] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = status.duration > 0
    ? Math.min(100, (status.currentTime / status.duration) * 100)
    : status.totalSegments > 0
    ? ((status.currentSegmentIndex + 1) / status.totalSegments) * 100
    : 0;

  const speeds = [0.75, 1.0, 1.25, 1.5];

  if (status.totalSegments === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-3/40 border border-accent-texte/40 flex items-center justify-center text-texte-attenue mb-4">
          <Radio className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold font-mono text-texte mb-1">AUCUN FLUX AUDIO ACTIF</h3>
        <p className="text-xs font-mono text-texte-attenue max-w-xs mb-6">
          Sélectionnez un dossier SCP dans les archives pour charger la transcription vocale multi-personnages.
        </p>
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onOpenVoiceStudio();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-bordure text-xs font-mono text-role-agent hover:text-texte"
        >
          <Sparkles className="w-4 h-4 text-role-agent" />
          <span>Configurer le Voice Studio Neural</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-fond px-4 py-3 pb-24 overflow-y-auto">
      {/* Sheet Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-bordure">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface-1 border border-bordure text-texte-attenue hover:text-texte"
              title="Réduire"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="text-xs font-mono text-accent-texte uppercase tracking-widest font-bold">
              SCiPNET TACTICAL AUDIO
            </div>
            <div className="text-xs font-mono text-texte-second">
              SEGMENT <span className="text-systeme tabular-nums">{status.currentSegmentIndex + 1}</span> / <span className="tabular-nums">{status.totalSegments}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onOpenVoiceStudio();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-3/80 border border-accent-texte text-xs font-mono text-accent-texte hover:text-texte active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-role-agent" />
            <span>Voix IA</span>
          </button>
          <button
            onClick={() => setShowSegmentList(!showSegmentList)}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-all ${
              showSegmentList
                ? 'bg-surface-3/60 border-accent-texte text-texte'
                : 'bg-surface-1 border-bordure text-texte-attenue'
            }`}
            title="Liste des segments"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Segment List Drawer or Main Player */}
      {showSegmentList ? (
        <div className="flex-1 py-3 overflow-y-auto space-y-1.5">
          <div className="text-xs font-mono text-texte-attenue mb-2 font-semibold">
            INDEX DES DIALOGUES ({segments.length})
          </div>
          {segments.map((seg, idx) => (
            <button
              key={idx}
              onClick={() => {
                sfx.playTerminalBeep();
                onSeek(idx);
                setShowSegmentList(false);
              }}
              className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 text-xs font-mono ${
                idx === status.currentSegmentIndex
                  ? 'bg-surface-3/60 border-accent-texte text-texte shadow-md'
                  : 'bg-surface-1/50 border-bordure text-texte-attenue hover:text-texte'
              }`}
            >
              <span className="font-bold text-accent-texte shrink-0">#{idx + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-texte truncate">{seg.speaker}</div>
                <p className="text-xs text-texte-attenue line-clamp-2">{seg.text}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between py-2 gap-3">
          {/* Tactical Audio Radar / Visualizer */}
          <div className="relative rounded-2xl bg-gradient-to-b from-surface-3/30 to-surface-2/80 border border-accent-texte/40 p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner my-1">
            {/* Animated Pulse Waves */}
            <div className="relative z-10 w-16 h-16 rounded-full bg-fond border-2 border-accent-texte/80 flex items-center justify-center text-accent-texte shadow-xl mb-3">
              <User className="w-8 h-8" />
            </div>

            <div className="relative z-10 text-center">
              <div className="text-base font-bold font-mono text-texte tracking-wide">
                {status.currentSpeaker}
              </div>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-surface-3/80 border border-accent-texte/80 text-xs font-mono text-accent-texte">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-texte"></span>
                <span className="uppercase">{status.currentRole}</span>
              </div>
            </div>

            {/* Audio waveform simulator */}
            <div className="relative z-10 flex items-center justify-center gap-1 mt-4 h-8 w-full max-w-[200px]">
              {[40, 75, 55, 90, 60, 100, 45, 80, 70, 95, 50, 85].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    status.isPlaying ? 'bg-accent-texte animate-pulse' : 'bg-surface-3'
                  }`}
                  style={{ 
                    height: status.isPlaying ? `${h}%` : '20%',
                    animationDelay: `${i * 75}ms` 
                  }}
                />
              ))}
            </div>
          </div>

          {/* Spoken Text Dialogue Card */}
          <div className="bg-surface-1/90 border border-bordure rounded-xl p-3 shadow-md">
            <div className="text-xs font-mono text-texte-attenue mb-1 flex items-center justify-between">
              <span>TRANSCRIPTION EN DIRECT</span>
              <span className="text-role-agent">DIFFUSION ACTIVE</span>
            </div>
            <p className="text-xs font-sans text-texte leading-relaxed italic line-clamp-4">
              « {currentTextPreview || 'En attente de transmission...'} »
            </p>
          </div>

          {/* Progress & Scrubber */}
          <div className="space-y-1.5">
            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max={status.duration || status.totalSegments}
                value={status.duration > 0 ? status.currentTime : status.currentSegmentIndex}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (status.duration > 0) {
                    onSeekTime(val);
                  } else {
                    onSeek(val);
                  }
                }}
                className="w-full h-2 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-accent-texte focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-texte-attenue">
              <span className="text-systeme tabular-nums">{formatTime(status.currentTime)}</span>
              <span className="tabular-nums">{formatTime(status.duration)}</span>
            </div>
          </div>

          {/* Big Thumb Player Controls */}
          <div className="flex items-center justify-around py-1">
            {/* -10s */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onSeekTime(Math.max(0, status.currentTime - 10));
              }}
              className="p-3 rounded-full bg-surface-1 border border-bordure text-texte-attenue hover:text-texte active:scale-95"
              title="-10 secondes"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Previous Segment */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onPrevious();
              }}
              disabled={status.currentSegmentIndex <= 0}
              className="p-3 rounded-full bg-surface-1 border border-bordure text-texte-second hover:text-texte disabled:opacity-30 active:scale-95"
              title="Segment précédent"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            {/* Giant Play/Pause */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                if (status.isPlaying) {
                  onPause();
                } else {
                  onPlay();
                }
              }}
              className="p-5 rounded-full bg-accent hover:bg-accent-texte text-texte shadow-[0_0_25px_rgba(220,38,38,0.5)] active:scale-95 transition-all"
              title={status.isPlaying ? "Pause" : "Lecture"}
            >
              {status.isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next Segment */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onNext();
              }}
              disabled={status.currentSegmentIndex >= status.totalSegments - 1}
              className="p-3 rounded-full bg-surface-1 border border-bordure text-texte-second hover:text-texte disabled:opacity-30 active:scale-95"
              title="Segment suivant"
            >
              <SkipForward className="w-6 h-6" />
            </button>

            {/* +10s */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onSeekTime(Math.min(status.duration, status.currentTime + 10));
              }}
              className="p-3 rounded-full bg-surface-1 border border-bordure text-texte-attenue hover:text-texte active:scale-95"
              title="+10 secondes"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Settings Bar: Speed & Ambience & Mute */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Speed Pills */}
            <div className="flex items-center justify-between bg-surface-1 border border-bordure rounded-xl p-1.5">
              <span className="text-xs font-mono text-texte-attenue pl-1 font-bold">VITESSE</span>
              <div className="flex gap-1">
                {speeds.map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      sfx.playTerminalBeep();
                      onSpeedChange(spd);
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                      status.globalSpeed === spd
                        ? 'bg-accent text-texte font-bold'
                        : 'text-texte-attenue hover:text-texte'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Ambience & Mute Controls */}
            <div className="flex items-center justify-around bg-surface-1 border border-bordure rounded-xl p-1.5">
              {/* Containment Ambience toggle */}
              <button
                onClick={() => {
                  sfx.playTerminalBeep();
                  onToggleAmbience();
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all ${
                  ambienceActive
                    ? 'bg-surface-3 border border-classe-safe text-classe-safe font-bold'
                    : 'text-texte-attenue hover:text-texte'
                }`}
                title="Bruit blanc de confinement"
              >
                <Radio className={`w-3 h-3 ${ambienceActive ? 'text-classe-safe' : ''}`} />
                <span>AMBIANCE</span>
              </button>

              {/* Mute button */}
              <button
                onClick={() => {
                  sfx.playTerminalBeep();
                  onToggleMute();
                }}
                className={`p-1.5 rounded text-xs transition-all ${
                  status.isMuted ? 'text-accent-texte bg-surface-3/60' : 'text-texte-attenue hover:text-texte'
                }`}
                title="Sourdine"
              >
                {status.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
