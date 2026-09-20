import React, { useState } from 'react';
import { ArrowLeft, Star, Play, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';
import { ScpItemDetail } from '../../types/scp';
import { CharacterRole, SpeechSegment } from '../../types/audioRoleplay';
import { WikiLink } from '../../services/linkExtractor';
import { SpokenLine } from '../../components/SpokenLine';
import { ReadingQueue } from '../../components/ReadingQueue';
import { BandeauEntites } from '../../components/BandeauEntites';
import { CreditsDossier } from '../../components/CreditsDossier';
import {
  habillageClasse,
  styleBadgeClasse,
  styleFondClasse
} from '../../components/classification';
import { sfx } from '../../services/sfxService';
import { useT } from '../../i18n';

interface MobileScpReaderProps {
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
  /** Liens inter-dossiers — voir SpokenLine / ReadingQueue (composants partagés). */
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

/** Même code couleur que le lecteur de bureau : liseré de 4 px et fond à 6 %. */
const COULEUR_ROLE: Record<CharacterRole, string> = {
  narrator: 'var(--role-narrateur)',
  researcher: 'var(--role-chercheur)',
  anomaly: 'var(--role-anomalie)',
  classD: 'var(--role-classed)',
  agent: 'var(--role-agent)',
  commander: 'var(--role-commandant)',
  intercom: 'var(--role-intercom)'
};

/** Trois tailles de lecture, toutes au-dessus du plancher de 15 px. */
const TAILLES = {
  sm: { classe: 'text-base', libelle: 'A' },
  base: { classe: 'text-lg', libelle: 'A' },
  lg: { classe: 'text-xl', libelle: 'A' }
} as const;

export const MobileScpReader: React.FC<MobileScpReaderProps> = ({
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
  const t = useT();
  const [fontSize, setFontSize] = useState<keyof typeof TAILLES>('sm');
  const habillage = habillageClasse(scp.objectClass);

  return (
    <div className="flex-1 flex flex-col pb-28">
      {/* Barre d'outils du dossier */}
      <div className="sticky top-12 z-20 bg-surface-1/97 border-b border-bordure backdrop-blur-md -mx-3 px-3 py-1.5 flex items-center justify-between gap-2">
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onBack();
          }}
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-sm font-mono text-xs text-texte-second bg-surface-2 border border-bordure active:bg-surface-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('entites.retour')}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center h-10 rounded-sm bg-surface-2 border border-bordure">
            <button
              onClick={() => setFontSize((p) => (p === 'lg' ? 'base' : 'sm'))}
              disabled={fontSize === 'sm'}
              aria-label={t('lecteurMobile.reduireTexte')}
              className="w-10 h-10 flex items-center justify-center text-texte-attenue active:text-texte disabled:opacity-30"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFontSize((p) => (p === 'sm' ? 'base' : 'lg'))}
              disabled={fontSize === 'lg'}
              aria-label={t('lecteurMobile.agrandirTexte')}
              className="w-10 h-10 flex items-center justify-center text-texte-attenue active:text-texte disabled:opacity-30"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onToggleFavorite();
            }}
            aria-pressed={isFavorite}
            title={isFavorite ? t('favoris.retirer') : t('favoris.classerInfo')}
            className={`w-10 h-10 flex items-center justify-center rounded-sm border ${
              isFavorite
                ? 'border-classe-euclid text-classe-euclid'
                : 'bg-surface-2 border-bordure text-texte-attenue'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/*
            Retour vers la page d'origine. Ce n'est pas un confort : le contenu des
            dossiers vient du wiki communautaire, sous licence CC BY-SA 3.0, qui
            impose de renvoyer vers la source. Le lecteur de bureau l'avait déjà
            (`ScpReader.tsx`) ; la vue mobile ne l'avait pas.
          */}
          <a
            href={scp.url}
            target="_blank"
            rel="noopener noreferrer license"
            title={t('lecteurMobile.sourceInfo')}
            aria-label={t('lecteurMobile.source')}
            className="w-10 h-10 flex items-center justify-center rounded-sm border bg-surface-2 border-bordure text-texte-attenue active:text-texte"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* En-tête de classification */}
      <header
        className="mt-3 border border-bordure rounded overflow-hidden shadow-relief"
        style={styleFondClasse(scp.objectClass)}
      >
        <div
          className={`h-1 ${habillage.dangereuse ? 'hazard-stripes' : ''}`}
          style={habillage.dangereuse ? undefined : { backgroundColor: habillage.couleur }}
          aria-hidden="true"
        />

        <div className="px-3 py-1.5 border-b border-bordure-faible font-mono text-xs uppercase tracking-technique text-texte-attenue">
          {t('dossier.classifieCourt')}
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h1 className="font-mono text-2xl font-bold text-texte tracking-tight">
              {scp.scpNumber || scp.slug.toUpperCase()}
            </h1>
            <span
              className="font-mono text-xs px-2 py-0.5 rounded-sm border uppercase tracking-technique font-semibold"
              style={styleBadgeClasse(scp.objectClass)}
            >
              {scp.objectClass}
            </span>
          </div>

          <h2 className="font-serif text-base text-texte-second leading-snug">
            {scp.alternateTitle || scp.title}
          </h2>

          <BandeauEntites slug={scp.slug} languageCode={languageCode} onOuvrirEntite={onOuvrirEntite} />

          <p className="mt-3 pt-2.5 border-t border-bordure-faible font-mono text-xs uppercase tracking-technique text-texte-attenue">
            {segments.length} séquences audio
          </p>
        </div>
      </header>

      {/* File « À SUIVRE » — mêmes composants que le bureau, cibles ≥ 44 px. */}
      {readingQueue && onOpenLink && onRemoveFromQueue && onClearQueue && (
        <div className="mt-3">
          <ReadingQueue
            queue={readingQueue}
            onOpen={onOpenLink}
            onRemove={onRemoveFromQueue}
            onClear={onClearQueue}
          />
        </div>
      )}

      <div className="mt-4 space-y-1.5">
        {segments.map((segment, index) => {
          const isCurrent = index === currentSegmentIndex;
          const isActivelyPlaying = isCurrent && isPlaying;
          const couleurRole = COULEUR_ROLE[segment.role] || COULEUR_ROLE.narrator;

          return (
            <div
              key={index}
              onClick={() => {
                sfx.playTerminalBeep();
                onPlaySegment(index);
              }}
              style={
                isCurrent
                  ? undefined
                  : {
                      borderLeftColor: couleurRole,
                      backgroundColor: `color-mix(in srgb, ${couleurRole} 6%, var(--surface-1))`
                    }
              }
              className={`rounded-r border-l-4 border-y border-r py-3 pl-3.5 pr-3 cursor-pointer transition-colors ${
                isActivelyPlaying
                  ? 'bg-surface-3 border-accent-texte shadow-lecture'
                  : isCurrent
                  ? 'bg-surface-2 border-classe-euclid'
                  : 'segment-repos border-y-transparent border-r-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className="etiquette-locuteur truncate"
                  style={{ color: isCurrent ? 'var(--texte)' : couleurRole }}
                >
                  {segment.speaker}
                </span>

                {isActivelyPlaying ? (
                  <span className="flex items-end gap-0.5 h-3.5 shrink-0" aria-label={t('dossier.lectureEnCours')}>
                    <span className="visualizer-bar" />
                    <span className="visualizer-bar" />
                    <span className="visualizer-bar" />
                  </span>
                ) : (
                  <Play className="w-3 h-3 text-texte-attenue shrink-0" aria-hidden="true" />
                )}
              </div>

              <p
                className={`prose-dossier ${TAILLES[fontSize].classe} ${
                  isCurrent ? 'text-texte' : ''
                }`}
              >
                <SpokenLine
                  text={segment.text}
                  links={segment.links}
                  activeWordIndex={isCurrent ? activeWordIndex : -1}
                  onEnqueueLink={onEnqueueLink}
                  onOpenLink={onOpenLink}
                />
              </p>
            </div>
          );
        })}
      </div>

      {/* Crédits et licence — obligation CC BY-SA 3.0, cf. NOTICE-SCP.md */}
      <CreditsDossier
        attributions={scp.attributions}
        url={scp.url}
        titre={scp.title}
        className="mt-5"
      />
    </div>
  );
};
