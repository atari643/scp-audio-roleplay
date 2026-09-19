import React from 'react';

/**
 * Le filet sous l'arbre React.
 *
 * Sans lui, une exception de rendu vide le DOM : l'utilisateur obtient une page
 * blanche, sans message et sans rien à faire. Le cas n'est pas théorique —
 * `src/App.tsx` charge les deux vues en `lazy()`, et un `import()` de chunk qui
 * échoue (onglet resté ouvert pendant un redéploiement, et Vercel comme Pages
 * redéploient à chaque poussée) traverse `<Suspense>`, qui ne rattrape que
 * l'attente, jamais l'erreur.
 *
 * C'est le seul composant de classe du projet : React n'expose `componentDidCatch`
 * que là, il n'existe pas d'équivalent en hook.
 *
 * Volontairement sans dépendance, comme `EcranAttente` : il appartient au paquet
 * d'entrée, et surtout il doit pouvoir s'afficher quand justement quelque chose
 * vient de casser.
 */

interface LimiteErreurProps {
  children: React.ReactNode;
  /**
   * Ce qu'on tente de recharger. Un échec de chunk se répare en rechargeant la
   * page ; le libellé le dit sans jargon.
   */
  contexte?: string;
}

interface LimiteErreurState {
  erreur: Error | null;
}

export class LimiteErreur extends React.Component<LimiteErreurProps, LimiteErreurState> {
  state: LimiteErreurState = { erreur: null };

  static getDerivedStateFromError(erreur: Error): LimiteErreurState {
    return { erreur };
  }

  componentDidCatch(erreur: Error, infos: React.ErrorInfo): void {
    // La console reste le seul endroit où le détail est lisible : le projet
    // n'envoie rien à un service tiers, et c'est une propriété à garder.
    console.error('[LimiteErreur] rendu interrompu', erreur, infos.componentStack);
  }

  private recharger = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    const { erreur } = this.state;
    if (!erreur) return this.props.children;

    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-fond px-6 text-center"
        role="alert"
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-classe-keter">
          Confinement de l'erreur
        </p>

        <h1 className="font-mono text-base font-bold text-texte">
          L'interface a cessé de répondre.
        </h1>

        <p className="max-w-md text-sm leading-relaxed text-texte-second">
          {this.props.contexte
            ? `Le chargement de ${this.props.contexte} a échoué. `
            : ''}
          C'est presque toujours une mise à jour de l'application déployée pendant
          que cet onglet était ouvert. Recharger suffit ; vos favoris, votre
          historique et vos profils de voix sont intacts.
        </p>

        <button
          onClick={this.recharger}
          className="min-h-[44px] rounded border border-bordure bg-surface-1 px-5 font-mono text-xs uppercase tracking-technique text-texte transition-colors hover:bg-surface-2"
        >
          Relancer l'archive
        </button>

        <p className="max-w-md break-words font-mono text-xs text-texte-attenue">
          {erreur.message}
        </p>
      </div>
    );
  }
}
