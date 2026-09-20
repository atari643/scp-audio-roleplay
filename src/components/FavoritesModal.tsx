import React from 'react';
import { Bookmark, Trash2, Headphones } from 'lucide-react';
import { FenetreScipnet } from './FenetreScipnet';
import { ScpItemSummary } from '../types/scp';
import { sfx } from '../services/sfxService';
import { useT } from '../i18n';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: ScpItemSummary[];
  onSelectScp: (item: ScpItemSummary) => void;
  onRemoveFavorite: (item: ScpItemSummary) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  onSelectScp,
  onRemoveFavorite
}) => {
  const t = useT();
  return (
    <FenetreScipnet
      isOpen={isOpen}
      onClose={onClose}
      titre={`${t('favoris.titre')} (${favorites.length})`}
      classification="Archive personnelle"
      icone={<Bookmark className="w-4 h-4" />}
      largeur="max-w-lg"
    >
      <div className="p-4 space-y-1.5">
          {favorites.length === 0 ? (
          <div className="text-center py-12 text-texte-attenue font-mono text-xs">
            <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>{t('favoris.aucun')}</p>
            <p className="mt-1">{t('favoris.indice')}</p>
          </div>
          ) : (
            favorites.map((item) => (
              <div
                key={item.slug}
                onClick={() => {
                  sfx.playTerminalBeep();
                  onSelectScp(item);
                  onClose();
                }}
                className="group flex items-center justify-between gap-3 p-3 rounded bg-surface-2 hover:bg-surface-3 border border-bordure hover:border-bordure-forte cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-bold text-texte group-hover:text-accent-texte transition-colors">
                      {item.scpNumber}
                    </span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-surface-3/80 text-accent-texte border border-accent-texte/40">
                      {item.objectClass}
                    </span>
                  </div>
                  <p className="text-xs text-texte-second truncate">
                    {item.alternateTitle || item.title}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-xs font-mono text-accent-texte opacity-0 group-hover:opacity-100 transition-opacity">
                    <Headphones className="w-3 h-3" />
                    {t('general.ouvrir')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(item);
                    }}
                    title={t('favoris.supprimer')}
                    className="p-1.5 text-texte-attenue hover:text-accent-texte rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
      </div>
    </FenetreScipnet>
  );
};
