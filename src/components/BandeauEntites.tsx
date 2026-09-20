import React, { useEffect, useState } from 'react';
import { Building2, User, Radio, Shield, ShieldAlert, Layers, Database } from 'lucide-react';
import { CategorieEntite, Certitude } from '../types/entities';
import { chargerEntites, entitesDuDossier, nomEntite, Rattachement } from '../services/entityService';
import { CleTraduction, useT } from '../i18n';

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

// Une teinte par catégorie, tirée des jetons existants — aucune couleur inventée.
//
// DEUX informations se superposent ici, et il ne faut jamais les confondre :
//
//   la TEINTE dit la catégorie (département, chercheur, faction, site, FIM) ;
//   le TRAIT dit la certitude — plein pour un lien écrit par la communauté
//   (tag, annuaire, origine), pointillé et atténué pour une simple mention
//   repérée dans le texte.
//
// La seconde est un invariant du projet : elle empêche la liste de passer pour un
// inventaire factuel qu'elle n'est pas. Le retour de la couleur ne doit pas
// l'effacer, d'où le choix de porter la catégorie par la teinte et la certitude
// par le trait : deux canaux distincts, jamais le même.
const COULEURS: Record<CategorieEntite, string> = {
  departement: 'text-classe-thaumiel border-classe-thaumiel/45 bg-classe-thaumiel/10 hover:bg-classe-thaumiel/20',
  chercheur: 'text-systeme border-systeme/45 bg-systeme/10 hover:bg-systeme/20',
  faction: 'text-classe-euclid border-classe-euclid/45 bg-classe-euclid/10 hover:bg-classe-euclid/20',
  site: 'text-classe-safe border-classe-safe/45 bg-classe-safe/10 hover:bg-classe-safe/20',
  zone: 'text-classe-safe border-classe-safe/45 bg-classe-safe/10 hover:bg-classe-safe/20',
  fim: 'text-accent-texte border-accent-texte/45 bg-accent-texte/10 hover:bg-accent-texte/20',
  commandement: 'text-texte-second border-bordure bg-surface-2 hover:bg-surface-3'
};

const EXPLICATION: Record<Certitude, CleTraduction> = {
  tag: 'certitude.tag',
  annuaire: 'certitude.annuaire',
  origine: 'certitude.origine',
  mention: 'certitude.mention'
};

interface BandeauEntitesProps {
  slug: string;
  languageCode: string;
  /** Ouvre la fiche d'une entité. Absent : les puces restent informatives. */
  onOuvrirEntite?: (id: string) => void;
}

export const BandeauEntites: React.FC<BandeauEntitesProps> = ({ slug, languageCode, onOuvrirEntite }) => {
  const t = useT();
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
    <div className="mt-4 pt-3 border-t border-bordure-faible">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-texte-attenue">
          {t('entites.rattachements')}
        </span>
        <span className="text-xs font-mono text-texte-attenue">
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
              className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-sm border transition-colors min-h-[44px] sm:min-h-[32px] ${
                COULEURS[entite.categorie]
              } ${estMention ? 'opacity-65 border-dashed' : ''} ${
                onOuvrirEntite ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <Icone className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[190px]">{nomEntite(entite, languageCode)}</span>
              {estMention && <span className="text-xs opacity-70">?</span>}
            </button>
          );
        })}

        {caches > 0 && (
          <button
            type="button"
            onClick={() => setToutAfficher(true)}
            className="text-xs font-mono px-2.5 py-1 rounded-sm border border-bordure text-texte-attenue hover:text-texte min-h-[44px] sm:min-h-[32px]"
          >
            +{caches}
          </button>
        )}
      </div>
    </div>
  );
};
