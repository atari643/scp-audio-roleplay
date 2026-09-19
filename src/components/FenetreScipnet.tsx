import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface FenetreScipnetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Titre technique affiché dans la barre, en monospace. */
  titre: string;
  /** Mention de classification à droite de la barre (« RESTREINT · CL-4 »). */
  classification?: string;
  /** Icône de la barre de titre, déjà dimensionnée par l'appelant. */
  icone?: React.ReactNode;
  /** Largeur maximale, en classes Tailwind. */
  largeur?: string;
  /** Hauteur : `auto` s'adapte au contenu, `pleine` occupe la fenêtre. */
  hauteur?: 'auto' | 'pleine';
  /** Barre d'état optionnelle, collée en bas de la fenêtre. */
  barreEtat?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Chrome unique des fenêtres modales du terminal SCiPNET.
 *
 * Avant, quatre modales pour deux chromes : une fausse fenêtre Windows 2000
 * biseautée (explorateur, fiche d'entité) et un panneau arrondi bordé de rouge
 * (studio des voix, favoris). Un seul poste de travail ne mélange pas deux
 * habillages — d'où cette enveloppe commune.
 *
 * Elle apporte au passage ce qui manquait aux quatre : fermeture par `Échap`,
 * focus déplacé dans la fenêtre à l'ouverture puis rendu à l'élément d'origine,
 * piège de tabulation, et le verrouillage du défilement de la page en dessous.
 */
export const FenetreScipnet: React.FC<FenetreScipnetProps> = ({
  isOpen,
  onClose,
  titre,
  classification,
  icone,
  largeur = 'max-w-4xl',
  hauteur = 'auto',
  barreEtat,
  children
}) => {
  const fenetreRef = useRef<HTMLDivElement>(null);
  const declencheurRef = useRef<HTMLElement | null>(null);

  // Le focus doit revenir d'où il venait à la fermeture : sans ça, la
  // tabulation repart du haut de la page à chaque aller-retour.
  useEffect(() => {
    if (!isOpen) return;
    declencheurRef.current = document.activeElement as HTMLElement | null;
    const premier = fenetreRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    premier?.focus();
    return () => declencheurRef.current?.focus?.();
  }, [isOpen]);

  // Le défilement de la page derrière la modale donne l'impression que le clic
  // a raté sa cible.
  useEffect(() => {
    if (!isOpen) return;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = precedent;
    };
  }, [isOpen]);

  const gererTouche = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      // Piège de tabulation : la modale ne doit pas laisser filer le focus vers
      // la page qu'elle recouvre.
      const focusables = fenetreRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={gererTouche}
    >
      <div
        ref={fenetreRef}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className={`w-full ${largeur} ${
          hauteur === 'pleine' ? 'h-[92vh] max-h-[880px]' : 'max-h-[92vh]'
        } bg-surface-1 win2k-window flex flex-col overflow-hidden animate-fade-scale`}
      >
        {/* Barre de titre : la mention de classification y tient lieu de
            décoration, ce qui évite d'en ajouter une ailleurs. */}
        <div className="shrink-0 flex items-center gap-2 h-10 px-3 bg-surface-4 border-b border-bordure-forte font-mono text-xs shadow-relief">
          {icone && <span className="text-accent-texte shrink-0">{icone}</span>}
          <span className="font-semibold tracking-technique uppercase text-texte truncate">
            {titre}
          </span>

          {classification && (
            <span className="hidden sm:inline text-texte-second tracking-technique truncate">
              · {classification}
            </span>
          )}

          <button
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="ml-auto shrink-0 w-7 h-7 flex items-center justify-center rounded-sm border border-bordure-forte text-texte-second hover:bg-accent hover:border-accent hover:text-texte transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`flex-1 min-h-0 ${
            hauteur === 'pleine' ? 'flex flex-col' : 'overflow-y-auto'
          }`}
        >
          {children}
        </div>

        {barreEtat && (
          <div className="shrink-0 win2k-statusbar px-3 py-1.5 tracking-technique">{barreEtat}</div>
        )}
      </div>
    </div>
  );
};
