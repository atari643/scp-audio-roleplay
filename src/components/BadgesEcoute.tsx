import React from 'react';
import { Clock, Drama, Gem, Landmark, Mic, Star } from 'lucide-react';
import type { MetaDossier } from '../services/corpusFilters';

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

const CLASSE_PASTILLE =
  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] leading-none';

export const BadgesEcoute: React.FC<BadgesEcouteProps> = ({
  meta,
  rating,
  compact = false,
  className = ''
}) => {
  // Sans index, on n'affiche rien plutôt qu'une durée inventée.
  if (!meta && rating === undefined) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {meta && (
        <span
          className={`${CLASSE_PASTILLE} bg-slate-800/80 text-slate-300 border border-slate-700`}
          title={
            meta.dureeApproximative
              ? 'Dossier paginé : seule la première page est mesurée, la durée réelle est supérieure.'
              : 'Durée d’écoute estimée à 150 mots/minute.'
          }
        >
          <Clock className="w-3 h-3 text-slate-400" />
          {meta.duree}
        </span>
      )}

      {meta && meta.ecoute === 'theatre' && (
        <span
          className={`${CLASSE_PASTILLE} bg-purple-950/70 text-purple-300 border border-purple-800/70`}
          title={`${meta.voix} voix distinctes, ${meta.partDialogue} % de dialogue`}
        >
          <Drama className="w-3 h-3" />
          {compact ? `${meta.voix}` : `Théâtre · ${meta.voix} voix`}
        </span>
      )}

      {meta && meta.ecoute === 'solo' && (
        <span
          className={`${CLASSE_PASTILLE} bg-slate-800/60 text-slate-400 border border-slate-700/70`}
          title="Lecture narrée, presque sans dialogue"
        >
          <Mic className="w-3 h-3" />
          {compact ? '1' : 'Solo'}
        </span>
      )}

      {meta?.notoriete === 'patrimoine' && (
        <span
          className={`${CLASSE_PASTILLE} bg-amber-950/70 text-amber-300 border border-amber-800/70`}
          title="Parmi les mieux notés et les plus lus de son année"
        >
          <Landmark className="w-3 h-3" />
          {compact ? '' : 'Patrimoine'}
        </span>
      )}

      {meta?.notoriete === 'pepite' && (
        <span
          className={`${CLASSE_PASTILLE} bg-cyan-950/70 text-cyan-300 border border-cyan-800/70`}
          title="Excellent pour sa génération, mais resté sous les radars"
        >
          <Gem className="w-3 h-3" />
          {compact ? '' : 'Pépite'}
        </span>
      )}

      {rating !== undefined && (
        <span
          className={`${CLASSE_PASTILLE} ${
            rating >= 0 ? 'text-slate-400' : 'text-red-400'
          }`}
          title="Note de la communauté Wikidot"
        >
          <Star className="w-3 h-3" />
          {rating >= 0 ? `+${rating}` : rating}
        </span>
      )}
    </div>
  );
};
