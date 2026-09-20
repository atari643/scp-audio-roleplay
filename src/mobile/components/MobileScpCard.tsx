import React from 'react';
import { Star, ChevronRight } from 'lucide-react';
import { ScpItemSummary } from '../../types/scp';
import { BadgesEcoute } from '../../components/BadgesEcoute';
import {
  habillageClasse,
  styleBadgeClasse,
  styleLisereClasse,
  styleRegleClasse
} from '../../components/classification';
import type { MetaDossier } from '../../services/corpusFilters';
import { sfx } from '../../services/sfxService';
import { useT } from '../../i18n';

interface MobileScpCardProps {
  item: ScpItemSummary;
  isFavorite: boolean;
  onSelect: (item: ScpItemSummary) => void;
  onToggleFavorite: (item: ScpItemSummary) => void;
  /** Métadonnées d'écoute issues de l'index ; `null` si le dossier n'y est pas. */
  meta?: MetaDossier | null;
}

/**
 * Fiche d'un dossier, version mobile.
 *
 * Même modèle que la fiche de bureau (`ScpCard`) : liseré de classification sur
 * le bord gauche, fond uni, titre en serif. L'ancienne version peignait la carte
 * entière d'un dégradé à la couleur de la classe — sept dégradés qui défilaient
 * les uns sous les autres dans la liste.
 */
export const MobileScpCard: React.FC<MobileScpCardProps> = ({
  item,
  isFavorite,
  meta = null,
  onSelect,
  onToggleFavorite
}) => {
  const t = useT();
  const habillage = habillageClasse(item.objectClass);

  return (
    <article
      onClick={() => {
        sfx.playTerminalBeep();
        onSelect(item);
      }}
      className="relative rounded border border-bordure border-l-4 bg-surface-2 p-3.5 active:bg-surface-3 transition-colors cursor-pointer shadow-relief"
      style={styleLisereClasse(item.objectClass)}
    >
      <div
        className="flex items-center justify-between gap-2 mb-2 pb-2 border-b"
        style={styleRegleClasse(item.objectClass)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-base font-bold text-texte tracking-tight truncate">
            {item.scpNumber || item.slug.toUpperCase()}
          </span>
          <span
            className="shrink-0 font-mono text-xs px-1.5 py-0.5 rounded-sm border uppercase tracking-technique font-semibold"
            style={styleBadgeClasse(item.objectClass)}
          >
            {habillage.abrege}
          </span>
        </div>

        {/* Cible tactile de 44 px, même si l'étoile ne fait que 16 px. */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sfx.playTerminalBeep();
            onToggleFavorite(item);
          }}
          aria-pressed={isFavorite}
          title={isFavorite ? t('favoris.retirer') : t('favoris.classerInfo')}
          className={`shrink-0 -m-2 w-11 h-11 flex items-center justify-center rounded-sm transition-colors ${
            isFavorite ? 'text-classe-euclid' : 'text-texte-attenue active:text-texte'
          }`}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <h3 className="font-serif text-base text-texte leading-snug line-clamp-2 mb-1">
        {item.alternateTitle || item.title}
      </h3>

      {item.snippet && (
        <p className="font-serif text-sm text-texte-attenue leading-relaxed line-clamp-2 mb-2.5">
          {item.snippet}
        </p>
      )}

      {/* Durée, type d'écoute, notoriété — issus de l'index de corpus. */}
      <BadgesEcoute meta={meta} rating={item.rating} compact className="mb-2" />

      <div className="flex items-center justify-between pt-2 border-t border-bordure-faible font-mono text-xs text-texte-attenue">
        <span className="uppercase tracking-technique">{t('dossier.audioDisponible')}</span>
        <span className="flex items-center gap-0.5">
          {t('dossier.consulter')}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
};
