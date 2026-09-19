import React, { useEffect, useMemo, useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Search, 
  HardDrive, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  User, 
  Radio, 
  Shield, 
  Database, 
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { ScpEntity } from '../data/departmentsData';
import { SCP_SERIES, ScpSeriesInfo } from '../data/seriesData';
import { CATEGORIES, CategorieEntite } from '../types/entities';
import {
  chargerEntites,
  compterDossiers,
  dossiersDeLEntite,
  entitesParCategorie
} from '../services/entityService';
import { versScpEntity } from '../data/entityPresentation';
import { EntityIllustration } from './illustrations/ScpIllustrations';
import { sfx } from '../services/sfxService';
import { libelleCategorie } from '../i18n';
import { FenetreScipnet } from './FenetreScipnet';

interface ScipnetExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (entity: ScpEntity) => void;
  onSelectSeriesFilter?: (prefix: string) => void;
  onSelectSeries?: (seriesId: string) => void;
  onSelectScpSlug?: (slug: string) => void;
  /** Branche courante : l'index d'entités est construit par branche. */
  languageCode?: string;
}

type NodeSelection =
  | { type: 'root' }
  | { type: 'category'; category: CategorieEntite | 'series' }
  | { type: 'entity'; entity: ScpEntity }
  | { type: 'series'; series: ScpSeriesInfo };

/** Au-delà, l'arbre devient illisible : 406 installations n'y tiennent pas. */
const LIMITE_ARBRE = 24;

/**
 * Combien de dossiers d'une entité on affiche d'un coup.
 *
 * L'Insurrection du Chaos en compte 150 côté anglais, la Main du Serpent 120 : tout
 * rendre transformerait la fiche en mur. L'index les trie par note décroissante, donc
 * les premiers sont les plus lus.
 */
const LIMITE_DOSSIERS = 60;

/** Le nom de dossier fictif d'une catégorie, dans la barre d'adresse SCiPNET. */
function dossierDe(categorie: CategorieEntite): string {
  const rang = CATEGORIES.findIndex(c => c.id === categorie);
  const nom = CATEGORIES[rang]
    ? libelleCategorie(CATEGORIES[rang].id, true).toUpperCase().replace(/\s+/g, '_')
    : 'DIVERS';
  return `${String(rang + 1).padStart(2, '0')}_${nom}`;
}

/** L'habillage de chaque catégorie. Les couleurs reprennent celles déjà en place. */
const STYLE_CATEGORIE: Record<
  CategorieEntite,
  {
    icone: React.ComponentType<{ className?: string }>;
    texte: string;
    texteActif: string;
    fondActif: string;
    bordure: string;
    bordureArbre: string;
    fondSelection: string;
    bordureSelection: string;
    icôneCouleur: string;
  }
> = {
  departement: {
    icone: Building2, texte: 'text-classe-thaumiel', texteActif: 'text-classe-thaumiel',
    fondActif: 'bg-surface-3/90', bordure: 'border-classe-thaumiel', bordureArbre: 'border-classe-thaumiel/60',
    fondSelection: 'bg-surface-3/80', bordureSelection: 'border-classe-thaumiel', icôneCouleur: 'text-classe-thaumiel'
  },
  chercheur: {
    icone: User, texte: 'text-role-agent', texteActif: 'text-role-agent',
    fondActif: 'bg-surface-3/90', bordure: 'border-role-agent', bordureArbre: 'border-role-agent/60',
    fondSelection: 'bg-surface-3/80', bordureSelection: 'border-role-agent', icôneCouleur: 'text-role-agent'
  },
  faction: {
    icone: Radio, texte: 'text-classe-euclid', texteActif: 'text-classe-euclid',
    fondActif: 'bg-surface-3/90', bordure: 'border-classe-euclid', bordureArbre: 'border-classe-euclid/60',
    fondSelection: 'bg-surface-3/80', bordureSelection: 'border-classe-euclid', icôneCouleur: 'text-classe-euclid'
  },
  site: {
    icone: Shield, texte: 'text-classe-safe', texteActif: 'text-classe-safe',
    fondActif: 'bg-surface-3/90', bordure: 'border-classe-safe', bordureArbre: 'border-classe-safe/60',
    fondSelection: 'bg-surface-3/80', bordureSelection: 'border-classe-safe', icôneCouleur: 'text-classe-safe'
  },
  zone: {
    icone: ShieldAlert, texte: 'text-classe-safe', texteActif: 'text-classe-safe',
    fondActif: 'bg-surface-3/90', bordure: 'border-classe-safe', bordureArbre: 'border-classe-safe/60',
    fondSelection: 'bg-surface-3/80', bordureSelection: 'border-classe-safe', icôneCouleur: 'text-classe-safe'
  },
  fim: {
    icone: Layers, texte: 'text-accent-texte', texteActif: 'text-accent-texte',
    fondActif: 'bg-surface-3/90', bordure: 'border-accent-texte', bordureArbre: 'border-accent-texte/60',
    fondSelection: 'bg-surface-3/80', bordureSelection: 'border-accent-texte', icôneCouleur: 'text-accent-texte'
  },
  commandement: {
    icone: Database, texte: 'text-texte-second', texteActif: 'text-texte',
    fondActif: 'bg-surface-2/90', bordure: 'border-bordure-forte', bordureArbre: 'border-bordure/60',
    fondSelection: 'bg-surface-3/80', bordureSelection: 'border-bordure-forte', icôneCouleur: 'text-texte-second'
  }
};

export const ScipnetExplorerModal: React.FC<ScipnetExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
  onSelectSeriesFilter,
  onSelectSeries,
  onSelectScpSlug,
  languageCode = 'fr'
}) => {
  const [currentSelection, setCurrentSelection] = useState<NodeSelection>({ type: 'root' });
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [jumperVal, setJumperVal] = useState('');
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({
    departement: true,
    chercheur: true,
    faction: false,
    site: false,
    zone: false,
    fim: false,
    commandement: false,
    series: true
  });
  // L'index d'entités est chargé à la demande (voir `chargerEntites`). Ce compteur
  // force un rendu quand il arrive : sans lui la fenêtre resterait sur les listes
  // vides du premier rendu.
  const [indexPret, setIndexPret] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let vivant = true;
    chargerEntites(languageCode).then(() => {
      if (vivant) setIndexPret(n => n + 1);
    });
    return () => {
      vivant = false;
    };
  }, [isOpen, languageCode]);

  /**
   * Les entités d'une catégorie, adaptées à la forme que l'affichage attend.
   *
   * Le calcul dépend de `indexPret` : c'est ce qui rebâtit les listes une fois
   * l'index chargé. Les dossiers viennent de l'index, plus de `iconicScps`.
   */
  const parCategorie = useMemo(() => {
    const table = {} as Record<CategorieEntite, ScpEntity[]>;
    for (const cat of CATEGORIES) {
      table[cat.id] = entitesParCategorie(cat.id, languageCode).map(entite =>
        versScpEntity(entite, languageCode, dossiersDeLEntite(entite.id, languageCode))
      );
    }
    return table;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageCode, indexPret]);

  const entitesDe = (categorie: CategorieEntite): ScpEntity[] => parCategorie[categorie] ?? [];
  const totalEntites = CATEGORIES.reduce((n, cat) => n + entitesDe(cat.id).length, 0);

  if (!isOpen) return null;

  const toggleBranch = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sfx.playTerminalBeep();
    setExpandedBranches(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleJumperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = jumperVal.trim().toLowerCase();
    if (!clean) return;
    sfx.playTerminalBeep();
    const slug = clean.startsWith('scp-') ? clean : `scp-${clean.padStart(3, '0')}`;
    if (onSelectScpSlug) {
      onSelectScpSlug(slug);
    }
  };

  const getAddressPath = () => {
    switch (currentSelection.type) {
      case 'root':
        return 'C:\\SCIPNET\\ARCHIVES';
      case 'category': {
        if (currentSelection.category === 'series') return 'C:\\SCIPNET\\ARCHIVES\\08_REGISTRE_SCP_10K';
        return `C:\\SCIPNET\\ARCHIVES\\${dossierDe(currentSelection.category)}`;
      }
      case 'entity': {
        const cat = CATEGORIES.find(c => entitesDe(c.id).some(e => e.id === currentSelection.entity.id));
        return `C:\\SCIPNET\\ARCHIVES\\${cat ? dossierDe(cat.id) : '00_DIVERS'}\\${currentSelection.entity.code}`;
      }
      case 'series':
        return `C:\\SCIPNET\\ARCHIVES\\05_REGISTRE_SCP_10K\\${currentSelection.series.name.toUpperCase().replace(/\s+/g, '_')}`;
    }
  };

  // Determine items to display in right pane
  const getRightPaneEntities = (): ScpEntity[] => {
    let list: ScpEntity[] = [];
    if (currentSelection.type === 'root') {
      list = CATEGORIES.flatMap(cat => entitesDe(cat.id));
    } else if (currentSelection.type === 'category' && currentSelection.category !== 'series') {
      list = entitesDe(currentSelection.category);
    }

    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase().trim();
    return list.filter(e => 
      e.name.toLowerCase().includes(q) ||
      e.code.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.queryKeywords.some(k => k.toLowerCase().includes(q))
    );
  };

  return (
    <FenetreScipnet
      isOpen={isOpen}
      onClose={onClose}
      titre="Explorateur SCiPNET"
      classification="Répertoire des entités · CL-5"
      icone={<FolderOpen className="w-4 h-4" />}
      largeur="max-w-6xl"
      hauteur="pleine"
      barreEtat={
        <div className="flex flex-wrap items-center justify-between gap-2 uppercase">
          <span className="tabular-nums">{totalEntites} entités répertoriées</span>
          <span>Réseau intranet SCiPNET</span>
        </div>
      }
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Address Bar & Tools */}
        <div className="bg-surface-1/90 border-b border-bordure px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-texte-attenue text-xs uppercase tracking-wider shrink-0 font-bold">
              ADRESSE :
            </span>
            <div className="win2k-inset px-2 py-0.5 bg-fond text-texte text-xs font-mono flex-1 truncate flex items-center gap-1.5 border border-bordure">
              <HardDrive className="w-3.5 h-3.5 text-accent-texte shrink-0" />
              <span className="text-accent-texte font-bold">{getAddressPath()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Number Jumper */}
            <form onSubmit={handleJumperSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={jumperVal}
                onChange={(e) => setJumperVal(e.target.value)}
                placeholder="N° SCP (ex: 173)"
                className="win2k-inset px-2 py-0.5 bg-black text-classe-euclid border border-bordure text-xs w-28 font-mono outline-none"
              />
              <button
                type="submit"
                className="win2k-btn px-2 py-0.5 text-xs text-classe-euclid hover:text-texte font-bold"
              >
                GO
              </button>
            </form>

            <div className="flex items-center gap-1 border-l border-bordure pl-2">
              <button
                onClick={() => {
                  sfx.playTerminalBeep();
                  setViewMode('grid');
                }}
                className={`win2k-btn px-2 py-0.5 text-xs ${viewMode === 'grid' ? 'bg-surface-2 text-texte font-bold' : 'text-texte-attenue'}`}
              >
                Grille
              </button>
              <button
                onClick={() => {
                  sfx.playTerminalBeep();
                  setViewMode('list');
                }}
                className={`win2k-btn px-2 py-0.5 text-xs ${viewMode === 'list' ? 'bg-surface-2 text-texte font-bold' : 'text-texte-attenue'}`}
              >
                Détails
              </button>
            </div>
          </div>
        </div>

        {/* Explorer Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANE: Hierarchical File & Folder Tree */}
          <div className="w-64 sm:w-80 bg-surface-1/90 border-r border-bordure flex flex-col select-none overflow-y-auto font-mono text-xs p-2">
            <div className="text-xs uppercase font-bold text-texte-attenue mb-2 px-1 flex items-center gap-1.5 border-b border-bordure pb-1">
              <Folder className="w-3.5 h-3.5 text-classe-euclid" />
              <span>ARBORESCENCE DU SYSTÈME SCiPNET</span>
            </div>

            {/* Root: C:\SCIPNET\ARCHIVES */}
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                setCurrentSelection({ type: 'root' });
              }}
              className={`w-full text-left px-2 py-1 flex items-center justify-between rounded transition-colors mb-1 ${
                currentSelection.type === 'root'
                  ? 'bg-surface-3/80 text-texte border border-accent-texte/80 font-bold'
                  : 'text-texte-second hover:bg-surface-2/60'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <HardDrive className="w-3.5 h-3.5 text-accent-texte shrink-0" />
                <span className="truncate">C:\SCIPNET\ARCHIVES</span>
              </div>
              <span className="text-xs text-texte-attenue">({totalEntites})</span>
            </button>

            {/* 01 à 07 : les catégories du répertoire, tirées du wiki.
                Une boucle plutôt que sept blocs recopiés : les catégories sont
                désormais des données (`CATEGORIES` de src/types/entities.ts), pas
                du balisage, et l'ajout des zones, des FIM et du commandement ne
                demande plus de dupliquer cinquante lignes. */}
            {CATEGORIES.map((cat, rang) => {
              const style = STYLE_CATEGORIE[cat.id];
              const Icone = style.icone;
              const entites = entitesDe(cat.id);
              const actif = currentSelection.type === 'category' && currentSelection.category === cat.id;
              return (
                <div className="mt-1" key={cat.id}>
                  <div
                    onClick={() => {
                      sfx.playTerminalBeep();
                      setCurrentSelection({ type: 'category', category: cat.id });
                    }}
                    className={`px-1.5 py-1 flex items-center justify-between cursor-pointer rounded ${
                      actif ? `${style.fondActif} ${style.texteActif} border ${style.bordure} font-bold` : `${style.texte} hover:text-texte`
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span onClick={(e) => toggleBranch(cat.id, e)} className="p-0.5 hover:bg-surface-3 rounded">
                        {expandedBranches[cat.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </span>
                      <Icone className={`w-3.5 h-3.5 ${style.icôneCouleur}`} />
                      <span className="text-xs font-bold">
                        {String(rang + 1).padStart(2, '0')}_{libelleCategorie(cat.id, true).toUpperCase().replace(/\s+/g, '_')}
                      </span>
                    </div>
                    <span className={`text-xs ${style.icôneCouleur}/80`}>({entites.length})</span>
                  </div>

                  {expandedBranches[cat.id] && (
                    <div className={`ml-4 pl-2 border-l ${style.bordureArbre} space-y-0.5 my-1`}>
                      {entites.slice(0, LIMITE_ARBRE).map((entity) => {
                        const isSelected = currentSelection.type === 'entity' && currentSelection.entity.id === entity.id;
                        return (
                          <button
                            key={entity.id}
                            onClick={() => {
                              sfx.playTerminalBeep();
                              setCurrentSelection({ type: 'entity', entity });
                            }}
                            className={`w-full text-left px-1.5 py-0.5 text-[10.5px] rounded truncate flex items-center justify-between ${
                              isSelected
                                ? `${style.fondSelection} text-texte font-bold border ${style.bordureSelection}`
                                : 'text-texte-attenue hover:text-texte'
                            }`}
                          >
                            <span className="truncate">{entity.name}</span>
                            <span className={`text-xs ${style.icôneCouleur}/70 shrink-0`}>{entity.code}</span>
                          </button>
                        );
                      })}
                      {entites.length > LIMITE_ARBRE && (
                        <button
                          onClick={() => {
                            sfx.playTerminalBeep();
                            setCurrentSelection({ type: 'category', category: cat.id });
                          }}
                          className="w-full text-left px-1.5 py-0.5 text-xs italic text-texte-attenue hover:text-texte-second"
                        >
                          … et {entites.length - LIMITE_ARBRE} autres — tout afficher
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}


            {/* 5. REGISTRE SCP (10 000 DOSSIERS PAR SÉRIES) */}
            <div className="mt-2 pt-2 border-t border-bordure">
              <div
                onClick={() => {
                  sfx.playTerminalBeep();
                  setCurrentSelection({ type: 'category', category: 'series' });
                }}
                className={`px-1.5 py-1 flex items-center justify-between cursor-pointer rounded ${
                  currentSelection.type === 'category' && currentSelection.category === 'series'
                    ? 'bg-surface-3/90 text-classe-euclid border border-classe-euclid font-bold'
                    : 'text-classe-euclid hover:text-texte'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span onClick={(e) => toggleBranch('series', e)} className="p-0.5 hover:bg-surface-3 rounded">
                    {expandedBranches.series ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                  <Database className="w-3.5 h-3.5 text-classe-euclid" />
                  <span className="text-xs font-bold">05_REGISTRE_SCP_10K</span>
                </div>
                <span className="text-xs text-classe-euclid font-bold">10 000</span>
              </div>

              {expandedBranches.series && (
                <div className="ml-4 pl-2 border-l border-classe-euclid/60 space-y-0.5 my-1">
                  {SCP_SERIES.map((ser) => {
                    const isSelected = currentSelection.type === 'series' && currentSelection.series.id === ser.id;
                    return (
                      <button
                        key={ser.id}
                        onClick={() => {
                          sfx.playTerminalBeep();
                          setCurrentSelection({ type: 'series', series: ser });
                        }}
                        className={`w-full text-left px-1.5 py-0.5 text-xs rounded truncate flex items-center justify-between ${
                          isSelected
                            ? 'bg-surface-3/80 text-classe-euclid font-bold border border-classe-euclid'
                            : 'text-texte-attenue hover:text-texte'
                        }`}
                      >
                        <span className="truncate">{ser.name}</span>
                        <span className="text-xs text-texte-attenue shrink-0">{ser.range.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Directory Contents */}
          <div className="flex-1 flex flex-col bg-fond overflow-hidden">
            
            {/* Filter Input */}
            <div className="p-2 border-b border-bordure flex items-center justify-between gap-2 text-xs font-mono bg-surface-1/50">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-texte-attenue shrink-0" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filtrer dans ce dossier..."
                  className="win2k-inset px-2 py-0.5 bg-fond text-texte text-xs w-full outline-none font-mono border border-bordure"
                />
              </div>

              <span className="text-xs text-texte-attenue font-mono shrink-0">
                {currentSelection.type === 'entity' ? currentSelection.entity.code
                  : currentSelection.type === 'series' ? currentSelection.series.name
                  : `${getRightPaneEntities().length} ÉLÉMENT(S)`}
              </span>
            </div>

            {/* Folder Main Content */}
            <div className="flex-1 overflow-y-auto p-3 font-mono">
              
              {/* CASE 1: SPECIFIC ENTITY (DEPARTMENT OR RESEARCHER) FOLDER VIEW */}
              {currentSelection.type === 'entity' ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Entity Technical Folder Banner */}
                  <div className="win2k-window p-4 bg-surface-1 border border-bordure shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start gap-4 mb-3">
                      <div className="w-24 h-24 bg-fond win2k-inset p-1.5 shrink-0 border border-bordure flex items-center justify-center">
                        <EntityIllustration id={currentSelection.entity.id} className="w-full h-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-accent-texte">{currentSelection.entity.code}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${currentSelection.entity.badgeBg} ${currentSelection.entity.badgeBorder} ${currentSelection.entity.badgeText}`}>
                            CL-{currentSelection.entity.clearanceLevel}
                          </span>
                          <span className="text-texte-attenue text-xs uppercase">[{currentSelection.entity.category}]</span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-texte mb-1">
                          {currentSelection.entity.name}
                        </h3>

                        <p className="text-xs text-texte-attenue mb-2">
                          {currentSelection.entity.title}
                          {currentSelection.entity.director && ` — Dirigé par : ${currentSelection.entity.director}`}
                        </p>

                        {currentSelection.entity.motto && (
                          <div className="text-xs italic text-classe-euclid/90 bg-surface-3/40 px-2 py-1 rounded border border-classe-euclid/50">
                            « {currentSelection.entity.motto} »
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-texte-second leading-relaxed pt-2 border-t border-bordure">
                      {currentSelection.entity.lore}
                    </p>

                    {/* Action buttons inside entity folder */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-bordure">
                      <button
                        onClick={() => {
                          sfx.playTerminalBeep();
                          onSelectEntity(currentSelection.entity);
                        }}
                        className="win2k-btn px-3 py-1 text-xs text-texte font-bold flex items-center gap-1.5 hover:bg-surface-3"
                      >
                        <FileText className="w-3.5 h-3.5 text-accent-texte" />
                        <span>Ouvrir le dossier déclassifié complet</span>
                      </button>

                      {onSelectSeriesFilter && (
                        <button
                          onClick={() => {
                            sfx.playTerminalBeep();
                            onSelectSeriesFilter(currentSelection.entity.queryKeywords[0] || currentSelection.entity.name);
                            onClose();
                          }}
                          className="win2k-btn px-3 py-1 text-xs text-classe-euclid hover:text-texte flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-classe-euclid" />
                          <span>Rechercher les archives liées</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Files inside this folder: Linked SCP Anomalies */}
                  <div>
                    <div className="text-xs font-bold text-texte-attenue uppercase mb-2 flex items-center gap-2 flex-wrap">
                      <FolderOpen className="w-3.5 h-3.5 text-accent-texte" />
                      <span>DOSSIERS RATTACHÉS À CETTE ENTITÉ :</span>
                      {/* Le décompte sépare ce que le wiki DÉCLARE de ce que le texte
                          se contente de mentionner. C'est ce qui remplace l'ancienne
                          liste saisie à la main, dont rien ne disait d'où elle venait. */}
                      {(() => {
                        const { confirmes, mentions } = compterDossiers(currentSelection.entity.id, languageCode);
                        return (
                          <span className="text-xs font-mono normal-case text-texte-attenue">
                            {confirmes} confirmé{confirmes > 1 ? 's' : ''}
                            {mentions > 0 && ` · ${mentions} mention${mentions > 1 ? 's' : ''}`}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {currentSelection.entity.iconicScps.slice(0, LIMITE_DOSSIERS).map((scpSlug) => (
                        <button
                          key={scpSlug}
                          onClick={() => {
                            sfx.playTerminalBeep();
                            if (onSelectScpSlug) {
                              onSelectScpSlug(scpSlug.toLowerCase());
                              onClose();
                            }
                          }}
                          className="win2k-btn p-2.5 text-left flex items-center justify-between hover:border-accent-texte/80 group"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-accent-texte shrink-0" />
                            <div>
                              <div className="font-bold text-texte text-xs">{scpSlug}</div>
                              <div className="text-xs text-texte-attenue">Dossier classifié SCiPNET</div>
                            </div>
                          </div>
                          <span className="text-xs text-accent-texte font-bold group-hover:translate-x-0.5 transition-transform">
                            OUVRIR &gt;
                          </span>
                        </button>
                      ))}
                    </div>

                    {currentSelection.entity.iconicScps.length > LIMITE_DOSSIERS && (
                      <p className="mt-2 text-xs font-mono text-texte-attenue">
                        {currentSelection.entity.iconicScps.length - LIMITE_DOSSIERS} autres dossiers rattachés —
                        les mieux notés sont affichés en premier.
                      </p>
                    )}
                  </div>
                </div>
              ) : currentSelection.type === 'series' ? (
                /* CASE 2: SERIES DOSSIER VIEW (10K DOSSIERS) */
                <div className="space-y-4 animate-fade-in">
                  <div className="win2k-window p-4 bg-surface-1 border border-classe-euclid/60 shadow-xl">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-xs text-classe-euclid uppercase font-bold tracking-widest">
                          REGISTRE OFFICIEL // 10 000 DOSSIERS SCiPNET
                        </span>
                        <h3 className="text-lg font-bold text-texte tracking-wide">
                          {currentSelection.series.name.toUpperCase()} : {currentSelection.series.range}
                        </h3>
                      </div>
                      <span className="px-2 py-1 text-xs font-bold border border-classe-euclid/70 text-classe-euclid bg-surface-3/80 rounded">
                        {currentSelection.series.totalEstimate}
                      </span>
                    </div>

                    <p className="text-xs text-texte-second leading-relaxed mb-4">
                      {currentSelection.series.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-bordure">
                      {(onSelectSeries || onSelectSeriesFilter) && (
                        <button
                          onClick={() => {
                            sfx.playTerminalBeep();
                            if (onSelectSeries) {
                              onSelectSeries(currentSelection.series.id);
                            } else if (onSelectSeriesFilter) {
                              onSelectSeriesFilter(currentSelection.series.prefix);
                            }
                            onClose();
                          }}
                          className="win2k-btn px-3 py-1 text-xs font-bold text-classe-euclid hover:text-texte flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-classe-euclid" />
                          <span>Parcourir les 1 000 dossiers de la série</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sample files */}
                  <div>
                    <div className="text-xs font-bold text-texte-attenue uppercase mb-2 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-classe-euclid" />
                      <span>DOSSIERS PHARES DE CETTE SÉRIE :</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                      {currentSelection.series.iconicSamples.map((scp) => (
                        <button
                          key={scp}
                          onClick={() => {
                            sfx.playTerminalBeep();
                            if (onSelectScpSlug) {
                              onSelectScpSlug(scp.toLowerCase());
                              onClose();
                            }
                          }}
                          className="win2k-btn p-2.5 text-left flex flex-col justify-between hover:border-classe-euclid/80 group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-texte-attenue">FICHIER</span>
                            <span className="text-xs font-bold text-classe-euclid group-hover:underline">OUVRIR &gt;</span>
                          </div>
                          <span className="font-mono font-bold text-texte text-xs tracking-wider">
                            {scp}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* CASE 3: LIST / GRID OF ENTITIES IN CURRENT CATEGORY OR ROOT */
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getRightPaneEntities().map((entity) => (
                      <div
                        key={entity.id}
                        onClick={() => {
                          sfx.playTerminalBeep();
                          setCurrentSelection({ type: 'entity', entity });
                        }}
                        className="win2k-window p-3 bg-surface-1/80 hover:bg-surface-1 border border-bordure/80 hover:border-accent-texte/80 cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-12 h-12 bg-fond win2k-inset p-1 shrink-0 border border-bordure flex items-center justify-center">
                            <EntityIllustration id={entity.id} className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-bold text-accent-texte truncate">{entity.code}</span>
                              <span className={`text-xs px-1 py-0.5 rounded border font-bold ${entity.badgeBg} ${entity.badgeBorder} ${entity.badgeText}`}>
                                CL-{entity.clearanceLevel}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-texte truncate group-hover:text-accent-texte">
                              {entity.name}
                            </h4>
                            <p className="text-xs text-texte-attenue truncate">
                              {entity.title}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-texte-second line-clamp-2 leading-relaxed mb-2">
                          {entity.description}
                        </p>

                        <div className="pt-2 border-t border-bordure flex items-center justify-between text-xs">
                          <span className="text-texte-attenue">{entity.iconicScps.length} SCP(s) associés</span>
                          <span className="text-accent-texte font-bold group-hover:underline flex items-center gap-1">
                            <span>ENTRER DANS LE DOSSIER</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Table view */
                  <div className="win2k-inset bg-fond border border-bordure text-xs overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-1 border-b border-bordure text-xs text-texte-attenue uppercase">
                          <th className="p-2">Code</th>
                          <th className="p-2">Nom de l'Entité</th>
                          <th className="p-2">Catégorie</th>
                          <th className="p-2">Accréditation</th>
                          <th className="p-2">Titre / Rôle</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getRightPaneEntities().map((entity) => (
                          <tr
                            key={entity.id}
                            onClick={() => {
                              sfx.playTerminalBeep();
                              setCurrentSelection({ type: 'entity', entity });
                            }}
                            className="border-b border-bordure/80 hover:bg-surface-1/80 cursor-pointer transition-colors"
                          >
                            <td className="p-2 font-bold text-accent-texte whitespace-nowrap">{entity.code}</td>
                            <td className="p-2 font-bold text-texte whitespace-nowrap">{entity.name}</td>
                            <td className="p-2 text-texte-attenue uppercase text-xs">{entity.category}</td>
                            <td className="p-2 text-texte-second">Niveau {entity.clearanceLevel}</td>
                            <td className="p-2 text-texte-attenue truncate max-w-xs">{entity.title}</td>
                            <td className="p-2 text-right text-accent-texte font-bold">Ouvrir &gt;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

            </div>
          </div>
        </div>
      </div>
    </FenetreScipnet>
  );
};
