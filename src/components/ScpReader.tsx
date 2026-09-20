import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Star,
  ExternalLink,
  FileText,
  Sparkles,
  Radio,
  Crosshair
} from 'lucide-react';
import { ScpItemDetail } from '../types/scp';
import { CreditsDossier } from './CreditsDossier';
import { CharacterRole, SpeechSegment } from '../types/audioRoleplay';
import { speechEngine } from '../services/speechEngine';
import { sfx } from '../services/sfxService';
import { WikiLink } from '../services/linkExtractor';
import { SpokenLine } from './SpokenLine';
import { ReadingQueue } from './ReadingQueue';
import { BandeauEntites } from './BandeauEntites';
import { habillageClasse, styleBadgeClasse, styleFondClasse } from './classification';
import { useT } from '../i18n';

interface ScpReaderProps {
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
  /** File « À SUIVRE » et navigation inter-dossiers (voir SpokenLine / ReadingQueue). */
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

/**
 * Couleur d'un rôle de lecture.
 *
 * L'ancienne version donnait à chacun des sept rôles un fond teinté, une bordure
 * teintée, un texte teinté ET un badge teinté : sept cartes de couleurs
 * différentes qui s'empilaient sur toute la hauteur du dossier. On ne voyait plus
 * le texte, seulement les cartes.
 *
 * Nouveau modèle, emprunté au script de doublage : fond neutre pour tous, et la
 * couleur du rôle portée par deux choses seulement — le liseré de 3 px à gauche
 * et le nom du locuteur. C'est assez pour savoir qui parle d'un coup d'œil, et
 * assez discret pour que la réplique reste l'élément principal.
 */
const COULEUR_ROLE: Record<CharacterRole, string> = {
  narrator: 'var(--role-narrateur)',
  researcher: 'var(--role-chercheur)',
  anomaly: 'var(--role-anomalie)',
  classD: 'var(--role-classed)',
  agent: 'var(--role-agent)',
  commander: 'var(--role-commandant)',
  intercom: 'var(--role-intercom)'
};

const BOUTON_OUTIL =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-mono ' +
  'bg-surface-2 border border-bordure text-texte-second ' +
  'hover:bg-surface-3 hover:text-texte hover:border-bordure-forte transition-colors';

export const ScpReader: React.FC<ScpReaderProps> = ({
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
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'roleplay' | 'raw'>('roleplay');
  const segmentRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const habillage = habillageClasse(scp.objectClass);

  // Recentrage sur la réplique active, pour suivre la voix à l'œil.
  const scrollToActiveSegment = (index: number, smooth: boolean = true) => {
    const el = segmentRefs.current[index];
    if (!el) return;

    // L'en-tête est collant (~95 px) et le lecteur audio est fixé en bas (~85 px).
    const headerOffset = 110;
    const playerOffset = 95;
    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const elementTopInDoc = rect.top + scrollTop;

    const availableHeight = window.innerHeight - headerOffset - playerOffset;
    const targetTop = elementTopInDoc - headerOffset - Math.max(20, (availableHeight - rect.height) / 2);

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  useEffect(() => {
    if (!autoScroll) return;
    const timer = setTimeout(() => {
      scrollToActiveSegment(currentSegmentIndex, true);
    }, 50);
    return () => clearTimeout(timer);
  }, [currentSegmentIndex, autoScroll]);

  return (
    <div className="max-w-4xl mx-auto pb-36 pt-2 px-3 sm:px-6">
      {/* Barre d'outils du dossier */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-bordure">
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            onBack();
          }}
          className={`${BOUTON_OUTIL} group`}
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t('dossier.catalogue')}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onToggleFavorite();
            }}
            title={isFavorite ? t('favoris.retirer') : t('favoris.classerInfo')}
            aria-pressed={isFavorite}
            className={
              isFavorite
                ? 'inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-mono border border-classe-euclid text-classe-euclid transition-colors'
                : BOUTON_OUTIL
            }
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{t(isFavorite ? 'favoris.classe' : 'filtre.classerCourt')}</span>
          </button>

          <a
            href={scp.url}
            target="_blank"
            rel="noopener noreferrer"
            title={t('dossier.sourceInfo')}
            className={BOUTON_OUTIL}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('dossier.source')}</span>
          </a>
        </div>
      </div>

      {/* En-tête de classification (ACS)
          Seule la classe d'objet est connue du corpus : on n'invente ni niveau de
          perturbation ni niveau de risque pour remplir la grille. Ce qui est
          affiché est ce que le dossier dit. */}
      <header
        className="relative border border-bordure rounded mb-6 overflow-hidden shadow-relief"
        style={styleFondClasse(scp.objectClass)}
      >
        {/* Liseré de classification. Rayé pour Keter et Apollyon seulement. */}
        <div
          className={`h-1 ${habillage.dangereuse ? 'hazard-stripes' : ''}`}
          style={habillage.dangereuse ? undefined : { backgroundColor: habillage.couleur }}
          aria-hidden="true"
        />

        <div className="px-3 sm:px-5 py-2 border-b border-bordure-faible flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-xs text-texte-attenue tracking-technique uppercase">
          <span>{t('dossier.classifie')}</span>
          <span className="text-systeme">{t('dossier.confinement')}</span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-mono text-3xl font-bold text-texte tracking-tight">
                  {scp.scpNumber}
                </span>

                <span
                  className="font-mono text-xs font-semibold uppercase tracking-technique px-2.5 py-1 rounded-sm border"
                  style={styleBadgeClasse(scp.objectClass)}
                >
                  {t('dossier.classeValeur', { classe: scp.objectClass })}
                </span>
              </div>

              <h2 className="font-serif text-xl text-texte leading-snug">
                {scp.alternateTitle ? scp.alternateTitle : scp.title}
              </h2>
            </div>

            <button
              onClick={() => (isPlaying ? speechEngine.pause() : speechEngine.play())}
              className="shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded bg-accent hover:bg-accent-texte active:bg-accent-fort text-texte text-sm font-mono font-semibold transition-colors"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{t('lecteur.pause')}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t('dossier.ecouter')}</span>
                </>
              )}
            </button>
          </div>

          <BandeauEntites slug={scp.slug} languageCode={languageCode} onOuvrirEntite={onOuvrirEntite} />

          {scp.tags && scp.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-bordure-faible">
              {scp.tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-xs px-1.5 py-0.5 rounded-sm border border-bordure text-texte-attenue"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Onglets et suivi de lecture */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-bordure pb-2">
        <div className="flex items-center gap-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'roleplay'}
            onClick={() => setActiveTab('roleplay')}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-mono transition-colors ${
              activeTab === 'roleplay'
                ? 'bg-surface-4 text-texte border border-accent-texte shadow-relief'
                : 'text-texte-attenue hover:text-texte border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('compte.repliques', { n: String(segments.length) })}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'raw'}
            onClick={() => setActiveTab('raw')}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-mono transition-colors ${
              activeTab === 'raw'
                ? 'bg-surface-4 text-texte border border-accent-texte shadow-relief'
                : 'text-texte-attenue hover:text-texte border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('dossier.archiveBrute')}</span>
          </button>
        </div>

        {activeTab === 'roleplay' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sfx.playTerminalBeep();
                scrollToActiveSegment(currentSegmentIndex, true);
              }}
              title={t('dossier.recentrerInfo')}
              className={BOUTON_OUTIL}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{t('dossier.recentrer')}</span>
            </button>

            <label className="inline-flex items-center gap-2 h-8 px-3 rounded text-xs font-mono text-texte-second bg-surface-2 border border-bordure cursor-pointer select-none hover:border-bordure-forte transition-colors">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3.5 h-3.5 cursor-pointer"
                style={{ accentColor: 'var(--accent)' }}
              />
              <span>{t('dossier.suivi')}</span>
            </label>
          </div>
        )}
      </div>

      {/* File « À SUIVRE » : les liens mis de côté sans couper l'écoute. */}
      {readingQueue && onOpenLink && onRemoveFromQueue && onClearQueue && (
        <ReadingQueue
          queue={readingQueue}
          onOpen={onOpenLink}
          onRemove={onRemoveFromQueue}
          onClear={onClearQueue}
        />
      )}

      {activeTab === 'roleplay' ? (
        <div className="space-y-1.5 scp-document">
          {segments.map((segment, index) => {
            const isCurrent = index === currentSegmentIndex;
            const isActivelyPlaying = isCurrent && isPlaying;
            const couleurRole = COULEUR_ROLE[segment.role] || COULEUR_ROLE.narrator;

            // Les marqueurs de journal séparent deux parties du dossier : ils se
            // lisent comme un intertitre, pas comme une réplique.
            if (segment.isLogMarker) {
              return (
                <div
                  key={segment.id}
                  ref={(el) => {
                    segmentRefs.current[index] = el;
                  }}
                  onClick={() => onPlaySegment(index)}
                  className={`cursor-pointer my-5 py-2.5 px-4 rounded border font-mono text-xs uppercase tracking-technique flex items-center justify-center gap-2 transition-colors ${
                    isCurrent
                      ? 'bg-surface-3 border-accent-texte text-texte shadow-lecture'
                      : 'bg-surface-1 border-bordure text-texte-attenue hover:border-bordure-forte'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">{segment.text.toUpperCase()}</span>
                </div>
              );
            }

            return (
              <div
                key={segment.id}
                ref={(el) => {
                  segmentRefs.current[index] = el;
                }}
                onClick={() => {
                  sfx.playTerminalBeep();
                  onPlaySegment(index);
                }}
                style={
                  isCurrent
                    ? undefined
                    : {
                        borderLeftColor: couleurRole,
                        // 6 % : la réplique se rattache à son rôle d'un coup d'œil,
                        // sans que le fond dispute la place au texte.
                        backgroundColor: `color-mix(in srgb, ${couleurRole} 6%, var(--surface-1))`
                      }
                }
                className={`group relative py-3 pl-4 pr-3 rounded-r border-l-4 border-y border-r cursor-pointer transition-colors ${
                  segment.links && segment.links.length > 0 ? 'segment-has-link ' : ''
                }${
                  isActivelyPlaying
                    ? 'bg-surface-3 border-accent-texte shadow-lecture'
                    : isCurrent
                    ? 'bg-surface-2 border-classe-euclid'
                    : 'segment-repos border-y-transparent border-r-transparent'
                }`}
              >
                {/* Qui parle */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className="etiquette-locuteur truncate"
                      style={{ color: isCurrent ? 'var(--texte)' : couleurRole }}
                    >
                      {segment.speaker}
                      {segment.gender === 'female' && (
                        <span className="ml-1 opacity-70" title={t('dossier.personnageFeminin')}>♀</span>
                      )}
                      {segment.gender === 'male' && (
                        <span className="ml-1 opacity-70" title={t('dossier.personnageMasculin')}>♂</span>
                      )}
                    </span>

                    {segment.isHeader && (
                      <span className="font-mono text-xs uppercase tracking-technique text-texte-attenue">
                        {t('dossier.protocole')}
                      </span>
                    )}

                    {isActivelyPlaying && (
                      <span className="flex items-end gap-0.5 h-4 shrink-0" aria-label={t('dossier.lectureEnCours')}>
                        <span className="visualizer-bar" />
                        <span className="visualizer-bar" />
                        <span className="visualizer-bar" />
                      </span>
                    )}

                    {isCurrent && !isPlaying && (
                      <span className="font-mono text-xs text-classe-euclid tracking-technique uppercase">
                        {t('dossier.enPause')}
                      </span>
                    )}
                  </div>

                  {/* Métadonnées secondaires : présentes, mais elles attendent
                      qu'on les cherche au lieu de disputer la place au texte. */}
                  <span className="shrink-0 font-mono text-xs text-transparent group-hover:text-texte-attenue transition-colors tabular-nums">
                    {segment.voiceSignature ? '♪ ' : ''}
                    {segment.id}
                  </span>
                </div>

                {segment.stageDirections && segment.stageDirections.length > 0 && (
                  <p className="font-serif italic text-sm text-texte-attenue mb-1">
                    {segment.stageDirections.map((d, i) => (
                      <span key={i} className="mr-2">({d})</span>
                    ))}
                  </p>
                )}

                <p className={`prose-dossier max-w-lecture ${isCurrent ? 'text-texte' : ''}`}>
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
      ) : (
        <div className="bg-surface-1 border border-bordure rounded p-5 sm:p-7">
          <pre className="prose-dossier max-w-lecture whitespace-pre-wrap font-serif">
            {scp.textContent}
          </pre>
        </div>
      )}

      {/* Crédits et licence — obligation CC BY-SA 3.0, cf. NOTICE-SCP.md */}
      <CreditsDossier
        attributions={scp.attributions}
        url={scp.url}
        titre={scp.title}
        className="mt-6 max-w-lecture"
      />
    </div>
  );
};
