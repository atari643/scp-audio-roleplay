import React, { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  X,
  Terminal,
  Shield,
  FolderOpen,
  Building2,
  User,
  Radio,
  ChevronDown,
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
import { styleBadgeClasse } from './classification';
import { useT } from '../i18n';

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
  /** Parcours par série : c'est ce qui donne accès au corpus entier. */
  availableSeries?: ScpSeriesInfo[];
  selectedSeries?: string | null;
  onSelectSeries?: (seriesId: string | null) => void;
  selectedSubRange?: string | null;
  onSelectSubRange?: (subRangeId: string | null) => void;
}

const CLASSES: Array<{ label: string; value: ObjectClass | 'ALL' }> = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Safe', value: 'Safe' },
  { label: 'Euclid', value: 'Euclid' },
  { label: 'Keter', value: 'Keter' },
  { label: 'Thaumiel', value: 'Thaumiel' },
  { label: 'Apollyon', value: 'Apollyon' }
];

type OngletRapide = 'none' | 'departments' | 'researchers' | 'goi' | 'sites';

/**
 * Les quatre catégories de l'accès rapide.
 *
 * L'ancienne version leur donnait une teinte chacune — violet, cyan, rouge, bleu
 * — et un tiroir bordé de cette même teinte : quatre accents pour quatre boutons
 * qui font exactement la même chose. Ils partagent désormais un traitement unique,
 * l'icône suffisant à les distinguer.
 */
const CATEGORIES: Array<{
  cle: Exclude<OngletRapide, 'none'>;
  libelle: string;
  titre: string;
  icone: React.ComponentType<{ className?: string }>;
  entites: ScpEntity[];
}> = [
  {
    cle: 'departments',
    libelle: 'Départements',
    titre: 'Départements de la Fondation',
    icone: Building2,
    entites: SCP_DEPARTMENTS
  },
  {
    cle: 'researchers',
    libelle: 'Chercheurs',
    titre: 'Personnel de recherche',
    icone: User,
    entites: SCP_RESEARCHERS
  },
  {
    cle: 'goi',
    libelle: 'Factions',
    titre: "Groupes d'intérêt et factions paranormales",
    icone: Radio,
    entites: SCP_GOI
  },
  {
    cle: 'sites',
    libelle: 'Sites',
    titre: 'Sites et zones de confinement',
    icone: Shield,
    entites: SCP_SITES
  }
];

/** Pastille de filtre : un seul gabarit, deux états. */
const PASTILLE =
  'shrink-0 whitespace-nowrap px-2.5 py-1 rounded-sm font-mono text-xs uppercase ' +
  'tracking-technique border transition-colors';
const PASTILLE_REPOS = 'bg-surface-2 text-texte-attenue border-bordure hover:text-texte hover:border-bordure-forte';
const PASTILLE_ACTIVE = 'bg-surface-4 text-texte border-accent-texte shadow-relief';

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
  const t = useT();
  const [inputVal, setInputVal] = useState(activeQuery);
  const [activeQuickTab, setActiveQuickTab] = useState<OngletRapide>('none');

  // Synchronisation quand la requête change d'ailleurs (clic sur une entité).
  useEffect(() => {
    setInputVal(activeQuery);
  }, [activeQuery]);

  // Recherche au fil de la frappe, amortie.
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
    // Un clic ouvre la fiche, qui montre les vrais dossiers de l'entité.
    // Le repli, lui, FILTRE le catalogue au lieu de lancer une recherche plein
    // texte sur un mot-clé : « clef » rendait les dossiers qui CONTIENNENT le mot
    // clef, pas ceux du Dr Clef.
    if (onSelectEntity) {
      onSelectEntity(entity);
    } else if (onFiltrerParEntite && entity.entiteId) {
      onFiltrerParEntite(entity.entiteId);
    } else {
      onSearch(entity.queryKeywords[0] || entity.name);
    }
  };

  const categorieOuverte = CATEGORIES.find((c) => c.cle === activeQuickTab);
  const serieActive = (availableSeries ?? SCP_SERIES).find((s) => s.id === selectedSeries);

  return (
    <div className="space-y-2.5 mb-6">
      {entiteFiltreNom && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-surface-2 border-l-[3px] border border-bordure border-l-accent-texte font-mono text-xs">
          <span className="text-texte-second truncate">
            Dossiers rattachés à <strong className="text-texte font-semibold">{entiteFiltreNom}</strong>
          </span>
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onFiltrerParEntite?.(null);
            }}
            className="shrink-0 inline-flex items-center gap-1 h-8 px-2 rounded-sm text-texte-attenue hover:text-texte transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Retirer
          </button>
        </div>
      )}

      {/* Ligne de commande de l'archive */}
      <form onSubmit={handleSubmit} className="relative flex items-center scipnet-box overflow-hidden">
        <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
          <Terminal className="w-4 h-4 text-accent-texte" aria-hidden="true" />
          <span className="font-mono text-xs text-texte-attenue hidden sm:inline">SCIPNET&gt;</span>
        </div>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={t('recherche.placeholder')}
          aria-label={t('recherche.aria')}
          className="w-full bg-transparent border-none pl-10 sm:pl-24 pr-32 py-3 font-mono text-sm text-texte placeholder:text-texte-attenue focus:outline-none"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5 px-2 font-mono text-xs text-texte-attenue">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">{t('recherche.indexation')}</span>
            </span>
          ) : (
            <>
              {inputVal && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label={t('recherche.effacer')}
                  className="w-8 h-8 flex items-center justify-center rounded-sm text-texte-attenue hover:text-texte hover:bg-surface-3 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-accent hover:bg-accent-texte text-texte font-mono text-xs font-semibold transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('recherche.bouton')}</span>
              </button>
            </>
          )}
        </div>
      </form>

      {/* Accès rapide au répertoire */}
      <div className="flex flex-wrap items-center gap-1.5 bg-surface-1 border border-bordure rounded px-2 py-1.5">
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onOpenExplorer();
          }}
          title={t('recherche.explorateurInfo')}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm bg-surface-2 border border-bordure font-mono text-xs text-texte-second hover:bg-surface-3 hover:text-texte hover:border-bordure-forte transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{t('entete.explorateur')}</span>
        </button>

        <span className="w-px h-5 bg-bordure hidden sm:block" aria-hidden="true" />

        {CATEGORIES.map(({ cle, libelle, icone: Icone }) => {
          const ouvert = activeQuickTab === cle;
          return (
            <button
              key={cle}
              onClick={() => {
                sfx.playTerminalBeep();
                setActiveQuickTab(ouvert ? 'none' : cle);
              }}
              aria-expanded={ouvert}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm font-mono text-xs border transition-colors ${
                ouvert
                  ? 'bg-surface-4 text-texte border-accent-texte shadow-relief'
                  : 'text-texte-attenue border-transparent hover:text-texte hover:bg-surface-2'
              }`}
            >
              <Icone className="w-3.5 h-3.5" />
              <span>{libelle}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${ouvert ? 'rotate-180' : ''}`} />
            </button>
          );
        })}

        {activeQuery && (
          <span className="ml-auto inline-flex items-center gap-1.5 h-7 px-2 rounded-sm border border-accent-texte/50 font-mono text-xs text-accent-texte">
            <span className="truncate max-w-[16ch]">« {activeQuery} »</span>
            <button onClick={handleClear} aria-label={t('recherche.effacerFiltre')} className="hover:text-texte transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        )}
      </div>

      {/* Tiroir de la catégorie ouverte — un seul gabarit pour les quatre */}
      {categorieOuverte && (
        <div className="bg-surface-1 border border-bordure rounded p-3 animate-fade-in">
          <p className="font-mono text-xs uppercase tracking-technique text-texte-attenue border-b border-bordure-faible pb-1.5 mb-2">
            {categorieOuverte.titre}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {categorieOuverte.entites.map((entite) => (
              <button
                key={entite.id}
                onClick={() => handleEntityClick(entite)}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm bg-surface-2 border border-bordure font-mono text-xs text-texte-second hover:bg-surface-3 hover:text-texte hover:border-bordure-forte transition-colors"
              >
                <span className="text-texte-attenue">{entite.code}</span>
                <span>{entite.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Séries : l'accès au corpus entier */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-bordure-faible pb-2">
        <span className="shrink-0 inline-flex items-center gap-1.5 mr-1 font-mono text-xs uppercase tracking-technique text-texte-attenue">
          <Database className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t('recherche.series')}</span>
        </span>

        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onSearch('');
            onSelectSeries?.(null);
          }}
          className={`${PASTILLE} ${!activeQuery && !selectedSeries ? PASTILLE_ACTIVE : PASTILLE_REPOS}`}
        >
          Tout le registre
        </button>

        {(availableSeries ?? SCP_SERIES).map((ser) => {
          const isSelected = selectedSeries === ser.id;
          return (
            <button
              key={ser.id}
              onClick={() => {
                sfx.playTerminalBeep();
                // Le parcours passe par la requête de série dédiée plutôt que par
                // le champ de recherche, qui plafonnait les résultats à 48.
                onSearch('');
                onSelectSeries?.(isSelected ? null : ser.id);
              }}
              onMouseEnter={() => prefetchScpSeries(ser.id, languageCode)}
              className={`${PASTILLE} ${isSelected ? PASTILLE_ACTIVE : PASTILLE_REPOS}`}
              title={ser.range}
            >
              {ser.name}
            </button>
          );
        })}
      </div>

      {/* Tranches de la série active */}
      {serieActive?.subRanges && serieActive.subRanges.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-bordure-faible pb-2 animate-fade-in">
          <span className="shrink-0 mr-1 font-mono text-xs uppercase tracking-technique text-texte-attenue">
            Tranche
          </span>
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onSelectSubRange?.(null);
            }}
            className={`${PASTILLE} ${!selectedSubRange ? PASTILLE_ACTIVE : PASTILLE_REPOS}`}
          >
            Toutes ({serieActive.totalEstimate})
          </button>
          {serieActive.subRanges.map((sub) => {
            const isSubSelected = selectedSubRange === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  sfx.playTerminalBeep();
                  onSelectSubRange?.(isSubSelected ? null : sub.id);
                }}
                className={`${PASTILLE} ${isSubSelected ? PASTILLE_ACTIVE : PASTILLE_REPOS}`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Classe d'objet — le seul filtre qui a le droit à ses couleurs, parce
          qu'elles y sont l'information elle-même. */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="shrink-0 inline-flex items-center gap-1.5 mr-1 font-mono text-xs uppercase tracking-technique text-texte-attenue">
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t('recherche.classe')}</span>
        </span>

        {CLASSES.map((cls) => {
          const isSelected = selectedClass === cls.value;
          const estTous = cls.value === 'ALL';
          return (
            <button
              key={cls.value}
              onClick={() => {
                sfx.playTerminalBeep();
                onSelectClass(cls.value);
              }}
              aria-pressed={isSelected}
              className={`${PASTILLE} ${isSelected && estTous ? PASTILLE_ACTIVE : !isSelected ? PASTILLE_REPOS : 'bg-surface-3'}`}
              style={
                isSelected && !estTous ? styleBadgeClasse(cls.value as ObjectClass) : undefined
              }
            >
              {cls.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
