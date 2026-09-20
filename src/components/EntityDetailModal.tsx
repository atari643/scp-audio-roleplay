import React from 'react';
import { 
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
import { FenetreScipnet } from './FenetreScipnet';
import { MentionSourceWiki } from './MentionSourceWiki';
import { useT } from '../i18n';

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
  // Avant le retour conditionnel : un hook ne peut pas être appelé de façon
  // conditionnelle, et `useT` s'abonne au changement de langue.
  const t = useT();
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
    department: t('fiche.catDepartement'),
    researcher: t('fiche.catChercheur'),
    goi: t('fiche.catFaction'),
    site: t('fiche.catSite')
  };

  return (
    <FenetreScipnet
      isOpen={isOpen}
      onClose={onClose}
      titre={`${entity.code} · ${entity.name}`}
      classification={t('accred.niveau', { n: String(entity.clearanceLevel) })}
      icone={<FolderOpen className="w-4 h-4" />}
      largeur="max-w-4xl"
      barreEtat={
        <div className="flex flex-wrap items-center justify-between gap-2 uppercase">
          <span>{t('fiche.terminal')}</span>
          <span>{t('fiche.connexion')}</span>
        </div>
      }
    >
      <div className="flex flex-col">
        {/* Barre d'outils de la fiche — absente s'il n'y a rien à y mettre. */}
        {onOpenExplorer && (
          <div className="bg-surface-1 border-b border-bordure-faible px-3 py-1.5 flex items-center justify-end">
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                onOpenExplorer();
              }}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm font-mono text-xs text-texte-second hover:bg-surface-3 hover:text-texte transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t('entete.explorateur')}</span>
            </button>
          </div>
        )}

        {/* Modal Main Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bordure pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 border uppercase tracking-wider ${entity.badgeBg} ${entity.badgeBorder} ${entity.badgeText}`}>
                  {categoryLabels[entity.category]}
                </span>
                <span className="text-xs font-mono bg-black/70 text-texte-attenue px-2 py-0.5 border border-bordure">
                  CODE : {entity.code}
                </span>
                <span className="text-xs font-mono bg-surface-3/80 text-accent-texte px-2 py-0.5 border border-accent-texte/60 font-bold">
                  CLEARANCE : NIVEAU {entity.clearanceLevel}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-texte tracking-tight">
                {entity.name}
              </h1>
              <p className="text-xs font-mono text-texte-attenue italic mt-0.5">
                « {entity.title} »
              </p>
            </div>

            {/* Quick Action: Search related SCPs */}
            <button
              onClick={handleFilterClick}
              className="bg-accent hover:bg-accent text-texte font-mono font-bold text-xs px-4 py-2.5 rounded-none win2k-btn-red flex items-center gap-2 shadow-lg transition-all"
            >
              <Search className="w-4 h-4" />
              <span>{t('fiche.afficherLies')}</span>
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
                <div className="w-full mt-3 pt-2 border-t border-bordure text-center">
                  <span className="text-xs font-mono text-texte-attenue uppercase tracking-widest">
                    {t('fiche.sceau')}
                  </span>
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="win2k-inset p-3 bg-fond/90 font-mono text-xs space-y-2">
                <div className="text-xs font-bold text-accent-texte border-b border-bordure pb-1 flex items-center justify-between">
                  <span>{t('fiche.matrice')}</span>
                  <span>SEC-02</span>
                </div>

                {entity.director && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-texte-attenue">{t('fiche.responsable')}</span>
                    <span className="text-texte font-semibold text-right">{entity.director}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-texte-attenue">{t('fiche.accreditation')}</span>
                  <span className="text-classe-euclid font-bold">{t('accred.niveau', { n: String(entity.clearanceLevel) })}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-texte-attenue">{t('fiche.statut')}</span>
                  <span className="text-classe-safe font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-classe-safe inline-block" />
                    {t('fiche.actif')}
                  </span>
                </div>

                {entity.motto && (
                  <div className="pt-2 border-t border-bordure/80">
                    <span className="text-xs text-texte-attenue block mb-0.5">{t('fiche.devise')}</span>
                    <p className="text-xs italic text-texte-second">"{entity.motto}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Briefing, Lore & Connected Anomalies */}
            <div className="md:col-span-7 space-y-5 font-mono">
              
              {/* Mission Statement */}
              <div className="win2k-inset p-4 bg-surface-1/60">
                <h3 className="text-xs font-bold text-texte tracking-wider flex items-center gap-1.5 mb-2 text-accent-texte">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{t('fiche.synthese')}</span>
                </h3>
                <p className="text-xs sm:text-sm text-texte leading-relaxed">
                  {entity.description}
                </p>
              </div>

              {/* In-Depth Classified Lore */}
              <div className="win2k-inset p-4 bg-surface-1/40 space-y-2">
                <h3 className="text-xs font-bold text-classe-euclid tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{t('fiche.securite')}</span>
                </h3>
                <p className="text-xs text-texte-second leading-relaxed whitespace-pre-line font-sans">
                  {entity.lore}
                </p>
              </div>

              {/* Iconic Connected SCP Anomalies */}
              {entity.iconicScps && entity.iconicScps.length > 0 && (
                <div className="win2k-inset p-4 bg-black/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-texte-second">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-accent-texte" />
                      <span>{t('fiche.dossiersAssocies')}</span>
                    </span>
                    <span className="text-xs text-texte-attenue">{t('fiche.cliquezOuvrir')}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {entity.iconicScps.map((scpNum) => (
                      <button
                        key={scpNum}
                        onClick={() => handleScpClick(scpNum)}
                        className="win2k-btn px-2.5 py-1 text-xs font-bold font-mono text-accent-texte hover:text-texte flex items-center gap-1 transition-colors group"
                      >
                        <span>{scpNum}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-accent-texte" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Keywords */}
              <div className="text-xs text-texte-attenue pt-1">
                <span>{t('fiche.motsCles')}</span>
                <span className="text-texte-attenue italic">{entity.queryKeywords.join(', ')}</span>
              </div>

              {/*
                Les deux blocs ci-dessus reprennent le résumé de l'annuaire du wiki mot
                pour mot. CC BY-SA 3.0 en exige la source : elle est dans les données
                (`Entite.pages`) depuis le début, elle n'était simplement pas affichée.
              */}
              {entity.sourceWiki && (
                <MentionSourceWiki
                  url={entity.sourceWiki}
                  titre={entity.name}
                  intro={t('entites.resumeRepris')}
                  className="pt-2 border-t border-bordure-faible font-sans"
                />
              )}
            </div>
          </div>
        </div>

      </div>
    </FenetreScipnet>
  );
};
