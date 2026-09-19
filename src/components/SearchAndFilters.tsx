import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Loader2, 
  X, 
  Terminal, 
  Shield, 
  FolderOpen, 
  Building2, 
  User, 
  Radio, 
  ChevronDown,
  Layers,
  Database
} from 'lucide-react';
import { ObjectClass } from '../types/scp';
import { sfx } from '../services/sfxService';
import { 
  SCP_DEPARTMENTS, 
  SCP_RESEARCHERS, 
  SCP_GOI, 
  SCP_SITES,
  ScpEntity 
} from '../data/departmentsData';
import { SCP_SERIES, ScpSeriesInfo } from '../data/seriesData';
import { prefetchScpSeries } from '../services/queryClient';

interface SearchAndFiltersProps {
  onSearch: (query: string) => void;
  selectedClass: ObjectClass | 'ALL';
  languageCode?: string;
  onSelectClass: (cls: ObjectClass | 'ALL') => void;
  isLoading: boolean;
  activeQuery: string;
  onOpenExplorer: () => void;
  onSelectEntity?: (entity: ScpEntity) => void;
  /** Filtre le catalogue sur les dossiers d'une entité ; `null` pour lever le filtre. */
  onFiltrerParEntite?: (id: string | null) => void;
  /** L'entité filtrée, pour l'afficher et pouvoir la retirer. */
  entiteFiltreNom?: string | null;
  /** Series browsing — lets the catalogue reach the whole corpus, not just the curated list. */
  availableSeries?: ScpSeriesInfo[];
  selectedSeries?: string | null;
  onSelectSeries?: (seriesId: string | null) => void;
  selectedSubRange?: string | null;
  onSelectSubRange?: (subRangeId: string | null) => void;
}

const CLASSES: Array<{ label: string; value: ObjectClass | 'ALL'; color: string; border: string; glow: string }> = [
  { label: 'TOUS LES DOSSIERS', value: 'ALL', color: 'bg-slate-900 text-slate-200', border: 'border-slate-700', glow: '' },
  { label: 'SÛR (SAFE)', value: 'Safe', color: 'bg-emerald-950/80 text-emerald-300', border: 'border-emerald-600/70', glow: 'shadow-emerald-950/40' },
  { label: 'EUCLIDE (EUCLID)', value: 'Euclid', color: 'bg-amber-950/80 text-amber-300', border: 'border-amber-600/70', glow: 'shadow-amber-950/40' },
  { label: 'KETER', value: 'Keter', color: 'bg-red-950/90 text-red-300', border: 'border-red-600/80', glow: 'shadow-red-950/50' },
  { label: 'THAUMIEL', value: 'Thaumiel', color: 'bg-purple-950/80 text-purple-300', border: 'border-purple-600/70', glow: 'shadow-purple-950/40' },
  { label: 'APOLLYON', value: 'Apollyon', color: 'bg-rose-950/90 text-rose-300', border: 'border-rose-600/80', glow: 'shadow-rose-950/60' }
];

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  onSearch,
  selectedClass,
  onSelectClass,
  isLoading,
  activeQuery,
  onOpenExplorer,
  onSelectEntity,
  availableSeries,
  selectedSeries,
  onSelectSeries,
  selectedSubRange,
  onSelectSubRange,
  onFiltrerParEntite,
  entiteFiltreNom,
  languageCode = 'fr'
}) => {
  const [inputVal, setInputVal] = useState(activeQuery);
  const [activeQuickTab, setActiveQuickTab] = useState<'none' | 'departments' | 'researchers' | 'goi' | 'sites'>('none');

  // Synchronize input when query changes externally (e.g. from entity detail click)
  useEffect(() => {
    setInputVal(activeQuery);
  }, [activeQuery]);

  // Live debounced search as user types for instantaneous, fluid response
  useEffect(() => {
    const trimmed = inputVal.trim();
    if (trimmed === activeQuery) return;

    const timer = setTimeout(() => {
      onSearch(trimmed);
    }, 280);

    return () => clearTimeout(timer);
  }, [inputVal, activeQuery, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playTerminalBeep();
    onSearch(inputVal.trim());
  };

  const handleClear = () => {
    sfx.playTerminalBeep();
    setInputVal('');
    onSearch('');
  };

  const handleEntityClick = (entity: ScpEntity) => {
    sfx.playTerminalBeep();
    // Un clic ouvre la fiche, qui montre désormais les vrais dossiers de l'entité.
    // Le repli, lui, FILTRE le catalogue au lieu de lancer une recherche plein texte
    // sur un mot-clé : « clef » rendait les dossiers qui CONTIENNENT le mot clef,
    // pas ceux du Dr Clef.
    if (onSelectEntity) {
      onSelectEntity(entity);
    } else if (onFiltrerParEntite && entity.entiteId) {
      onFiltrerParEntite(entity.entiteId);
    } else {
      onSearch(entity.queryKeywords[0] || entity.name);
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {entiteFiltreNom && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/60 font-mono text-xs">
          <span className="text-red-200 truncate">
            Dossiers rattachés à <strong className="text-white">{entiteFiltreNom}</strong>
          </span>
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onFiltrerParEntite?.(null);
            }}
            className="shrink-0 text-red-300 hover:text-white underline min-h-[32px] px-1"
          >
            retirer le filtre
          </button>
        </div>
      )}
      {/* Search Input Bar with SCiPNET Terminal Styling & Explorer Launcher */}
      <form onSubmit={handleSubmit} className="relative flex items-center scipnet-box rounded-xl overflow-hidden shadow-xl">
        <div className="absolute left-3.5 text-slate-400 flex items-center gap-1.5 pointer-events-none">
          <Terminal className="w-4 h-4 text-red-500" />
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">SCIPNET&gt;</span>
        </div>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="RECHERCHE ARCHIVE (Ex: 049, 173, 'Pataphysique', 'Dr Clef', 'CMO')..."
          className="w-full bg-scp-surface/95 border-none pl-12 sm:pl-28 pr-32 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-600/50 font-mono tracking-wide"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {isLoading ? (
            <div className="px-3 py-1 flex items-center gap-1.5 text-red-400 text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Indexation...</span>
            </div>
          ) : (
            <>
              {inputVal && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
                  title="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="bg-red-700 hover:bg-red-600 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition-all shadow flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">[ REQUÊTE ]</span>
              </button>
            </>
          )}
        </div>
      </form>

      {/* Retro 2000-2005 SCiPNET Entity Explorer Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs shadow-inner">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Explorer Launcher Button */}
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onOpenExplorer();
            }}
            className="win2k-btn px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1.5 shadow"
            title="Ouvrir l'Explorateur d'Entités SCiPNET (Départements, Chercheurs, GdI)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>🗀 EXPLORATEUR D'ENTITÉS</span>
          </button>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Quick Filter Buttons for Categories */}
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              setActiveQuickTab(activeQuickTab === 'departments' ? 'none' : 'departments');
            }}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
              activeQuickTab === 'departments'
                ? 'bg-purple-950 text-purple-300 border border-purple-600/80 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3 h-3 text-purple-400" />
            <span>Départements</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              setActiveQuickTab(activeQuickTab === 'researchers' ? 'none' : 'researchers');
            }}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
              activeQuickTab === 'researchers'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/80 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3 h-3 text-cyan-400" />
            <span>Chercheurs</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              setActiveQuickTab(activeQuickTab === 'goi' ? 'none' : 'goi');
            }}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
              activeQuickTab === 'goi'
                ? 'bg-red-950 text-red-300 border border-red-600/80 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3 h-3 text-red-400" />
            <span>Factions (GdI)</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              setActiveQuickTab(activeQuickTab === 'sites' ? 'none' : 'sites');
            }}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
              activeQuickTab === 'sites'
                ? 'bg-blue-950 text-blue-300 border border-blue-600/80 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3 h-3 text-blue-400" />
            <span>Sites ({SCP_SITES.length})</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </div>

        {/* Active Query Tag */}
        {activeQuery && (
          <div className="flex items-center gap-1 text-[10px] text-red-300 bg-red-950/80 border border-red-700/60 px-2 py-0.5 rounded">
            <span>FILTRE ACTIF : « {activeQuery} »</span>
            <button
              onClick={handleClear}
              className="ml-1 text-red-400 hover:text-white font-bold"
              title="Effacer le filtre"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Expanded Drawer for Quick Category Selection */}
      {activeQuickTab === 'departments' && (
        <div className="win2k-inset p-3 bg-slate-950/95 font-mono text-xs flex flex-wrap gap-2 animate-fade-in border border-purple-900/60">
          <div className="w-full text-[10px] text-purple-400 uppercase font-bold border-b border-purple-950 pb-1 mb-1">
            SÉLECTION RAPIDE DE DÉPARTEMENT :
          </div>
          {SCP_DEPARTMENTS.map((dept) => (
            <button
              key={dept.id}
              onClick={() => handleEntityClick(dept)}
              className="win2k-btn px-2.5 py-1 text-[11px] text-purple-200 hover:text-white flex items-center gap-1.5"
            >
              <span className="text-[10px] text-purple-400 font-bold">{dept.code}</span>
              <span>{dept.name}</span>
            </button>
          ))}
        </div>
      )}

      {activeQuickTab === 'researchers' && (
        <div className="win2k-inset p-3 bg-slate-950/95 font-mono text-xs flex flex-wrap gap-2 animate-fade-in border border-cyan-900/60">
          <div className="w-full text-[10px] text-cyan-400 uppercase font-bold border-b border-cyan-950 pb-1 mb-1">
            SÉLECTION RAPIDE DE CHERCHEUR DU SITE-19 :
          </div>
          {SCP_RESEARCHERS.map((res) => (
            <button
              key={res.id}
              onClick={() => handleEntityClick(res)}
              className="win2k-btn px-2.5 py-1 text-[11px] text-cyan-200 hover:text-white flex items-center gap-1.5"
            >
              <span className="text-[10px] text-cyan-400 font-bold">{res.code}</span>
              <span>{res.name}</span>
            </button>
          ))}
        </div>
      )}

      {activeQuickTab === 'goi' && (
        <div className="win2k-inset p-3 bg-slate-950/95 font-mono text-xs flex flex-wrap gap-2 animate-fade-in border border-red-900/60">
          <div className="w-full text-[10px] text-red-400 uppercase font-bold border-b border-red-950 pb-1 mb-1">
            GROUPES D'INTÉRÊT & FACTIONS PARANORMALES :
          </div>
          {SCP_GOI.map((goi) => (
            <button
              key={goi.id}
              onClick={() => handleEntityClick(goi)}
              className="win2k-btn px-2.5 py-1 text-[11px] text-red-200 hover:text-white flex items-center gap-1.5"
            >
              <span className="text-[10px] text-red-400 font-bold">{goi.code}</span>
              <span>{goi.name}</span>
            </button>
          ))}
        </div>
      )}

      {activeQuickTab === 'sites' && (
        <div className="win2k-inset p-3 bg-slate-950/95 font-mono text-xs flex flex-wrap gap-2 animate-fade-in border border-blue-900/60">
          <div className="w-full text-[10px] text-blue-400 uppercase font-bold border-b border-blue-950 pb-1 mb-1">
            SITES ET ZONES DE CONFINEMENT STRATÉGIQUES :
          </div>
          {SCP_SITES.map((site) => (
            <button
              key={site.id}
              onClick={() => handleEntityClick(site)}
              className="win2k-btn px-2.5 py-1 text-[11px] text-blue-200 hover:text-white flex items-center gap-1.5"
            >
              <span className="text-[10px] text-blue-400 font-bold">{site.code}</span>
              <span>{site.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 10 000 Dossiers - Series Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs border-b border-slate-800/80 pb-2 mb-1">
        <div className="flex items-center gap-1 text-amber-400 mr-1 pl-0.5 shrink-0">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 font-bold">
            10 000 SCP // SÉRIES :
          </span>
        </div>
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onSearch('');
            onSelectSeries?.(null);
          }}
          className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase border transition-all shrink-0 ${
            !activeQuery && !selectedSeries
              ? 'bg-amber-950 text-amber-200 border-amber-600/80 ring-1 ring-amber-500/30'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          Tout le Registre
        </button>
        {(availableSeries ?? SCP_SERIES).map((ser) => {
          const isSelected = selectedSeries === ser.id;
          return (
            <button
              key={ser.id}
              onClick={() => {
                sfx.playTerminalBeep();
                // Browse through the dedicated series query instead of stuffing the
                // prefix into the search box (which capped results at 48).
                onSearch('');
                onSelectSeries?.(isSelected ? null : ser.id);
              }}
              onMouseEnter={() => prefetchScpSeries(ser.id, languageCode)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border transition-all shrink-0 flex items-center gap-1 ${
                isSelected
                  ? 'bg-amber-950 text-amber-200 border-amber-500 ring-1 ring-amber-400/40'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
              }`}
              title={ser.range}
            >
              <span>{ser.name}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-ranges bar for granular navigation within the active series */}
      {(() => {
        const activeSeriesObj = (availableSeries ?? SCP_SERIES).find((s) => s.id === selectedSeries);
        if (!activeSeriesObj?.subRanges || activeSeriesObj.subRanges.length === 0) return null;

        return (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs border-b border-cyan-950/80 pb-2 mb-1 animate-fade-in bg-slate-950/40 px-2 py-1 rounded">
            <div className="flex items-center gap-1 text-cyan-400 mr-1 pl-0.5 shrink-0">
              <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                TRANCHE {activeSeriesObj.name.toUpperCase()} :
              </span>
            </div>
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onSelectSubRange?.(null);
              }}
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border transition-all shrink-0 ${
                !selectedSubRange
                  ? 'bg-cyan-950 text-cyan-200 border-cyan-500 ring-1 ring-cyan-400/40'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              Tous ({activeSeriesObj.totalEstimate})
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
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border transition-all shrink-0 ${
                    isSubSelected
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-400 ring-1 ring-cyan-300/50'
                      : 'bg-slate-900/40 text-slate-400 border-slate-800/80 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Object Class Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <div className="flex items-center gap-1 text-slate-400 mr-1 pl-0.5 shrink-0">
          <Shield className="w-3.5 h-3.5 text-red-500" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 hidden sm:inline">CLASSE ACS :</span>
        </div>
        {CLASSES.map((cls) => {
          const isSelected = selectedClass === cls.value;
          return (
            <button
              key={cls.value}
              onClick={() => {
                sfx.playTerminalBeep();
                onSelectClass(cls.value);
              }}
              className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold uppercase border tracking-wider whitespace-nowrap transition-all ${
                isSelected
                  ? `${cls.color} ${cls.border} ring-1 ring-white/20 shadow-md ${cls.glow}`
                  : 'bg-scp-surface/80 text-slate-400 border-scp-border hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {cls.label}
            </button>
          );
        })}
      </div>

    </div>
  );
};

