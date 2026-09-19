import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Library } from 'lucide-react';
import { ObjectClass } from '../../types/scp';
import { sfx } from '../../services/sfxService';
import { ScpSeriesInfo } from '../../data/seriesData';
import { prefetchScpSeries } from '../../services/queryClient';
import { CleTraduction, useT } from '../../i18n';

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

const CLASSES: Array<{ cle: CleTraduction; value: ObjectClass | 'ALL'; color: string }> = [
  { cle: 'classe.tous', value: 'ALL', color: 'border-bordure text-texte-second' },
  { cle: 'classe.safe', value: 'Safe', color: 'border-classe-safe text-classe-safe' },
  { cle: 'classe.euclid', value: 'Euclid', color: 'border-classe-euclid text-classe-euclid' },
  { cle: 'classe.keter', value: 'Keter', color: 'border-accent-texte text-accent-texte' },
  { cle: 'classe.thaumiel', value: 'Thaumiel', color: 'border-classe-thaumiel text-classe-thaumiel' },
  { cle: 'classe.apollyon', value: 'Apollyon', color: 'border-accent-texte text-accent-texte' },
  { cle: 'filtre.neutralise', value: 'Neutralized', color: 'border-bordure-forte text-texte-attenue' }
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
  const t = useT();
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
        <div className="flex items-center justify-between gap-2 px-3 py-2 mb-2 rounded-lg bg-surface-3/40 border border-accent-texte/60 font-mono text-xs">
          <span className="text-accent-texte truncate">{t('lecteurMobile.dossiersDe')}<strong className="text-texte">{entiteFiltreNom}</strong></span>
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onFiltrerParEntite?.(null);
            }}
            className="shrink-0 min-h-[44px] px-2 text-accent-texte underline"
          >
            retirer
          </button>
        </div>
      )}
      {/* Mobile Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-texte-attenue pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          placeholder={t('lecteurMobile.rechercher')}
          /* 16 px minimum : en dessous, Safari iOS zoome tout seul à la prise de focus
             et l'utilisateur se retrouve dans une page agrandie dont il doit sortir. */
          className="w-full bg-surface-1/90 border border-bordure/80 rounded-xl pl-9 pr-12 py-2.5 text-[16px] leading-tight font-mono text-texte placeholder:text-texte-attenue placeholder:text-xs focus:outline-none focus:border-accent-texte transition-colors shadow-inner"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-0 flex h-11 w-11 items-center justify-center text-texte-attenue hover:text-texte"
            title={t('recherche.effacer')}
            aria-label={t('recherche.effacer')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Scrolling Object Class Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        <span className="text-xs text-texte-attenue font-bold uppercase shrink-0 flex items-center gap-1 pl-0.5">
          <Filter className="w-3 h-3 text-accent-texte" />
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
              className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                isSelected
                  ? 'bg-surface-3 border-accent-texte text-texte shadow-sm'
                  : `bg-surface-1/80 ${cls.color} opacity-80 hover:opacity-100`
              }`}
            >
              {t(cls.cle)}
            </button>
          );
        })}
      </div>

      {/* Horizontal Scrolling Series Pills — access to the full corpus */}
      {availableSeries && availableSeries.length > 0 && onSelectSeries && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
          <span className="text-xs text-texte-attenue font-bold uppercase shrink-0 flex items-center gap-1 pl-0.5">
            <Library className="w-3 h-3 text-role-agent" />
            SÉRIE :
          </span>
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onSelectSeries(null);
            }}
            className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
              !selectedSeries
                ? 'bg-surface-3 border-role-agent text-texte shadow-sm'
                : 'bg-surface-1/80 border-bordure text-texte-second opacity-80'
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
                className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-surface-3 border-role-agent text-texte shadow-sm'
                    : 'bg-surface-1/80 border-bordure text-texte-second opacity-80'
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono bg-surface-3/20 p-1.5 rounded-lg border border-role-agent/40">
            <span className="text-xs text-role-agent font-bold uppercase shrink-0">
              TRANCHE :
            </span>
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onSelectSubRange?.(null);
              }}
              className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold border transition-all active:scale-95 ${
                !selectedSubRange
                  ? 'bg-surface-3/90 border-role-agent text-role-agent shadow-sm'
                  : 'bg-surface-1/80 border-bordure text-texte-attenue'
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
                  className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold border transition-all active:scale-95 ${
                    isSubSelected
                      ? 'bg-surface-3/90 border-role-agent text-role-agent shadow-sm'
                      : 'bg-surface-1/80 border-bordure text-texte-attenue'
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
