import React, { useState } from 'react';
import { ArrowLeft, Star, Volume2, Play, User, ZoomIn, ZoomOut } from 'lucide-react';
import { ScpItemDetail } from '../../types/scp';
import { SpeechSegment } from '../../types/audioRoleplay';
import { WikiLink } from '../../services/linkExtractor';
import { SpokenLine } from '../../components/SpokenLine';
import { ReadingQueue } from '../../components/ReadingQueue';
import { BandeauEntites } from '../../components/BandeauEntites';
import { sfx } from '../../services/sfxService';

interface MobileScpReaderProps {
  scp: ScpItemDetail;
  segments: SpeechSegment[];
  currentSegmentIndex: number;
  isPlaying: boolean;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPlaySegment: (index: number) => void;
  /** Mot prononcé dans le segment courant, pour le suivi de lecture. -1 = pas de suivi. */
  activeWordIndex?: number;
  /** Liens inter-dossiers — voir SpokenLine / ReadingQueue (composants partagés). */
  readingQueue?: WikiLink[];
  onEnqueueLink?: (link: WikiLink) => void;
  onOpenLink?: (link: WikiLink) => void;
  onRemoveFromQueue?: (target: string) => void;
  onClearQueue?: () => void;
  /** Branche courante : l'index d'entités est construit par branche. */
  languageCode?: string;
  /** Ouvre la fiche d'une entité rattachée au dossier. */
  onOuvrirEntite?: (id: string) => void;
}

export const MobileScpReader: React.FC<MobileScpReaderProps> = ({
  scp,
  segments,
  currentSegmentIndex,
  isPlaying,
  onBack,
  isFavorite,
  onToggleFavorite,
  onPlaySegment,
  activeWordIndex = -1,
  readingQueue,
  onEnqueueLink,
  onOpenLink,
  onRemoveFromQueue,
  onClearQueue,
  languageCode = 'fr',
  onOuvrirEntite
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');

  const textClasses = {
    sm: 'text-xs leading-relaxed',
    base: 'text-sm leading-relaxed',
    lg: 'text-base leading-loose'
  }[fontSize];

  return (
    <div className="flex-1 flex flex-col pb-28">
      {/* Reader Mobile Action Bar */}
      <div className="sticky top-12 z-20 bg-slate-950/95 border-b border-scp-border backdrop-blur-md -mx-3 px-3 py-2 flex items-center justify-between shadow-sm">
        {/* Back Button */}
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onBack();
          }}
          className="flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-700 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-red-500" />
          <span>RETOUR</span>
        </button>

        {/* Font Zoom Controls & Favorite */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setFontSize(prev => prev === 'lg' ? 'base' : 'sm')}
              disabled={fontSize === 'sm'}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
              title="Réduire texte"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-400 font-bold uppercase">{fontSize}</span>
            <button
              onClick={() => setFontSize(prev => prev === 'sm' ? 'base' : 'lg')}
              disabled={fontSize === 'lg'}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
              title="Agrandir texte"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onToggleFavorite();
            }}
            className={`p-1.5 rounded-lg border active:scale-95 transition-all ${
              isFavorite 
                ? 'bg-amber-950/60 border-amber-600 text-amber-400' 
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dossier Header Card */}
      <div className="mt-3 bg-slate-900/90 border border-red-900/60 rounded-xl p-4 shadow-xl relative overflow-hidden">
        {/* Top classified strip */}
        <div className="flex items-center justify-between text-[10px] font-mono text-red-400 mb-1.5 font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span>DOSSIER SÉCURISÉ // CL-4</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-300 uppercase">
            {scp.objectClass}
          </span>
        </div>

        <h1 className="text-xl font-bold font-mono text-white tracking-wide">
          {scp.scpNumber || scp.slug.toUpperCase()}
        </h1>
        {scp.alternateTitle && (
          <h2 className="text-xs font-mono text-slate-300 mt-0.5">
            {scp.alternateTitle}
          </h2>
        )}

        <BandeauEntites slug={scp.slug} languageCode={languageCode} onOuvrirEntite={onOuvrirEntite} />

        {/* Audio Roleplay Indicator */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span>{segments.length} SÉQUENCES AUDIO DÉTECTÉES</span>
          </div>
        </div>
      </div>

      {/* Script Segments for Mobile Touch Reading */}
      {/* File « À SUIVRE » — mêmes composants que le desktop, cibles tactiles ≥ 44 px. */}
      {readingQueue && onOpenLink && onRemoveFromQueue && onClearQueue && (
        <div className="mt-3">
          <ReadingQueue
            queue={readingQueue}
            onOpen={onOpenLink}
            onRemove={onRemoveFromQueue}
            onClear={onClearQueue}
          />
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {segments.map((segment, index) => {
          const isCurrent = index === currentSegmentIndex;

          return (
            <div
              key={index}
              onClick={() => {
                sfx.playTerminalBeep();
                onPlaySegment(index);
              }}
              className={`rounded-xl border p-3 transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-red-950/40 border-red-600 shadow-lg shadow-red-950/50 scale-[1.01]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Segment speaker bar */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                    isCurrent ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {segment.speaker}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                    {segment.role}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono">
                  {isCurrent && isPlaying ? (
                    <span className="text-cyan-400 flex items-center gap-1 animate-pulse font-bold">
                      <Volume2 className="w-3 h-3" /> EN COURS
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5 hover:text-red-400">
                      <Play className="w-2.5 h-2.5" /> ÉCOUTER
                    </span>
                  )}
                </div>
              </div>

              {/* Segment Text */}
              <p className={`font-sans text-slate-200 ${textClasses}`}>
                {segment.links && segment.links.length > 0 && onEnqueueLink && onOpenLink ? (
                  <SpokenLine
                    text={segment.text}
                    links={segment.links}
                    activeWordIndex={isCurrent ? activeWordIndex : -1}
                    onEnqueueLink={onEnqueueLink}
                    onOpenLink={onOpenLink}
                  />
                ) : (
                  <SpokenLine
                    text={segment.text}
                    activeWordIndex={isCurrent ? activeWordIndex : -1}
                  />
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
