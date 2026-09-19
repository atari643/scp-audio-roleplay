import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, ChevronRight, Database, Layers, Radio, Search, Shield, ShieldAlert, User } from 'lucide-react';
import { CATEGORIES, CategorieEntite, Entite } from '../../types/entities';
import {
  chargerEntites,
  chercherEntites,
  compterDossiers,
  dossiersDeLEntite,
  entitesParCategorie,
  nomEntite,
  pageSourceEntite,
  resumeEntite
} from '../../services/entityService';
import { sfx } from '../../services/sfxService';
import { MentionSourceWiki } from '../../components/MentionSourceWiki';

/**
 * Le répertoire de la Fondation, pensé pour le pouce.
 *
 * Jusqu'ici `MobileApp` montait la fenêtre SCiPNET du desktop telle quelle : un cadre
 * Windows 2000 en `max-w-6xl` avec un arbre de 256 px, sur un écran de téléphone.
 * Cet écran-ci reprend les mêmes données (`entityService`) mais la navigation d'un
 * mobile : une liste de catégories, puis une liste d'entités, cibles ≥ 44 px, rien
 * qui déborde en largeur.
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
  departement: 'text-classe-thaumiel border-classe-thaumiel/60',
  chercheur: 'text-role-agent border-role-agent/60',
  faction: 'text-classe-euclid border-classe-euclid/60',
  site: 'text-classe-safe border-classe-safe/60',
  zone: 'text-classe-safe border-classe-safe/60',
  fim: 'text-accent-texte border-accent-texte/60',
  commandement: 'text-texte-second border-bordure/60'
};

interface MobileEntitesScreenProps {
  languageCode: string;
  /** Ouvre un dossier. Ferme l'écran côté appelant. */
  onSelectScpSlug: (slug: string) => void;
}

export const MobileEntitesScreen: React.FC<MobileEntitesScreenProps> = ({
  languageCode,
  onSelectScpSlug
}) => {
  const [categorie, setCategorie] = useState<CategorieEntite | null>(null);
  const [entiteOuverte, setEntiteOuverte] = useState<Entite | null>(null);
  const [recherche, setRecherche] = useState('');
  const [indexPret, setIndexPret] = useState(0);

  useEffect(() => {
    let vivant = true;
    chargerEntites(languageCode).then(() => {
      if (vivant) setIndexPret(n => n + 1);
    });
    return () => {
      vivant = false;
    };
  }, [languageCode]);

  const listes = useMemo(() => {
    const table = {} as Record<CategorieEntite, Entite[]>;
    for (const cat of CATEGORIES) table[cat.id] = entitesParCategorie(cat.id, languageCode);
    return table;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageCode, indexPret]);

  const resultats = recherche.trim() ? chercherEntites(recherche, languageCode) : null;

  // ------------------------------------------------------------- fiche d'entité
  if (entiteOuverte) {
    const dossiers = dossiersDeLEntite(entiteOuverte.id, languageCode);
    const { confirmes, mentions } = compterDossiers(entiteOuverte.id, languageCode);
    const Icone = ICONES[entiteOuverte.categorie];
    // Le résumé vient toujours de la branche affichée — pas de repli de langue —
    // donc c'est sa page qu'on cite.
    const resume = resumeEntite(entiteOuverte, languageCode);
    const pageSource = resume ? pageSourceEntite(entiteOuverte, languageCode) : undefined;

    return (
      <div className="px-3 pb-28">
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            setEntiteOuverte(null);
          }}
          className="flex items-center gap-2 text-texte-second font-mono text-sm min-h-[44px] px-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className={`mt-1 p-3 rounded-lg bg-surface-1/80 border ${COULEURS[entiteOuverte.categorie]}`}>
          <div className="flex items-start gap-2">
            <Icone className={`w-5 h-5 shrink-0 mt-0.5 ${COULEURS[entiteOuverte.categorie].split(' ')[0]}`} />
            <div className="min-w-0">
              <h2 className="font-mono font-bold text-texte text-base break-words">
                {nomEntite(entiteOuverte, languageCode)}
              </h2>
              {entiteOuverte.designation && (
                <p className="text-xs font-mono text-texte-attenue mt-0.5">{entiteOuverte.designation}</p>
              )}
            </div>
          </div>

          {resume && (
            <>
              <p className="mt-2.5 text-xs text-texte-second leading-relaxed break-words">
                {resume}
              </p>
              {/*
                Ce résumé est repris mot pour mot de l'annuaire du wiki, donc sous
                CC BY-SA 3.0 : la source est obligatoire, et `pages` la porte déjà
                par branche. Même mention que sur ordinateur, même composant.
              */}
              {pageSource && (
                <MentionSourceWiki
                  url={pageSource}
                  titre={nomEntite(entiteOuverte, languageCode)}
                  intro="Résumé repris de"
                  className="mt-2 break-words"
                />
              )}
            </>
          )}

          <p className="mt-2.5 text-xs font-mono text-texte-attenue">
            {confirmes} dossier{confirmes > 1 ? 's' : ''} confirmé{confirmes > 1 ? 's' : ''}
            {mentions > 0 && ` · ${mentions} mention${mentions > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="mt-3 space-y-1.5">
          {dossiers.slice(0, 80).map(slug => (
            <button
              key={slug}
              onClick={() => {
                sfx.playTerminalBeep();
                onSelectScpSlug(slug);
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface-1/70 border border-bordure flex items-center justify-between gap-2 active:bg-surface-2"
            >
              <span className="font-mono text-xs text-texte truncate">{slug.toUpperCase()}</span>
              <ChevronRight className="w-4 h-4 text-accent-texte shrink-0" />
            </button>
          ))}
          {dossiers.length === 0 && (
            <p className="text-xs font-mono text-texte-attenue px-1 py-4">
              Aucun dossier rattaché sur cette branche.
            </p>
          )}
          {dossiers.length > 80 && (
            <p className="text-xs font-mono text-texte-attenue px-1 pt-1">
              {dossiers.length - 80} autres — les mieux notés d'abord.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------ liste d'une catégorie
  if (categorie && !resultats) {
    const liste = listes[categorie] ?? [];
    const cat = CATEGORIES.find(c => c.id === categorie);
    return (
      <div className="px-3 pb-28">
        <button
          onClick={() => {
            sfx.playTerminalBeep();
            setCategorie(null);
          }}
          className="flex items-center gap-2 text-texte-second font-mono text-sm min-h-[44px] px-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{cat?.pluriel}</span>
          <span className="text-texte-attenue">({liste.length})</span>
        </button>

        <div className="space-y-1.5 mt-1">
          {liste.map(entite => (
            <LigneEntite
              key={entite.id}
              entite={entite}
              languageCode={languageCode}
              onOuvrir={() => {
                sfx.playTerminalBeep();
                setEntiteOuverte(entite);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ écran d'accueil
  return (
    <div className="px-3 pb-28">
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-texte-attenue absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Chercher une entité…"
          className="w-full min-h-[44px] pl-9 pr-3 rounded-lg bg-surface-1/80 border border-bordure text-sm font-mono text-texte placeholder:text-texte-attenue focus:outline-none focus:border-accent-texte"
        />
      </div>

      {resultats ? (
        <div className="space-y-1.5">
          {resultats.map(entite => (
            <LigneEntite
              key={entite.id}
              entite={entite}
              languageCode={languageCode}
              onOuvrir={() => {
                sfx.playTerminalBeep();
                setEntiteOuverte(entite);
              }}
            />
          ))}
          {resultats.length === 0 && (
            <p className="text-xs font-mono text-texte-attenue px-1 py-4">Aucune entité ne correspond.</p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {CATEGORIES.map(cat => {
            const Icone = ICONES[cat.id];
            const n = (listes[cat.id] ?? []).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sfx.playTerminalBeep();
                  setCategorie(cat.id);
                }}
                className={`w-full min-h-[56px] px-3 py-2.5 rounded-lg bg-surface-1/70 border ${COULEURS[cat.id]} flex items-center justify-between gap-3 active:bg-surface-2`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icone className={`w-5 h-5 shrink-0 ${COULEURS[cat.id].split(' ')[0]}`} />
                  <span className="font-mono text-sm text-texte truncate">{cat.pluriel}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-xs text-texte-attenue">{n}</span>
                  <ChevronRight className="w-4 h-4 text-texte-attenue" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const LigneEntite: React.FC<{
  entite: Entite;
  languageCode: string;
  onOuvrir: () => void;
}> = ({ entite, languageCode, onOuvrir }) => {
  const dossiers = dossiersDeLEntite(entite.id, languageCode).length;
  return (
    <button
      onClick={onOuvrir}
      className="w-full min-h-[48px] px-3 py-2 rounded-lg bg-surface-1/70 border border-bordure flex items-center justify-between gap-2 active:bg-surface-2 text-left"
    >
      <span className="font-mono text-xs text-texte truncate">{nomEntite(entite, languageCode)}</span>
      <span className="font-mono text-xs text-texte-attenue shrink-0">{dossiers}</span>
    </button>
  );
};
