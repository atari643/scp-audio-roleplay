import React from 'react';
import { X, Bookmark, Trash2, Headphones } from 'lucide-react';
import { ScpItemSummary } from '../types/scp';
import { sfx } from '../services/sfxService';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-scp-surface border-2 border-red-800/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Modal Header */}
        <div className="bg-scp-card px-5 py-3.5 border-b border-scp-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold font-mono text-white">
              DOSSIERS SAUVEGARDÉS ({favorites.length})
            </h2>
          </div>
          <button
            onClick={() => {
              sfx.playTerminalBeep();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-scp-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {favorites.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Aucun dossier classifié sauvegardé pour l'instant.</p>
              <p className="mt-1 text-slate-600">Cliquez sur l'étoile d'un dossier pour l'ajouter ici.</p>
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
                className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-scp-card hover:bg-scp-cardHover border border-scp-border hover:border-red-600/60 cursor-pointer transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                      {item.scpNumber}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950/80 text-red-400 border border-red-800/40">
                      {item.objectClass}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">
                    {item.alternateTitle || item.title}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-[10px] font-mono text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Headphones className="w-3 h-3" />
                    Ouvrir
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(item);
                    }}
                    title="Supprimer des favoris"
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
