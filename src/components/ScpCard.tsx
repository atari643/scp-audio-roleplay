import React from 'react';
import { Headphones, Star, ArrowUpRight, ShieldAlert, FileText, Radio } from 'lucide-react';
import { ObjectClass, ScpItemSummary } from '../types/scp';
import { sfx } from '../services/sfxService';
import { prefetchScpDossier } from '../services/queryClient';
import { BadgesEcoute } from './BadgesEcoute';
import type { MetaDossier } from '../services/corpusFilters';

interface ScpCardProps {
  item: ScpItemSummary;
  isFavorite: boolean;
  languageCode: string;
  /** Métadonnées d'écoute issues de l'index ; `null` si le dossier n'y est pas. */
  meta?: MetaDossier | null;
  onSelect: (item: ScpItemSummary) => void;
  onToggleFavorite: (item: ScpItemSummary, e: React.MouseEvent) => void;
}

const CLASS_CONFIG: Record<ObjectClass, { bg: string; text: string; border: string; stamp: string; glow: string }> = {
  Safe: { 
    bg: 'bg-emerald-950/80', 
    text: 'text-emerald-400', 
    border: 'border-emerald-700/60',
    stamp: 'stamp-confidential',
    glow: 'hover:border-emerald-600/70 hover:shadow-emerald-950/40'
  },
  Euclid: { 
    bg: 'bg-amber-950/80', 
    text: 'text-amber-400', 
    border: 'border-amber-700/60',
    stamp: 'stamp-restricted',
    glow: 'hover:border-amber-600/70 hover:shadow-amber-950/40'
  },
  Keter: { 
    bg: 'bg-red-950/90', 
    text: 'text-red-400', 
    border: 'border-red-600/70',
    stamp: 'stamp-keter',
    glow: 'hover:border-red-500 hover:shadow-red-950/60'
  },
  Thaumiel: { 
    bg: 'bg-purple-950/80', 
    text: 'text-purple-400', 
    border: 'border-purple-700/60',
    stamp: 'stamp-top-secret',
    glow: 'hover:border-purple-600/70 hover:shadow-purple-950/40'
  },
  Apollyon: { 
    bg: 'bg-rose-950/95', 
    text: 'text-rose-300 font-bold', 
    border: 'border-rose-600/80',
    stamp: 'stamp-top-secret',
    glow: 'hover:border-rose-500 hover:shadow-rose-950/80'
  },
  Archon: { 
    bg: 'bg-indigo-950/80', 
    text: 'text-indigo-400', 
    border: 'border-indigo-700/60',
    stamp: 'stamp-restricted',
    glow: 'hover:border-indigo-600/70 hover:shadow-indigo-950/40'
  },
  Neutralized: { 
    bg: 'bg-slate-900', 
    text: 'text-slate-400', 
    border: 'border-slate-700/60',
    stamp: 'stamp-confidential',
    glow: 'hover:border-slate-500'
  },
  Decommissioned: { 
    bg: 'bg-stone-900', 
    text: 'text-stone-400', 
    border: 'border-stone-700/60',
    stamp: 'stamp-confidential',
    glow: 'hover:border-stone-500'
  },
  'Non assigné': { 
    bg: 'bg-slate-900/60', 
    text: 'text-slate-400', 
    border: 'border-slate-800',
    stamp: 'stamp-confidential',
    glow: 'hover:border-slate-600'
  }
};

export const ScpCard: React.FC<ScpCardProps> = ({
  item,
  isFavorite,
  languageCode,
  meta = null,
  onSelect,
  onToggleFavorite
}) => {
  const conf = CLASS_CONFIG[item.objectClass] || CLASS_CONFIG['Non assigné'];

  const handleMouseEnter = () => {
    prefetchScpDossier(item.slug, languageCode);
  };

  return (
    <div
      onClick={() => {
        sfx.playTerminalBeep();
        onSelect(item);
      }}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleMouseEnter}
      className={`group relative bg-scp-card/90 hover:bg-scp-cardHover border border-scp-border rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between overflow-hidden scipnet-box ${conf.glow}`}
    >
      {/* Background Watermark Stamp */}
      <div className="absolute -right-4 -bottom-3 opacity-15 pointer-events-none select-none font-mono font-black text-6xl tracking-widest uppercase rotate-[-12deg]">
        {item.objectClass.toUpperCase()}
      </div>

      <div>
        {/* Top Technical Metadata Bar */}
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-scp-border/80 text-[10px] font-mono text-slate-400">
          <span className="tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block group-hover:animate-ping" />
            DOC-ID // {item.scpNumber.toUpperCase()}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline">SECTEUR-19</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item, e);
              }}
              title={isFavorite ? 'Retirer des favoris' : 'Classer dans les favoris'}
              className={`p-1 rounded-md border transition-all ${
                isFavorite
                  ? 'bg-amber-950/70 border-amber-600/70 text-amber-400'
                  : 'bg-scp-surface border-scp-border text-slate-500 hover:text-amber-400 hover:border-amber-600/50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Item Number & Classification Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-lg font-black text-white group-hover:text-red-400 transition-colors tracking-wide flex items-center gap-2">
            <span>{item.scpNumber}</span>
          </span>

          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${conf.bg} ${conf.text} ${conf.border}`}>
            {item.objectClass}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-200 mb-2 line-clamp-1 group-hover:text-white transition-colors font-mono">
          {item.alternateTitle ? item.alternateTitle : item.title}
        </h3>

        {/* Snippet preview */}
        {item.snippet && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3 font-sans">
            {item.snippet}
          </p>
        )}
      </div>

      {/* Durée, type d'écoute, notoriété, note — issus de l'index de corpus. */}
      <BadgesEcoute meta={meta} rating={item.rating} className="pt-3" />

      {/* Card Footer: Action & Roleplay Badge */}
      <div className="pt-2 border-t border-scp-border/80 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[11px] text-red-400 font-semibold">
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>AUDIO ROLEPLAY</span>
        </div>

        <span className="text-[11px] text-slate-400 group-hover:text-white flex items-center gap-1 transition-colors">
          <span>Ouvrir dossier</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-red-400" />
        </span>
      </div>
    </div>
  );
};
