import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { ScpItemSummary } from '../types/scp';
import { sfx } from '../services/sfxService';
import { prefetchScpDossier } from '../services/queryClient';
import { BadgesEcoute } from './BadgesEcoute';
import {
  habillageClasse,
  styleBadgeClasse,
  styleLisereClasse,
  styleRegleClasse
} from './classification';
import type { MetaDossier } from '../services/corpusFilters';
import { useT } from '../i18n';

interface ScpCardProps {
  item: ScpItemSummary;
  isFavorite: boolean;
  languageCode: string;
  /** Métadonnées d'écoute issues de l'index ; `null` si le dossier n'y est pas. */
  meta?: MetaDossier | null;
  onSelect: (item: ScpItemSummary) => void;
  onToggleFavorite: (item: ScpItemSummary, e: React.MouseEvent) => void;
}

/**
 * Fiche d'un dossier au catalogue.
 *
 * Elle est pensée comme une fiche cartonnée, pas comme une carte d'application :
 * angles droits, fond uni, et une seule couleur — le liseré de classification sur
 * le bord gauche. L'ancienne version cumulait un filigrane de classe en corps 60,
 * un point rouge clignotant, une mention « SECTEUR-19 » décorative et un pied
 * « AUDIO ROLEPLAY » à radio pulsante ; le titre du dossier, lui, était en corps
 * 14. La hiérarchie est remise à l'endroit : numéro, titre, extrait.
 */
export const ScpCard: React.FC<ScpCardProps> = ({
  item,
  isFavorite,
  languageCode,
  meta = null,
  onSelect,
  onToggleFavorite
}) => {
  const t = useT();
  const habillage = habillageClasse(item.objectClass);

  const precharger = () => {
    prefetchScpDossier(item.slug, languageCode);
  };

  return (
    <article
      onClick={() => {
        sfx.playTerminalBeep();
        onSelect(item);
      }}
      onMouseEnter={precharger}
      onTouchStart={precharger}
      className="group relative flex flex-col justify-between bg-surface-2 hover:bg-surface-3 border border-bordure hover:border-bordure-forte border-l-4 rounded p-4 cursor-pointer transition-colors shadow-relief"
      style={styleLisereClasse(item.objectClass)}
    >
      <div>
        {/* Référence du document et classement personnel */}
        <div
          className="flex items-center justify-between gap-2 mb-3 pb-2 border-b"
          style={styleRegleClasse(item.objectClass)}
        >
          <span className="flex items-center gap-1.5 font-mono text-xs tracking-technique truncate">
            <span style={{ color: habillage.couleur }}>{habillage.abrege}</span>
            <span className="text-bordure-forte" aria-hidden="true">/</span>
            <span className="text-texte-attenue truncate">{item.scpNumber.toUpperCase()}</span>
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item, e);
            }}
            title={isFavorite ? t('favoris.retirer') : t('favoris.classerInfo')}
            aria-pressed={isFavorite}
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-sm border transition-colors ${
              isFavorite
                ? 'border-classe-euclid text-classe-euclid'
                : 'border-bordure text-texte-attenue hover:text-classe-euclid hover:border-classe-euclid'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Numéro et classe */}
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="font-mono text-xl font-bold text-texte group-hover:text-accent-texte transition-colors tracking-tight">
            {item.scpNumber}
          </span>

          <span
            className="shrink-0 font-mono text-xs font-semibold uppercase tracking-technique px-2 py-0.5 rounded-sm border"
            style={styleBadgeClasse(item.objectClass)}
          >
            {item.objectClass}
          </span>
        </div>

        {/* Titre : en serif, comme dans le dossier lui-même. */}
        <h3 className="font-serif text-base text-texte leading-snug mb-1.5 line-clamp-2">
          {item.alternateTitle ? item.alternateTitle : item.title}
        </h3>

        {item.snippet && (
          <p className="font-serif text-sm text-texte-attenue leading-relaxed line-clamp-2 mb-3">
            {item.snippet}
          </p>
        )}
      </div>

      {/* Durée, type d'écoute, notoriété, note — issus de l'index de corpus. */}
      <div>
        <BadgesEcoute meta={meta} rating={item.rating} className="pt-2" />

        <div className="mt-2 pt-2 border-t border-bordure-faible flex items-center justify-between font-mono text-xs text-texte-attenue">
          <span className="tracking-technique uppercase">Audio</span>
          <span className="flex items-center gap-1 group-hover:text-accent-texte transition-colors">
            Ouvrir
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  );
};
