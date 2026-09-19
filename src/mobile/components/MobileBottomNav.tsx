import React from 'react';
import { BookOpen, FileText, Headphones, Database, Sliders } from 'lucide-react';
import { sfx } from '../../services/sfxService';

export type MobileTab = 'catalog' | 'reader' | 'audio' | 'scipnet' | 'settings';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  hasActiveDossier: boolean;
  isPlaying: boolean;
  hasAudioLoaded: boolean;
}

interface Onglet {
  cle: MobileTab;
  libelle: string;
  icone: React.ComponentType<{ className?: string }>;
}

const ONGLETS: Onglet[] = [
  { cle: 'catalog', libelle: 'Archives', icone: BookOpen },
  { cle: 'reader', libelle: 'Dossier', icone: FileText },
  { cle: 'audio', libelle: 'Audio', icone: Headphones },
  { cle: 'scipnet', libelle: 'SCiPNET', icone: Database },
  { cle: 'settings', libelle: 'Réglages', icone: Sliders }
];

/**
 * Navigation principale du mobile.
 *
 * L'onglet actif se signale par un filet d'accent au-dessus de l'icône, comme
 * un intercalaire de dossier. L'ancienne version empilait trois animations en
 * boucle — casque rebondissant, double halo cyan, point clignotant sur
 * « Dossier » — dans une barre où rien n'appelait réellement l'attention.
 * Seule reste la pastille d'écoute, et elle ne bouge pas.
 *
 * Chaque cible fait 56 px de haut : au-dessus du plancher tactile de 44 px.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasActiveDossier,
  isPlaying
}) => {
  const handleTabClick = (tab: MobileTab) => {
    sfx.playTerminalBeep();
    onSelectTab(tab);
  };

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-1/97 border-t border-bordure backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {ONGLETS.map(({ cle, libelle, icone: Icone }) => {
          const actif = activeTab === cle;
          const inaccessible = cle === 'reader' && !hasActiveDossier;

          return (
            <button
              key={cle}
              onClick={() => handleTabClick(inaccessible ? 'catalog' : cle)}
              aria-current={actif ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-14 px-1 transition-colors ${
                actif
                  ? 'text-accent-texte'
                  : inaccessible
                  ? 'text-texte-attenue/50'
                  : 'text-texte-attenue active:text-texte'
              }`}
            >
              {/* Intercalaire : le filet remplace le fond teinté et la bordure. */}
              <span
                className={`absolute top-0 inset-x-3 h-0.5 ${actif ? 'bg-accent-texte' : 'bg-transparent'}`}
                aria-hidden="true"
              />

              <Icone className="w-5 h-5" />
              <span className="font-mono text-xs tracking-tight">
                {cle === 'audio' && isPlaying ? 'Écoute' : libelle}
              </span>

              {/* Pastille d'écoute : présente, immobile. */}
              {cle === 'audio' && isPlaying && (
                <span
                  className="absolute top-2 right-1/4 w-1.5 h-1.5 rounded-full bg-accent-texte"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
