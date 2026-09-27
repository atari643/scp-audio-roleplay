import { useCallback, useEffect, useRef, useState } from 'react';
import { partagerLien } from '../../services/lienPartage';

/** Ce que le bouton affiche : son libellé normal, ou le résultat de la copie. */
export type EtatBoutonPartage = 'repos' | 'copie' | 'echec';

/** Assez pour lire « Lien copié », pas assez pour que le bouton paraisse bloqué. */
const DUREE_RETOUR = 2000;

/**
 * Le bouton « Partager » des deux lecteurs.
 *
 * Commun aux vues bureau et mobile parce que le comportement est le même ; seul le
 * rendu diffère — libellé sur ordinateur, icône seule sur téléphone. La feuille
 * native n'a pas de retour à afficher : c'est le système qui confirme.
 */
export function usePartage() {
  const [etat, setEtat] = useState<EtatBoutonPartage>('repos');
  const minuterie = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(minuterie.current), []);

  const partager = useCallback(async (adresse: string, titre: string, natif: boolean) => {
    const issue = await partagerLien(adresse, titre, natif);
    if (issue !== 'copie' && issue !== 'echec') return;

    setEtat(issue);
    window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => setEtat('repos'), DUREE_RETOUR);
  }, []);

  return { etat, partager };
}
