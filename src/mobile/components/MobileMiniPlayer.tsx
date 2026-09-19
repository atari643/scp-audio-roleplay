import React from 'react';
import { Play, Pause, SkipForward, ChevronUp, User } from 'lucide-react';
import { PlayerStatus } from '../../types/audioRoleplay';
import { sfx } from '../../services/sfxService';
import { useT } from '../../i18n';

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
  const t = useT();
  if (status.totalSegments === 0) return null;

  const progressPercent = status.duration > 0
    ? Math.min(100, (status.currentTime / status.duration) * 100)
    : status.totalSegments > 0
    ? ((status.currentSegmentIndex + 1) / status.totalSegments) * 100
    : 0;

  return (
    <div
      className="fixed left-0 right-0 z-30 px-2 pb-1"
      /* 53 px = hauteur de `MobileBottomNav`, à laquelle celle-ci ajoute le retrait de la
         barre de gestes. Sans le même ajout ici, le mini-lecteur passe DERRIÈRE la barre
         de navigation sur tous les téléphones sans bouton physique. */
      style={{ bottom: 'calc(53px + env(safe-area-inset-bottom, 0px))' }}
      onClick={onExpand}
    >
      <div className="bg-surface-1/95 border border-accent-texte/60 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden cursor-pointer hover:border-accent-texte/80 transition-all">
        {/* Continuous Slim Progress Bar */}
        <div className="w-full bg-surface-2 h-1">
          <div 
            className="bg-accent h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="px-3 py-2 flex items-center justify-between gap-3">
          {/* Speaker Avatar & Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-surface-3/90 border border-accent-texte/80 flex items-center justify-center shrink-0 text-accent-texte">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-texte truncate">
                <span className="text-accent-texte truncate">{status.currentSpeaker}</span>
                <span className="text-xs text-texte-attenue shrink-0 font-normal">
                  (<span className="text-systeme tabular-nums">{status.currentSegmentIndex + 1}</span>/<span className="tabular-nums">{status.totalSegments}</span>)
                </span>
                {/* Même signalement que dans la feuille plein écran, réduit à ce que
                    la barre peut porter. Le détail et le bouton sont au-dessus. */}
                {status.voixDegradee && (
                  <span
                    className="shrink-0 rounded-sm border border-bordure px-1 font-normal text-texte-attenue"
                    title={t('lecteur.voixSecoursCourtInfo')}
                  >
                    {t('lecteur.voixSecoursCourt')}
                  </span>
                )}
              </div>
              <p className="text-xs font-sans text-texte-second truncate leading-tight">
                {currentTextPreview || t('lecteur.diffusion')}
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
              className="p-2 rounded-lg bg-accent hover:bg-accent-texte active:scale-95 text-texte transition-all shadow-md"
              title={status.isPlaying ? t('lecteur.pause') : t('lecteur.lire')}
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
              className="p-2 rounded-lg bg-surface-2 text-texte-second hover:text-texte disabled:opacity-30 active:scale-95 transition-all"
              title={t('lecteur.segmentSuivant')}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Expand Indicator */}
            <button
              onClick={onExpand}
              className="p-1.5 text-texte-attenue hover:text-texte"
              title={t('lecteur.agrandir')}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
