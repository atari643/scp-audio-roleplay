import React from 'react';
import { 
  X, 
  Minus, 
  Square, 
  Terminal, 
  Search, 
  ExternalLink, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  Radio, 
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { ScpEntity } from '../data/departmentsData';
import { EntityIllustration } from './illustrations/ScpIllustrations';
import { sfx } from '../services/sfxService';

interface EntityDetailModalProps {
  entity: ScpEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onFilterScps: (query: string) => void;
  /** Filtre le catalogue sur les vrais dossiers de l'entité, plutôt qu'un mot-clé. */
  onFiltrerParEntite?: (id: string) => void;
  onSelectScpSlug?: (slug: string) => void;
  onOpenExplorer?: () => void;
}

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({
  entity,
  isOpen,
  onClose,
  onFilterScps,
  onFiltrerParEntite,
  onSelectScpSlug,
  onOpenExplorer
}) => {
  if (!isOpen || !entity) return null;

  const handleFilterClick = () => {
    sfx.playTerminalBeep();
    // Le filtre porte sur l'ENTITÉ, pas sur un mot. Avant, « Dr Clef » lançait une
    // recherche plein texte sur « clef » : on obtenait les dossiers qui contiennent
    // le mot, pas ceux du personnage. Repli sur l'ancien comportement pour les 11
    // entités écrites à la main que le wiki ne connaît pas.
    if (onFiltrerParEntite && entity.entiteId) {
      onFiltrerParEntite(entity.entiteId);
    } else {
      onFilterScps(entity.queryKeywords[0] || entity.name);
    }
    onClose();
  };

  const handleScpClick = (scpNum: string) => {
    sfx.playTerminalBeep();
    // Les entrées viennent maintenant de l'index, qui contient de VRAIS slugs Wikidot :
    // certains portent un préfixe de catégorie (`deleted:scp-162-fr`) que l'ancien
    // nettoyage écrasait, produisant un slug introuvable. On ne normalise donc que la
    // forme saisie à la main, « SCP-173 ».
    const brut = scpNum.trim();
    const slug = /^SCP-[\dA-Z-]+$/i.test(brut)
      ? brut.toLowerCase()
      : brut.toLowerCase().replace(/[^a-z0-9:_-]/g, '');
    if (onSelectScpSlug) {
      onSelectScpSlug(slug);
      onClose();
    } else {
      onFilterScps(scpNum);
      onClose();
    }
  };

  const categoryLabels = {
    department: 'DÉPARTEMENT OFFICIEL DE LA FONDATION',
    researcher: 'DOSSIER DU PERSONNEL SCIENTIFIQUE // SITE-19',
    goi: "GROUPE D'INTÉRÊT (GdI) // RAPPORT DE RENSEIGNEMENT",
    site: 'INSTALLATION DE CONFINEMENT SÉCURISÉE'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Retro 2000-2005 SCiPNET Window */}
      <div className="w-full max-w-4xl bg-slate-950 win2k-window rounded-none overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        
        {/* Retro Titlebar */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 px-2.5 py-1.5 flex items-center justify-between border-b border-red-800/80 select-none">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-4 h-4 bg-red-700 border border-red-400 flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0">
              S
            </div>
            <span className="font-mono text-xs font-bold text-white tracking-wide truncate">
              SCiPNET v3.2.1 - [ {entity.code} : {entity.name.toUpperCase()} ]
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onClose}
              className="w-5 h-5 win2k-btn flex items-center justify-center text-slate-300 hover:text-white"
              title="Réduire"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              className="w-5 h-5 win2k-btn flex items-center justify-center text-slate-300 hover:text-white"
              title="Agrandir"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onClose();
              }}
              className="w-5 h-5 win2k-btn-red flex items-center justify-center text-white font-bold text-xs leading-none"
              title="Fermer [Echap]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Retro Classic Menubar */}
        <div className="bg-slate-900 border-b border-slate-700 px-3 py-1 flex items-center gap-4 text-[11px] font-mono text-slate-300 select-none">
          <span className="hover:text-white cursor-pointer">[ Fichier ]</span>
          <span className="hover:text-white cursor-pointer">[ Édition ]</span>
          <span className="hover:text-white cursor-pointer">[ Données ]</span>
          <span className="hover:text-white cursor-pointer text-red-400 font-semibold">[ Sécurité-RAISA ]</span>
          {onOpenExplorer && (
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onOpenExplorer();
              }}
              className="ml-auto text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
            >
              <FolderOpen className="w-3 h-3" />
              <span>Explorateur</span>
            </button>
          )}
        </div>

        {/* Modal Main Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border uppercase tracking-wider ${entity.badgeBg} ${entity.badgeBorder} ${entity.badgeText}`}>
                  {categoryLabels[entity.category]}
                </span>
                <span className="text-[10px] font-mono bg-black/70 text-slate-400 px-2 py-0.5 border border-slate-800">
                  CODE : {entity.code}
                </span>
                <span className="text-[10px] font-mono bg-red-950/80 text-red-300 px-2 py-0.5 border border-red-700/60 font-bold">
                  CLEARANCE : NIVEAU {entity.clearanceLevel}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                {entity.name}
              </h1>
              <p className="text-xs font-mono text-slate-400 italic mt-0.5">
                « {entity.title} »
              </p>
            </div>

            {/* Quick Action: Search related SCPs */}
            <button
              onClick={handleFilterClick}
              className="bg-red-700 hover:bg-red-600 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-none win2k-btn-red flex items-center gap-2 shadow-lg transition-all"
            >
              <Search className="w-4 h-4" />
              <span>[ AFFICHER LES DOSSIERS SCP LIÉS ]</span>
            </button>
          </div>

          {/* Two-Column Dossier Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Vector Illustration & Identity Card */}
            <div className="md:col-span-5 space-y-4">
              
              {/* Illustration Frame */}
              <div className="win2k-inset p-3 bg-black flex flex-col items-center justify-center relative group">
                <div className="w-44 h-44 sm:w-52 sm:h-52 relative">
                  <EntityIllustration id={entity.id} className="w-full h-full filter drop-shadow-[0_0_12px_rgba(239,68,68,0.35)]" />
                </div>
                <div className="w-full mt-3 pt-2 border-t border-slate-800 text-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    SCEAU D'AUTHENTICITÉ SCiPNET // ENREGISTRÉ
                  </span>
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="win2k-inset p-3 bg-slate-950/90 font-mono text-xs space-y-2">
                <div className="text-[10px] font-bold text-red-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>MATRICE TECHNIQUE</span>
                  <span>SEC-02</span>
                </div>

                {entity.director && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">RESPONSABLE :</span>
                    <span className="text-slate-200 font-semibold text-right">{entity.director}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">ACCRÉDITATION :</span>
                  <span className="text-amber-400 font-bold">Niveau {entity.clearanceLevel}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">STATUT SYSTÈME :</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    ACTIF // CRYPTÉ
                  </span>
                </div>

                {entity.motto && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block mb-0.5">DEVISE OPÉRATIONNELLE :</span>
                    <p className="text-[11px] italic text-slate-300">"{entity.motto}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Briefing, Lore & Connected Anomalies */}
            <div className="md:col-span-7 space-y-5 font-mono">
              
              {/* Mission Statement */}
              <div className="win2k-inset p-4 bg-slate-900/60">
                <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5 mb-2 text-red-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>SYNTHÈSE DE MISSION & ATTRIBUTIONS</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {entity.description}
                </p>
              </div>

              {/* In-Depth Classified Lore */}
              <div className="win2k-inset p-4 bg-slate-900/40 space-y-2">
                <h3 className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>DOSSIER DE SÉCURITÉ // ARCHIVES SITE-19</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                  {entity.lore}
                </p>
              </div>

              {/* Iconic Connected SCP Anomalies */}
              {entity.iconicScps && entity.iconicScps.length > 0 && (
                <div className="win2k-inset p-4 bg-black/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      <span>DOSSIERS ANORMAUX DIRECTEMENT ASSOCIÉS :</span>
                    </span>
                    <span className="text-[10px] text-slate-500">CLIQUEZ POUR OUVRIR</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {entity.iconicScps.map((scpNum) => (
                      <button
                        key={scpNum}
                        onClick={() => handleScpClick(scpNum)}
                        className="win2k-btn px-2.5 py-1 text-xs font-bold font-mono text-red-300 hover:text-white flex items-center gap-1 transition-colors group"
                      >
                        <span>{scpNum}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-red-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Keywords */}
              <div className="text-[11px] text-slate-500 pt-1">
                <span>MOTS-CLÉS DE RECHERCHE : </span>
                <span className="text-slate-400 italic">{entity.queryKeywords.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Retro Windows 2000 Statusbar at Bottom */}
        <div className="win2k-statusbar px-3 py-1 text-[10px] flex flex-wrap items-center justify-between gap-2 text-slate-400 select-none">
          <div className="flex items-center gap-3">
            <span>TERMINAL: SITE-19-NODE-B</span>
            <span>•</span>
            <span className="text-emerald-400">CONNEXION SÉCURISÉE 1024-BIT</span>
          </div>

          <div className="flex items-center gap-3">
            <span>MEM: 128 MB OK</span>
            <span>•</span>
            <span className="text-slate-300 font-bold">RAISA // CLEARANCE GRANTED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
