/**
 * Le dictionnaire de référence.
 *
 * Le français est la langue d'origine du projet : c'est ici que les textes sont
 * écrits, et les neuf autres branches en sont la traduction. Ce fichier est le
 * seul embarqué dans le paquet d'entrée — les autres arrivent en `import()`, et
 * sans lui l'application afficherait des clés nues pendant le chargement.
 *
 * Les clés sont nommées par domaine (`lecteur.`, `entites.`, `roles.`) pour que
 * les libellés partagés — « Fermer », « Rechercher » — ne soient écrits qu'une
 * fois. Le type `CleTraduction` en découle : ajouter une clé ici la rend
 * obligatoire partout ailleurs, et `tsc` refuse une traduction incomplète.
 */
export const FR = {
  // --- Rôles, affichés à chaque réplique pendant toute la lecture -----------
  'roles.narrateur': 'Archiviste',
  'roles.chercheur': 'Chercheur',
  'roles.anomalie': 'Entité SCP',
  'roles.classeD': 'Classe-D',
  'roles.agent': 'Agent FIM',
  'roles.commandement': 'Commandement',
  'roles.intercom': 'Intercom',
  'roles.terminal': 'Terminal',
  'roles.noteBasDePage': 'Note de bas de page',

  // --- Lecteur audio --------------------------------------------------------
  'lecteur.progression': 'Progression de la lecture',
  'lecteur.transmission': 'Transmission en cours…',
  'lecteur.enPause': 'Lecture en pause',
  'lecteur.repliquePrecedente': 'Réplique précédente',
  'lecteur.repliqueSuivante': 'Réplique suivante',
  'lecteur.reculer': 'Reculer de 5 secondes',
  'lecteur.avancer': 'Avancer de 5 secondes',
  'lecteur.lire': 'Démarrer la lecture',
  'lecteur.pause': 'Mettre en pause',
  'lecteur.arreter': 'Arrêter la lecture',
  'lecteur.arreterInfo': 'Arrêter et réinitialiser',
  'lecteur.couperSon': 'Couper le son',
  'lecteur.retablirSon': 'Rétablir le son',
  'lecteur.volume': 'Volume',
  'lecteur.studioVoix': 'Studio des voix et attribution des rôles',
  'lecteur.ouvrirStudio': 'Ouvrir le studio des voix',
  'lecteur.voixSecours': 'VOIX DE SECOURS',
  'lecteur.voixSecoursInfo':
    "Voix du navigateur : le moteur neural n'est pas joignable depuis cet hébergement. Ouvrez le studio des voix pour réessayer.",
  'lecteur.voixSecoursMobile': 'VOIX DE SECOURS — appuyez pour réessayer',
  'lecteur.voixSecoursCourt': 'SECOURS',

  'lecteur.reduire': 'Réduire',
  'lecteur.agrandir': 'Agrandir le lecteur',
  'lecteur.segmentSuivant': 'Segment suivant',
  'lecteur.voixIA': 'Voix IA',
  'lecteur.listeSegments': 'Liste des segments',
  'lecteur.indexDialogues': 'INDEX DES DIALOGUES',
  'lecteur.diffusion': 'Diffusion audio SCiPNET…',
  'lecteur.segment': 'SEGMENT',
  'lecteur.aucunFlux': 'AUCUN FLUX AUDIO ACTIF',
  'lecteur.aucunFluxInfo':
    'Sélectionnez un dossier SCP dans les archives pour charger la transcription vocale multi-personnages.',
  'lecteur.configurerStudio': 'Configurer le studio des voix',
  'lecteur.voixSecoursCourtInfo':
    "Voix du navigateur : le moteur neural n'est pas joignable. Ouvrez le lecteur pour réessayer.",

  // --- Répertoire d'entités -------------------------------------------------
  'entites.retour': 'Retour',
  'entites.aucunDossierBranche': 'Aucun dossier rattaché sur cette branche.',
  'entites.autresDossiers': "{n} autres — les mieux notés d'abord.",
  'entites.chercher': 'Chercher une entité…',
  'entites.aucuneEntite': 'Aucune entité ne correspond.',
  'categorie.departement': 'Département',
  'categorie.departement.pluriel': 'Départements',
  'categorie.chercheur': 'Personnel',
  'categorie.chercheur.pluriel': 'Personnel scientifique',
  'categorie.faction': "Groupe d'Intérêt",
  'categorie.faction.pluriel': "Groupes d'Intérêt",
  'categorie.site': 'Site',
  'categorie.site.pluriel': 'Sites',
  'categorie.zone': 'Zone',
  'categorie.zone.pluriel': 'Zones',
  'categorie.fim': "Force d'Intervention",
  'categorie.fim.pluriel': "Forces d'Intervention Mobiles",
  'categorie.commandement': 'Commandement',
  'categorie.commandement.pluriel': 'Commandement',
  'entites.resumeRepris': 'Résumé repris de',
  'entites.dossierConfirme': 'dossier confirmé',
  'entites.dossiersConfirmes': 'dossiers confirmés',
  'entites.mention': 'mention',
  'entites.mentions': 'mentions',

  // --- Crédits et licence ---------------------------------------------------
  'credits.titre': 'Crédits',
  'credits.aria': 'Crédits et licence du dossier',
  'credits.nonRenseignes': "Crédits non renseignés dans l'index : ils figurent sur la page d'origine.",
  'credits.citation': '« {titre} »',
  'credits.pageOrigine': "page d'origine sur le wiki",
  'credits.publieeSous': 'publiée sous licence',
  'credits.auteur': 'Auteur',
  'credits.publiePar': 'Publié par',
  'credits.traduction': 'Traduction',
  'credits.reecriture': 'Réécriture',
  'credits.contribution': 'Contribution',
  'credits.maintenance': 'Maintenance',
  'credits.deLOriginal': "de l'original",

  // --- États généraux -------------------------------------------------------
  'general.chargement': "Ouverture de l'archive…",
  'general.aucunResultat': 'Aucun dossier ne correspond à ces filtres.',
  'general.erreurArchive': "Une erreur est survenue lors de la communication avec l'archive SCP.",
  'general.fermer': 'Fermer',

  // --- Écran de confinement d'erreur ---------------------------------------
  'erreur.banniere': "Confinement de l'erreur",
  'erreur.titre': "L'interface a cessé de répondre.",
  'erreur.explication':
    "C'est presque toujours une mise à jour de l'application déployée pendant que cet onglet était ouvert. Recharger suffit ; vos favoris, votre historique et vos profils de voix sont intacts.",
  'erreur.contexteMobile': "l'interface mobile",
  'erreur.contexteBureau': "l'interface bureau",
  'erreur.chargementEchoue': 'Le chargement de {contexte} a échoué.',
  'erreur.relancer': "Relancer l'archive"
} as const;

/** Toutes les clés du dictionnaire. Une traduction incomplète ne compile pas. */
export type CleTraduction = keyof typeof FR;

/** La forme qu'une branche traduite doit avoir. */
export type Dictionnaire = Record<CleTraduction, string>;
