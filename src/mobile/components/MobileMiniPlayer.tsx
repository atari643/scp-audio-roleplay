import React from 'react';
import { Play, Pause, SkipForward, ChevronUp, User } from 'lucide-react';
import { PlayerStatus } from '../../types/audioRoleplay';
import { sfx } from '../../services/sfxService';

interface MobileMiniPlayerProps {
  status: PlayerStatus;
  currentTextPreview?: string;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onExpand: () => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({
  status,
  currentTextPreview,
  onPlay,
  onPause,
  onNext,
  onExpand
}) => {
  if (status.totalSegments === 0) return null;

  const progressPercent = status.duration > 0
    ? Math.min(100, (status.currentTime / status.duration) * 100)
    : status.totalSegments > 0
    ? ((status.currentSegmentIndex + 1) / status.totalSegments) * 100
    : 0;

  return (
    <div 
      className="fixed bottom-[53px] left-0 right-0 z-30 px-2 pb-1"
      onClick={onExpand}
    >
      <div className="bg-slate-900/95 border border-red-900/60 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden cursor-pointer hover:border-red-700/80 transition-all">
        {/* Continuous Slim Progress Bar */}
        <div className="w-full bg-slate-800 h-1">
          <div 
            className="bg-red-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="px-3 py-2 flex items-center justify-between gap-3">
          {/* Speaker Avatar & Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-red-950/90 border border-red-800/80 flex items-center justify-center shrink-0 text-red-400">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white truncate">
                <span className="text-red-400 truncate">{status.currentSpeaker}</span>
                <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                  ({status.currentSegmentIndex + 1}/{status.totalSegments})
                </span>
              </div>
              <p className="text-[11px] font-sans text-slate-300 truncate leading-tight">
                {currentTextPreview || 'Diffusion audio SCiPNET...'}
              </p>
            </div>
          </div>

          {/* Player Mini Controls */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Play/Pause Button */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                if (status.isPlaying) {
                  onPause();
                } else {
                  onPlay();
                }
              }}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white transition-all shadow-md"
              title={status.isPlaying ? "Pause" : "Lecture"}
            >
              {status.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Next Segment Button */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onNext();
              }}
              disabled={status.currentSegmentIndex >= status.totalSegments - 1}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 active:scale-95 transition-all"
              title="Segment suivant"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Expand Indicator */}
            <button
              onClick={onExpand}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Agrandir le lecteur"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
