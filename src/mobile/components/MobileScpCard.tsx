import React from 'react';
import { Star, ChevronRight, Radio } from 'lucide-react';
import { ObjectClass, ScpItemSummary } from '../../types/scp';
import { BadgesEcoute } from '../../components/BadgesEcoute';
import type { MetaDossier } from '../../services/corpusFilters';
import { sfx } from '../../services/sfxService';

interface MobileScpCardProps {
  item: ScpItemSummary;
  isFavorite: boolean;
  onSelect: (item: ScpItemSummary) => void;
  onToggleFavorite: (item: ScpItemSummary) => void;
  /** Métadonnées d'écoute issues de l'index ; `null` si le dossier n'y est pas. */
  meta?: MetaDossier | null;
}

const CLASS_COLORS: Partial<Record<ObjectClass, { border: string; bg: string; text: string; badgeBg: string }>> = {
  Safe: {
    border: 'border-emerald-800/60',
    bg: 'from-emerald-950/20 to-slate-900/90',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
  },
  Euclid: {
    border: 'border-amber-800/60',
    bg: 'from-amber-950/20 to-slate-900/90',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-700'
  },
  Keter: {
    border: 'border-red-800/60',
    bg: 'from-red-950/25 to-slate-900/90',
    text: 'text-red-400',
    badgeBg: 'bg-red-950/80 text-red-300 border-red-700'
  },
  Thaumiel: {
    border: 'border-purple-800/60',
    bg: 'from-purple-950/20 to-slate-900/90',
    text: 'text-purple-400',
    badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-700'
  },
  Apollyon: {
    border: 'border-rose-700/80',
    bg: 'from-rose-950/30 to-slate-900/90',
    text: 'text-rose-400',
    badgeBg: 'bg-rose-950 text-rose-200 border-rose-600'
  },
  Neutralized: {
    border: 'border-slate-700',
    bg: 'from-slate-800/30 to-slate-900/90',
    text: 'text-slate-400',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-600'
  },
  Archon: {
    border: 'border-cyan-800/60',
    bg: 'from-cyan-950/20 to-slate-900/90',
    text: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
  }
};

const DEFAULT_STYLING = {
  border: 'border-slate-800',
  bg: 'from-slate-900 to-slate-900',
  text: 'text-slate-400',
  badgeBg: 'bg-slate-900 text-slate-400 border-slate-700'
};

export const MobileScpCard: React.FC<MobileScpCardProps> = ({
  item,
  isFavorite,
  meta = null,
  onSelect,
  onToggleFavorite
}) => {
  const styling = CLASS_COLORS[item.objectClass] || DEFAULT_STYLING;

  return (
    <div 
      onClick={() => {
        sfx.playTerminalBeep();
        onSelect(item);
      }}
      className={`relative rounded-xl border bg-gradient-to-br ${styling.bg} ${styling.border} p-3.5 shadow-md active:scale-[0.99] transition-all cursor-pointer overflow-hidden group`}
    >
      {/* Top row: Number, Class Badge & Favorite */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-white tracking-wider">
            {item.scpNumber || item.slug.toUpperCase()}
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${styling.badgeBg}`}>
            {item.objectClass}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sfx.playTerminalBeep();
            onToggleFavorite(item);
          }}
          className={`p-1.5 rounded-lg active:scale-90 transition-all ${
            isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
          }`}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-xs font-mono font-semibold text-slate-200 line-clamp-1 mb-1">
        {item.alternateTitle || item.title}
      </h3>

      {/* Snippet */}
      {item.snippet && (
        <p className="text-[11px] font-sans text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
          {item.snippet}
        </p>
      )}

      {/* Durée, type d'écoute, notoriété — issus de l'index de corpus. */}
      <BadgesEcoute meta={meta} rating={item.rating} compact className="mb-2" />

      {/* Bottom row: Tactical Access Tag & CTA */}
      <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-slate-800/80 text-slate-500">
        <div className="flex items-center gap-1 text-slate-400">
          <Radio className="w-3 h-3 text-red-500" />
          <span>AUDIO ROLEPLAY DISPO</span>
        </div>
        <div className="flex items-center gap-0.5 text-red-400 font-bold group-hover:text-red-300">
          <span>CONSULTER</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
