import React from 'react';
import { Clock, Drama, Gem, Landmark, Mic, Star } from 'lucide-react';
import type { MetaDossier } from '../services/corpusFilters';
import { useT } from '../i18n';

/**
 * Les badges d'écoute d'un dossier : durée, type d'écoute, notoriété, note.
 *
 * Partagé par les deux vues (c'est le rôle de `src/components/`), mais volontairement
 * sans marge ni fond propres : chaque plateforme décide de la taille et du placement.
 * Seule la sémantique — quoi montrer, et avec quel mot — est commune.
 *
 * Le badge de durée est le seul toujours affiché : c'est la question à laquelle
 * l'utilisateur ne pouvait pas répondre avant de cliquer, alors que l'écart va de
 * 2 minutes (SCP-173) à plus d'une heure (SCP-3999).
 */

export interface BadgesEcouteProps {
  meta: MetaDossier | null;
  rating?: number;
  /** `compact` masque l'étiquette textuelle du type d'écoute (cartes mobiles étroites). */
  compact?: boolean;
  className?: string;
}

// Ces pastilles répondent à la question « qu'est-ce que je vais écouter, et
// combien de temps ». Chacune porte sa teinte, mais toutes sont tirées du même
// jeu de jetons que le reste de l'application — aucune couleur inventée ici.
//
//   durée, solo   neutre      le cas ordinaire, une métadonnée pure
//   théâtre       système     plusieurs voix : une propriété technique du dossier
//   patrimoine    euclid      signal rare, doré
//   pépite        système     signal rare, froid
//   note négative accent      la seule alerte de la série
const SOCLE_PASTILLE =
  'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-xs leading-none';

const CLASSE_PASTILLE = `${SOCLE_PASTILLE} border-bordure bg-surface-1 text-texte-attenue`;
const PASTILLE_SYSTEME = `${SOCLE_PASTILLE} border-systeme/45 bg-systeme/10 text-systeme`;
const PASTILLE_PATRIMOINE = `${SOCLE_PASTILLE} border-classe-euclid/45 bg-classe-euclid/10 text-classe-euclid`;

export const BadgesEcoute: React.FC<BadgesEcouteProps> = ({
  meta,
  rating,
  compact = false,
  className = ''
}) => {
  const t = useT();
  // Sans index, on n'affiche rien plutôt qu'une durée inventée.
  if (!meta && rating === undefined) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {meta && (
        <span
          className={CLASSE_PASTILLE}
          title={
            meta.dureeApproximative
              ? t('badge.paginee')
              : t('badge.duree')
          }
        >
          <Clock className="w-3 h-3" />
          {meta.duree}
        </span>
      )}

      {meta && meta.ecoute === 'theatre' && (
        <span
          className={PASTILLE_SYSTEME}
          title={`${meta.voix} voix distinctes, ${meta.partDialogue} % de dialogue`}
        >
          <Drama className="w-3 h-3" />
          {compact ? `${meta.voix}` : t('badge.theatre', { voix: String(meta.voix) })}
        </span>
      )}

      {meta && meta.ecoute === 'solo' && (
        <span
          className={CLASSE_PASTILLE}
          title={t('badge.narre')}
        >
          <Mic className="w-3 h-3" />
          {compact ? '1' : 'Solo'}
        </span>
      )}

      {meta?.notoriete === 'patrimoine' && (
        <span
          className={PASTILLE_PATRIMOINE}
          title={t('badge.populaire')}
        >
          <Landmark className="w-3 h-3" />
          {compact ? '' : 'Patrimoine'}
        </span>
      )}

      {meta?.notoriete === 'pepite' && (
        <span
          className={PASTILLE_SYSTEME}
          title={t('badge.meconnu')}
        >
          <Gem className="w-3 h-3" />
          {compact ? '' : t('badge.pepite')}
        </span>
      )}

      {rating !== undefined && (
        <span
          className={`${CLASSE_PASTILLE} ${rating < 0 ? '!text-accent-texte' : ''}`}
          title={t('badge.note')}
        >
          <Star className="w-3 h-3" />
          {rating >= 0 ? `+${rating}` : rating}
        </span>
      )}
    </div>
  );
};
