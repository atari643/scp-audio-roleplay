import React, { useEffect, useState } from 'react';
import { Building2, User, Radio, Shield, ShieldAlert, Layers, Database } from 'lucide-react';
import { CategorieEntite, Certitude } from '../types/entities';
import { chargerEntites, entitesDuDossier, nomEntite, Rattachement } from '../services/entityService';

/**
 * Les entités auxquelles un dossier est rattaché, sous son en-tête.
 *
 * C'est la circulation qui manquait : jusqu'ici on pouvait aller d'une entité vers ses
 * dossiers (par une liste tapée à la main), jamais d'un dossier vers son site, sa
 * force d'intervention, sa faction ou ses personnages.
 *
 * Le bandeau distingue le CONFIRMÉ du PROBABLE, et ce n'est pas cosmétique : « tag »,
 * « annuaire » et « origine » sont des liens que la communauté a écrits, « mention »
 * est une inférence de notre part sur le texte. Les présenter pareillement referait le
 * défaut qu'on vient de retirer — une liste d'apparence factuelle qui ne l'est pas.
 *
 * Composant PARTAGÉ : il s'affiche sur desktop et sur mobile, vérifier les deux.
 */

const ICONES: Record<CategorieEntite, React.ComponentType<{ className?: string }>> = {
  departement: Building2,
  chercheur: User,
  faction: Radio,
  site: Shield,
  zone: ShieldAlert,
  fim: Layers,
  commandement: Database
};

const COULEURS: Record<CategorieEntite, string> = {
  departement: 'border-purple-700/60 bg-purple-950/40 text-purple-300 hover:border-purple-500',
  chercheur: 'border-cyan-700/60 bg-cyan-950/40 text-cyan-300 hover:border-cyan-500',
  faction: 'border-amber-700/60 bg-amber-950/40 text-amber-300 hover:border-amber-500',
  site: 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:border-emerald-500',
  zone: 'border-lime-700/60 bg-lime-950/40 text-lime-300 hover:border-lime-500',
  fim: 'border-red-700/60 bg-red-950/40 text-red-300 hover:border-red-500',
  commandement: 'border-slate-600/60 bg-slate-800/40 text-slate-300 hover:border-slate-400'
};

const EXPLICATION: Record<Certitude, string> = {
  tag: 'Le dossier porte le tag de cette entité sur le wiki.',
  annuaire: "L'annuaire de la Fondation cite ce dossier sous cette entité.",
  origine: "Hérité de l'article original dont ce dossier est la traduction.",
  mention: 'Le texte nomme cette entité, sans que le wiki le déclare.'
};

interface BandeauEntitesProps {
  slug: string;
  languageCode: string;
  /** Ouvre la fiche d'une entité. Absent : les puces restent informatives. */
  onOuvrirEntite?: (id: string) => void;
}

export const BandeauEntites: React.FC<BandeauEntitesProps> = ({ slug, languageCode, onOuvrirEntite }) => {
  const [rattachements, setRattachements] = useState<Rattachement[]>([]);
  const [toutAfficher, setToutAfficher] = useState(false);

  useEffect(() => {
    let vivant = true;
    chargerEntites(languageCode).then(() => {
      if (vivant) setRattachements(entitesDuDossier(slug, languageCode));
    });
    return () => {
      vivant = false;
    };
  }, [slug, languageCode]);

  if (rattachements.length === 0) return null;

  // `entitesDuDossier` rend déjà les certitudes dans l'ordre : le confirmé d'abord.
  const confirmes = rattachements.filter(r => r.certitude !== 'mention');
  const mentions = rattachements.filter(r => r.certitude === 'mention');
  const visibles = toutAfficher ? rattachements : [...confirmes, ...mentions.slice(0, 4)];
  const caches = rattachements.length - visibles.length;

  return (
    <div className="mt-3 pt-3 border-t border-scp-border/60">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Rattachements
        </span>
        <span className="text-[10px] font-mono text-slate-600">
          {confirmes.length} confirmé{confirmes.length > 1 ? 's' : ''}
          {mentions.length > 0 && ` · ${mentions.length} mention${mentions.length > 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {visibles.map(({ entite, certitude }) => {
          const Icone = ICONES[entite.categorie];
          const estMention = certitude === 'mention';
          return (
            <button
              key={`${entite.id}-${certitude}`}
              type="button"
              onClick={() => onOuvrirEntite?.(entite.id)}
              disabled={!onOuvrirEntite}
              title={`${nomEntite(entite, languageCode)} — ${EXPLICATION[certitude]}`}
              className={`flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded border transition-colors min-h-[32px] ${
                COULEURS[entite.categorie]
              } ${estMention ? 'opacity-60 border-dashed' : ''} ${
                onOuvrirEntite ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <Icone className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[190px]">{nomEntite(entite, languageCode)}</span>
              {estMention && <span className="text-[9px] opacity-70">?</span>}
            </button>
          );
        })}

        {caches > 0 && (
          <button
            type="button"
            onClick={() => setToutAfficher(true)}
            className="text-[11px] font-mono px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 min-h-[32px]"
          >
            +{caches}
          </button>
        )}
      </div>
    </div>
  );
};
