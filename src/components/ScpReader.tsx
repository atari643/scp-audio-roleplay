import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Star, 
  ExternalLink, 
  FileText, 
  User, 
  Sparkles, 
  ShieldAlert,
  Radio,
  Sliders,
  AlertTriangle,
  Biohazard,
  Terminal,
  Activity
} from 'lucide-react';
import { ScpItemDetail } from '../types/scp';
import { CharacterRole, SpeechSegment } from '../types/audioRoleplay';
import { speechEngine } from '../services/speechEngine';
import { sfx } from '../services/sfxService';
import { WikiLink } from '../services/linkExtractor';
import { SpokenLine } from './SpokenLine';
import { ReadingQueue } from './ReadingQueue';
import { BandeauEntites } from './BandeauEntites';

interface ScpReaderProps {
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
  /** File « À SUIVRE » et navigation inter-dossiers (voir SpokenLine / ReadingQueue). */
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

const ROLE_STYLES: Record<CharacterRole, { border: string; bg: string; text: string; badge: string; iconColor: string }> = {
  narrator: {
    border: 'border-blue-700/60',
    bg: 'bg-blue-950/25',
    text: 'text-slate-100',
    badge: 'bg-blue-950/90 border-blue-600/70 text-blue-300 font-mono',
    iconColor: 'text-blue-400'
  },
  researcher: {
    border: 'border-emerald-700/60',
    bg: 'bg-emerald-950/25',
    text: 'text-emerald-100',
    badge: 'bg-emerald-950/90 border-emerald-600/70 text-emerald-300 font-mono',
    iconColor: 'text-emerald-400'
  },
  anomaly: {
    border: 'border-red-700/80',
    bg: 'bg-red-950/35',
    text: 'text-red-100 font-medium',
    badge: 'bg-red-950 border-red-500 text-red-400 font-bold font-mono',
    iconColor: 'text-red-500'
  },
  classD: {
    border: 'border-amber-700/60',
    bg: 'bg-amber-950/25',
    text: 'text-amber-100',
    badge: 'bg-amber-950/90 border-amber-600/70 text-amber-300 font-mono',
    iconColor: 'text-amber-400'
  },
  agent: {
    border: 'border-cyan-700/60',
    bg: 'bg-cyan-950/25',
    text: 'text-cyan-100',
    badge: 'bg-cyan-950/90 border-cyan-600/70 text-cyan-300 font-mono',
    iconColor: 'text-cyan-400'
  },
  commander: {
    border: 'border-purple-700/60',
    bg: 'bg-purple-950/30',
    text: 'text-purple-100',
    badge: 'bg-purple-950 border-purple-600 text-purple-300 font-bold font-mono',
    iconColor: 'text-purple-400'
  },
  intercom: {
    border: 'border-slate-700/80',
    bg: 'bg-slate-900/80',
    text: 'text-slate-300 font-mono text-xs',
    badge: 'bg-slate-800 border-slate-600 text-slate-300 font-mono',
    iconColor: 'text-slate-400'
  }
};

// Render text with interactive redaction blocks
export const ScpReader: React.FC<ScpReaderProps> = ({
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
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'roleplay' | 'raw'>('roleplay');
  const segmentRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Centered view scrolling for karaoke tracking
  const scrollToActiveSegment = (index: number, smooth: boolean = true) => {
    const el = segmentRefs.current[index];
    if (!el) return;

    // Header is sticky ~95px, bottom audio player is fixed ~85px
    const headerOffset = 110;
    const playerOffset = 95;
    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const elementTopInDoc = rect.top + scrollTop;

    // Center element in visible viewport area
    const availableHeight = window.innerHeight - headerOffset - playerOffset;
    const targetTop = elementTopInDoc - headerOffset - Math.max(20, (availableHeight - rect.height) / 2);

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  // Auto-scroll when active segment changes
  useEffect(() => {
    if (!autoScroll) return;
    const timer = setTimeout(() => {
      scrollToActiveSegment(currentSegmentIndex, true);
    }, 50);
    return () => clearTimeout(timer);
  }, [currentSegmentIndex, autoScroll]);

  const isKeterOrEuclid = scp.objectClass === 'Keter' || scp.objectClass === 'Euclid' || scp.objectClass === 'Apollyon';

  return (
    <div className="max-w-4xl mx-auto pb-36 pt-2 px-3 sm:px-6 font-sans">
      {/* Top SCiPNET Terminal Action Bar */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-scp-border font-mono text-xs">
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onBack();
          }}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white bg-scp-surface hover:bg-scp-card px-3 py-1.5 rounded-lg border border-scp-border transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>[ RETOUR AU CATALOGUE ]</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Toggle Favorite */}
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onToggleFavorite();
            }}
            title={isFavorite ? 'Retirer du dossier personnel' : 'Archiver dans les favoris'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              isFavorite
                ? 'bg-amber-950/70 border-amber-600/70 text-amber-400 font-bold'
                : 'bg-scp-surface border-scp-border text-slate-400 hover:text-amber-400'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? '[ CLASSÉ FAVORI ]' : '[ CLASSER ]'}</span>
          </button>

          {/* Original Wiki Link */}
          <a
            href={scp.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Consulter l'archive originale Wikidot"
            className="flex items-center gap-1.5 bg-scp-surface hover:bg-scp-card text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-scp-border transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">[ WIKIDOT ORIGINE ]</span>
          </a>
        </div>
      </div>

      {/* Official ACS (Anomaly Classification System) Dossier Header */}
      <div className={`relative bg-scp-surface border-2 rounded-2xl mb-6 shadow-2xl overflow-hidden scipnet-box ${
        scp.objectClass === 'Keter' || scp.objectClass === 'Apollyon'
          ? 'border-red-600/80 hazard-stripes'
          : scp.objectClass === 'Euclid'
          ? 'border-amber-600/80 hazard-stripes-amber'
          : 'border-emerald-600/80'
      }`}>
        {/* Classified Watermark Background Stamp */}
        <div className="absolute right-4 bottom-2 opacity-15 pointer-events-none select-none font-mono font-black text-7xl sm:text-8xl rotate-[-10deg] tracking-widest text-red-500">
          TOP SECRET
        </div>

        {/* ACS System Top Bar */}
        <div className="bg-slate-950/90 border-b border-scp-border/80 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-red-400 font-bold tracking-wider">
              DOSSIER CLASSIFIÉ RAISA // SEC-02
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-300 hidden sm:inline">NIVEAU D'ACCRÉDITATION : 4 (SECRET DÉFENSE)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">CONFINEMENT MAINTENU // SITE-19</span>
          </div>
        </div>

        {/* ACS Content Body */}
        <div className="p-5 sm:p-7 relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-wider terminal-glow-red">
                  {scp.scpNumber}
                </span>

                {/* ACS Containment Class Badge */}
                <span className={`text-xs font-mono font-black uppercase px-3 py-1 rounded border tracking-wider flex items-center gap-1.5 shadow ${
                  scp.objectClass === 'Keter' || scp.objectClass === 'Apollyon'
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : scp.objectClass === 'Euclid'
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                }`}>
                  <Biohazard className="w-3.5 h-3.5" />
                  <span>CLASSE : {scp.objectClass}</span>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-mono text-slate-100 mb-1">
                {scp.alternateTitle ? scp.alternateTitle : scp.title}
              </h2>
            </div>

            {/* Play Button */}
            <button
              onClick={() => {
                if (isPlaying) {
                  speechEngine.pause();
                } else {
                  speechEngine.play();
                }
              }}
              className="flex items-center gap-2.5 bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm font-mono font-bold px-5 py-3 rounded-xl shadow-xl shadow-red-950/60 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>METTRE EN PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                  <span>LANCER L'ÉCOUTE ROLEPLAY</span>
                </>
              )}
            </button>
          </div>

          <BandeauEntites slug={scp.slug} languageCode={languageCode} onOuvrirEntite={onOuvrirEntite} />

          {/* Tags */}
          {scp.tags && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-scp-border/60">
              {scp.tags.map(t => (
                <span key={t} className="text-[10px] font-mono bg-slate-900/80 border border-scp-border px-2 py-0.5 rounded text-slate-400">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Auto-Scroll Header */}
      <div className="flex items-center justify-between gap-2 mb-4 border-b border-scp-border pb-2 font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('roleplay')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              activeTab === 'roleplay'
                ? 'bg-red-950/70 border-red-700/70 text-red-300 font-bold shadow'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>Transcription Multi-Voix ({segments.length} répliques)</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              activeTab === 'raw'
                ? 'bg-red-950/70 border-red-700/70 text-red-300 font-bold shadow'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Archive Brute</span>
          </button>
        </div>

        {activeTab === 'roleplay' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                scrollToActiveSegment(currentSegmentIndex, true);
              }}
              title="Recentrer immédiatement l'affichage sur la réplique active"
              className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-red-300 bg-slate-900/90 border border-slate-700/80 hover:border-red-600/70 px-2 py-1 rounded-lg transition-colors shadow-sm"
            >
              <Activity className="w-3 h-3 text-red-400 shrink-0" />
              <span>[ RECENTRER ]</span>
            </button>

            <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 cursor-pointer select-none bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg hover:border-slate-500 transition-colors">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-red-600 rounded cursor-pointer w-3.5 h-3.5"
              />
              <span>{autoScroll ? 'SUIVI : ON' : 'SUIVI : OFF'}</span>
            </label>
          </div>
        )}
      </div>

      {/* File « À SUIVRE » : les liens mis de côté sans couper l'écoute. */}
      {readingQueue && onOpenLink && onRemoveFromQueue && onClearQueue && (
        <ReadingQueue
          queue={readingQueue}
          onOpen={onOpenLink}
          onRemove={onRemoveFromQueue}
          onClear={onClearQueue}
        />
      )}

      {/* Tab 1: Roleplay Script View */}
      {activeTab === 'roleplay' ? (
        <div className="space-y-3 scp-document">
          {segments.map((segment, index) => {
            const isCurrent = index === currentSegmentIndex;
            const isActivelyPlaying = isCurrent && isPlaying;
            const style = ROLE_STYLES[segment.role] || ROLE_STYLES.narrator;

            // Render log markers distinctly
            if (segment.isLogMarker) {
              return (
                <div
                  key={segment.id}
                  ref={(el) => { segmentRefs.current[index] = el; }}
                  onClick={() => onPlaySegment(index)}
                  className={`cursor-pointer text-center py-2.5 px-4 my-4 rounded-xl border transition-all font-mono text-xs tracking-wider flex items-center justify-center gap-2 ${
                    isCurrent 
                      ? 'bg-red-950/90 border-red-500 text-red-200 ring-2 ring-red-500/70 scale-[1.015] shadow-xl shadow-red-950/60' 
                      : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 text-red-400 ${isActivelyPlaying ? 'animate-pulse' : ''}`} />
                  <span className="font-bold tracking-widest">{segment.text.toUpperCase()}</span>
                  {isCurrent && !isPlaying && (
                    <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-600/70 px-1.5 py-0.2 rounded ml-2">
                      EN PAUSE
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div
                key={segment.id}
                ref={(el) => { segmentRefs.current[index] = el; }}
                onClick={() => {
                  sfx.playTerminalBeep();
                  onPlaySegment(index);
                }}
                className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  segment.links && segment.links.length > 0 ? 'segment-has-link ' : ''
                }${
                  isCurrent
                    ? isActivelyPlaying
                      ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/80 shadow-2xl shadow-red-950/90 scale-[1.015]'
                      : 'bg-amber-950/25 border-amber-500/80 ring-1 ring-amber-500/60 shadow-lg shadow-amber-950/50 scale-[1.005]'
                    : `${style.bg} ${style.border} hover:border-slate-500`
                }`}
              >
                {/* Speaker Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${
                      isCurrent ? 'bg-black/90 border-red-500 text-white shadow' : style.badge
                    }`}>
                      <User className="w-3 h-3" />
                      <span className="font-bold">{segment.speaker}</span>
                      {segment.gender === 'female' && (
                        <span className="text-[11px] font-black text-pink-400 ml-0.5" title="Scientifique / Personnage Féminin">♀</span>
                      )}
                      {segment.gender === 'male' && (
                        <span className="text-[11px] font-black text-blue-400 ml-0.5" title="Scientifique / Personnage Masculin">♂</span>
                      )}
                    </span>

                    {/* Role & Voice Signature badges */}
                    {segment.voiceSignature && (
                      <span className="hidden sm:inline text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40" title={`Timbre unique : ${segment.voiceSignature.pitch}`}>
                        Voix unique
                      </span>
                    )}

                    {segment.isHeader && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800/80 border border-slate-600/70 text-slate-300 font-semibold">
                        Protocole
                      </span>
                    )}

                    {isActivelyPlaying && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 font-bold">
                        <span className="visualizer-bar" />
                        <span className="visualizer-bar" />
                        <span className="visualizer-bar" />
                        <span className="ml-1 tracking-wide animate-pulse">TRANSMISSION ACTIVE</span>
                      </div>
                    )}

                    {isCurrent && !isPlaying && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.2 rounded border border-amber-600/60">
                        <span>CURSEUR ACTIF // EN PAUSE</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                    #{segment.id}
                  </span>
                </div>

                {/* Spoken Line & Stage Directions */}
                <div className="text-sm leading-relaxed">
                  {segment.stageDirections && segment.stageDirections.length > 0 && (
                    <div className="text-xs italic text-slate-400 mb-1 font-mono">
                      {segment.stageDirections.map((d, i) => (
                        <span key={i} className="mr-2 text-amber-300/80">
                          ({d})
                        </span>
                      ))}
                    </div>
                  )}
                  <p className={`${style.text} ${isCurrent ? 'font-medium text-white' : ''}`}>
                    <SpokenLine
                      text={segment.text}
                      links={segment.links}
                      activeWordIndex={isCurrent ? activeWordIndex : -1}
                      onEnqueueLink={onEnqueueLink}
                      onOpenLink={onOpenLink}
                    />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tab 2: Raw Archive Text */
        <div className="bg-scp-surface border border-scp-border rounded-xl p-5 sm:p-7 font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
          {scp.textContent}
        </div>
      )}
    </div>
  );
};
