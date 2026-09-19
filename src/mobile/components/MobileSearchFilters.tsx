import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Library } from 'lucide-react';
import { ObjectClass } from '../../types/scp';
import { sfx } from '../../services/sfxService';
import { ScpSeriesInfo } from '../../data/seriesData';
import { prefetchScpSeries } from '../../services/queryClient';

interface MobileSearchFiltersProps {
  onSearch: (query: string) => void;
  selectedClass: ObjectClass | 'ALL';
  languageCode?: string;
  onSelectClass: (cls: ObjectClass | 'ALL') => void;
  isLoading: boolean;
  activeQuery: string;
  /** Series browsing — lets the catalogue reach the whole corpus, not just the curated list. */
  availableSeries?: ScpSeriesInfo[];
  selectedSeries?: string | null;
  onSelectSeries?: (seriesId: string | null) => void;
  selectedSubRange?: string | null;
  onSelectSubRange?: (subRangeId: string | null) => void;
  /** Filtre le catalogue sur les dossiers d'une entité ; `null` pour lever le filtre. */
  onFiltrerParEntite?: (id: string | null) => void;
  /** L'entité filtrée, pour l'afficher et pouvoir la retirer. */
  entiteFiltreNom?: string | null;
}

const CLASSES: Array<{ label: string; value: ObjectClass | 'ALL'; color: string }> = [
  { label: 'TOUS', value: 'ALL', color: 'border-slate-700 text-slate-300' },
  { label: 'SÛR', value: 'Safe', color: 'border-emerald-700 text-emerald-400' },
  { label: 'EUCLIDE', value: 'Euclid', color: 'border-amber-700 text-amber-400' },
  { label: 'KETER', value: 'Keter', color: 'border-red-700 text-red-400' },
  { label: 'THAUMIEL', value: 'Thaumiel', color: 'border-purple-700 text-purple-400' },
  { label: 'APOLLYON', value: 'Apollyon', color: 'border-rose-700 text-rose-400' },
  { label: 'NEUTRALISÉ', value: 'Neutralized', color: 'border-slate-600 text-slate-400' }
];

export const MobileSearchFilters: React.FC<MobileSearchFiltersProps> = ({
  onSearch,
  selectedClass,
  onSelectClass,
  isLoading,
  activeQuery,
  availableSeries,
  selectedSeries,
  onSelectSeries,
  selectedSubRange,
  onSelectSubRange,
  onFiltrerParEntite,
  entiteFiltreNom,
  languageCode = 'fr'
}) => {
  const [localQuery, setLocalQuery] = useState(activeQuery);

  useEffect(() => {
    setLocalQuery(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    const trimmed = localQuery.trim();
    if (trimmed === activeQuery) return;
    const timer = setTimeout(() => {
      onSearch(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, activeQuery, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleClear = () => {
    sfx.playTerminalBeep();
    setLocalQuery('');
    onSearch('');
  };

  return (
    <div className="space-y-2.5 mb-4">
      {entiteFiltreNom && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 mb-2 rounded-lg bg-red-950/40 border border-red-800/60 font-mono text-[11px]">
          <span className="text-red-200 truncate">Dossiers de <strong className="text-white">{entiteFiltreNom}</strong></span>
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onFiltrerParEntite?.(null);
            }}
            className="shrink-0 min-h-[44px] px-2 text-red-300 underline"
          >
            retirer
          </button>
        </div>
      )}
      {/* Mobile Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-500 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          placeholder="Rechercher un SCP (ex: 049, 173, statue, keter)..."
          className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-red-600 transition-colors shadow-inner"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-slate-400 hover:text-white"
            title="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Scrolling Object Class Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0 flex items-center gap-1 pl-0.5">
          <Filter className="w-3 h-3 text-red-500" />
          CLASSE :
        </span>
        {CLASSES.map((cls) => {
          const isSelected = selectedClass === cls.value;
          return (
            <button
              key={cls.value}
              onClick={() => {
                sfx.playTerminalBeep();
                onSelectClass(cls.value);
              }}
              className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all active:scale-95 ${
                isSelected
                  ? 'bg-red-950 border-red-600 text-white shadow-sm'
                  : `bg-slate-900/80 ${cls.color} opacity-80 hover:opacity-100`
              }`}
            >
              {cls.label}
            </button>
          );
        })}
      </div>

      {/* Horizontal Scrolling Series Pills — access to the full corpus */}
      {availableSeries && availableSeries.length > 0 && onSelectSeries && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0 flex items-center gap-1 pl-0.5">
            <Library className="w-3 h-3 text-cyan-500" />
            SÉRIE :
          </span>
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onSelectSeries(null);
            }}
            className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all active:scale-95 ${
              !selectedSeries
                ? 'bg-cyan-950 border-cyan-600 text-white shadow-sm'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 opacity-80'
            }`}
          >
            EMBLÉMATIQUES
          </button>
          {availableSeries.map((series) => {
            const isSelected = selectedSeries === series.id;
            return (
              <button
                key={series.id}
                onMouseEnter={() => prefetchScpSeries(series.id, languageCode)}
                onTouchStart={() => prefetchScpSeries(series.id, languageCode)}
                onClick={() => {
                  sfx.playTerminalBeep();
                  onSelectSeries(isSelected ? null : series.id);
                }}
                className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-cyan-950 border-cyan-600 text-white shadow-sm'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 opacity-80'
                }`}
              >
                {series.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Tactile Sub-ranges Carousel for active series */}
      {(() => {
        const activeSeriesObj = (availableSeries ?? []).find((s) => s.id === selectedSeries);
        if (!activeSeriesObj?.subRanges || activeSeriesObj.subRanges.length === 0) return null;

        return (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono bg-cyan-950/20 p-1.5 rounded-lg border border-cyan-900/40">
            <span className="text-[10px] text-cyan-400 font-bold uppercase shrink-0">
              TRANCHE :
            </span>
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onSelectSubRange?.(null);
              }}
              className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border transition-all active:scale-95 ${
                !selectedSubRange
                  ? 'bg-cyan-900/90 border-cyan-500 text-cyan-100 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}
            >
              TOUT ({activeSeriesObj.totalEstimate})
            </button>
            {activeSeriesObj.subRanges.map((sub) => {
              const isSubSelected = selectedSubRange === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    sfx.playTerminalBeep();
                    onSelectSubRange?.(isSubSelected ? null : sub.id);
                  }}
                  className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border transition-all active:scale-95 ${
                    isSubSelected
                      ? 'bg-cyan-900/90 border-cyan-400 text-cyan-100 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};
