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
  'general.fermerFenetre': 'Fermer la fenêtre',
  'general.navigation': 'Navigation principale',

  // --- En-tête et barre d'outils -------------------------------------------
  'entete.archive': 'Archive Site-19',
  'entete.noeud': 'Nœud SCiPNET 19-B',
  'entete.brancheAria': 'Sélection de la branche SCP',
  'entete.aleatoire': 'Aléatoire',
  'entete.aleatoireInfo': 'Ouvrir un dossier au hasard',
  'entete.explorateur': 'Explorateur',
  'entete.explorateurInfo': "Explorateur d'entités SCiPNET : départements, personnel, factions, sites",
  'entete.voix': 'Voix',
  'entete.voixInfo': 'Studio des voix et des rôles',
  'entete.favoris': 'Dossiers classés',

  // --- Bandeau d'état de l'accueil -----------------------------------------
  'etat.diffusion': 'Diffusion multi-voix',
  'etat.protocole': 'Protocole CROM',
  'etat.connecte': 'connecté',
  'etat.synthese': 'Synthèse',
  'etat.isolation': 'Isolation mémétique',
  'etat.niveau4': 'niveau 4',

  // --- Recherche et filtres -------------------------------------------------
  'recherche.placeholder': 'Rechercher : 049, 173, « Pataphysique », « Dr Clef », « CMO »…',
  'recherche.aria': "Recherche dans l'archive",
  'recherche.indexation': 'Indexation…',
  'recherche.bouton': 'Rechercher',
  'recherche.effacer': 'Effacer la recherche',
  'recherche.effacerFiltre': 'Effacer le filtre',
  'recherche.explorateurInfo': "Ouvrir l'explorateur d'entités SCiPNET",
  'recherche.series': 'Séries',
  'recherche.classe': 'Classe',
  'recherche.aucunDossier': 'Aucun dossier trouvé.',
  'recherche.erreurCommunication': 'Erreur de communication SCiPNET.',

  // --- Lecteur de dossier ---------------------------------------------------
  'dossier.catalogue': 'Catalogue',
  'dossier.source': 'Source',
  'dossier.sourceInfo': "Consulter l'archive originale sur le wiki",
  'dossier.classifie': 'Dossier classifié RAISA · Accréditation 4',
  'dossier.confinement': 'Confinement maintenu · Site-19',
  'dossier.ecouter': 'Écouter',
  'dossier.archiveBrute': 'Archive brute',
  'dossier.recentrer': 'Recentrer',
  'dossier.recentrerInfo': "Recentrer l'affichage sur la réplique en cours",
  'dossier.suivi': 'Suivi',
  'dossier.personnageFeminin': 'Personnage féminin',
  'dossier.personnageMasculin': 'Personnage masculin',
  'dossier.lectureEnCours': 'Lecture en cours',

  // --- Fiche d'entité (terminal SCiPNET) -----------------------------------
  'fiche.terminal': 'Terminal Site-19 · nœud B',
  'fiche.connexion': 'Connexion sécurisée',
  'fiche.matrice': 'MATRICE TECHNIQUE',
  'fiche.responsable': 'RESPONSABLE :',
  'fiche.accreditation': 'ACCRÉDITATION :',
  'fiche.statut': 'STATUT SYSTÈME :',
  'fiche.devise': 'DEVISE OPÉRATIONNELLE :',
  'fiche.synthese': 'SYNTHÈSE DE MISSION & ATTRIBUTIONS',
  'fiche.securite': 'DOSSIER DE SÉCURITÉ // ARCHIVES SITE-19',
  'fiche.dossiersAssocies': 'DOSSIERS ANORMAUX DIRECTEMENT ASSOCIÉS :',
  'fiche.cliquezOuvrir': 'CLIQUEZ POUR OUVRIR',
  'fiche.motsCles': 'MOTS-CLÉS DE RECHERCHE : ',

  // --- Menu tactique et en-tête mobile -------------------------------------
  'menu.studioVocal': 'Studio des voix',
  'menu.studioVocalInfo': 'Profilage vocal des acteurs',
  'menu.favoris': 'Dossiers favoris',
  'menu.raisa': 'Console RAISA',
  'menu.raisaInfo': 'Ligne de commande et télémétrie',
  'menu.sons': 'SONS SFX',
  'menu.crt': 'ÉCRAN CRT',
  'menu.bruitBlanc': 'Bruit blanc de confinement',
  'menu.branche': 'BRANCHE LINGUISTIQUE',
  'menu.modeBureau': 'Passer en mode bureau',
  'menu.aleatoire': 'Dossier aléatoire',
  'menu.effetsSonores': 'Effets sonores',
  'menu.changerLangue': 'Changer de langue',
  'menu.tactique': 'Menu tactique',
  'menu.ouvrirTactique': 'Ouvrir le menu tactique',

  // --- Explorateur SCiPNET --------------------------------------------------
  'explorateur.reseau': 'Réseau intranet SCiPNET',
  'explorateur.numeroScp': 'N° SCP (ex : 173)',
  'explorateur.arborescence': 'ARBORESCENCE DU SYSTÈME SCiPNET',
  'explorateur.filtrer': 'Filtrer dans ce dossier…',
  'explorateur.ouvrirComplet': 'Ouvrir le dossier déclassifié complet',
  'explorateur.rechercherLiees': 'Rechercher les archives liées',
  'explorateur.rattaches': 'DOSSIERS RATTACHÉS À CETTE ENTITÉ :',
  'explorateur.classifie': 'Dossier classifié SCiPNET',
  'explorateur.parcourirSerie': 'Parcourir les 1 000 dossiers de la série',
  'explorateur.phares': 'DOSSIERS PHARES DE CETTE SÉRIE :',
  'explorateur.fichier': 'FICHIER',
  'explorateur.entrer': 'ENTRER DANS LE DOSSIER',
  'explorateur.colonneCode': 'Code',
  'explorateur.colonneNom': "Nom de l'entité",
  'explorateur.colonneCategorie': 'Catégorie',
  'explorateur.colonneAccreditation': 'Accréditation',
  'explorateur.colonneTitre': 'Titre / Rôle',
  'explorateur.colonneAction': 'Action',
  'explorateur.ouvrir': 'Ouvrir',

  // --- Feuille audio mobile -------------------------------------------------
  'feuille.transcription': 'TRANSCRIPTION EN DIRECT',
  'feuille.diffusionActive': 'DIFFUSION ACTIVE',
  'feuille.moins10': '-10 secondes',
  'feuille.plus10': '+10 secondes',
  'feuille.segmentPrecedent': 'Segment précédent',
  'feuille.vitesse': 'VITESSE',
  'feuille.ambiance': 'AMBIANCE',
  'feuille.sourdine': 'Sourdine',

  // --- Studio des voix ------------------------------------------------------
  'studio.packNeural': 'Pack IA neural',
  'studio.navigateur': 'Navigateur',
  'studio.prereglages': 'Préréglages SCP :',
  'studio.packsIntegres': 'Packs Hugging Face et GitHub intégrés',
  'studio.tonalite': 'Modulation de tonalité :',
  'studio.rythme': 'Rythme de diction :',
  'studio.retablir': 'Rétablir',
  'studio.retablirInfo': "Rétablir les paramètres d'origine",

  // --- Terminal RAISA -------------------------------------------------------
  'raisa.ouvrir': 'Ouvrir la console RAISA Watchdog',
  'raisa.reduire': 'Réduire le terminal',

  // --- Lecteur mobile -------------------------------------------------------
  'lecteurMobile.reduireTexte': 'Réduire le texte',
  'lecteurMobile.agrandirTexte': 'Agrandir le texte',
  'lecteurMobile.sourceInfo': "Consulter l'archive originale sur le wiki (CC BY-SA 3.0)",
  'lecteurMobile.source': "Consulter l'archive originale sur le wiki",
  'lecteurMobile.dossiersDe': 'Dossiers de ',
  'lecteurMobile.rechercher': 'Rechercher un SCP (ex : 049, 173, statue, keter)…',

  // --- Badges d'écoute ------------------------------------------------------
  'badge.narre': 'Lecture narrée, presque sans dialogue',
  'badge.populaire': 'Parmi les mieux notés et les plus lus de son année',
  'badge.meconnu': 'Excellent pour sa génération, mais resté sous les radars',
  'badge.note': 'Note de la communauté Wikidot',

  // --- Habillage roleplay ---------------------------------------------------
  'rp.devise': 'SÉCURISER. CONTENIR. PROTÉGER.',
  'rp.systeme': 'SYSTÈME : SCiPNET v4.19 / RAISA',
  'rp.agent': 'AGENT',
  'rp.identifiant': 'IDENTIFIANT',
  'rp.accesAccorde': 'ACCÈS ACCORDÉ',
  'rp.refuse': 'REFUSÉ',
  'rp.canalBiometrique': 'CANAL BIOMÉTRIQUE',
  'rp.avertissementMemetique': 'AVERTISSEMENT RAISA : AGENT MÉMÉTIQUE TUEUR ACTIF',
  'rp.calibration': 'CALIBRATION DU SCANNER SYNAPTIQUE… NE DÉTOURNEZ PAS LE REGARD',
  'rp.resistance': 'RÉSISTANCE COGNITIVE : 99,8 %',
  'rp.caviarde': '[ACCRÉDITATION NIVEAU 5 REQUISE — DONNÉE SOUS SÉQUESTRE RAISA]',
  'rp.fermerAnnonce': "Fermer l'annonce",
  'rp.ordreO5': 'PAR ORDRE DU CONSEIL O5',
  'rp.verificationBio': 'VÉRIFICATION BIOMÉTRIQUE REQUISE',
  'file.aSuivre': 'À suivre',
  'rp.fermerAlerte': "Fermer l'alerte de confinement",

  // --- Favoris et bascule d'affichage --------------------------------------
  'favoris.aucun': "Aucun dossier classé pour l'instant.",
  'favoris.indice': "L'étoile d'un dossier l'ajoute ici.",
  'favoris.supprimer': 'Supprimer des favoris',
  'bascule.aria': "Sélecteur d'affichage",
  'bascule.auto': 'Revenir à la détection automatique',
  'explorateur.ouvrirCourt': 'OUVRIR',

  // --- Séquence de démarrage ------------------------------------------------
  'boot.bios': 'SCiPNET MAINFRAME BIOS v4.19-R — INITIALISATION DU TERMINAL…',
  'boot.memoire': 'TEST DE LA MÉMOIRE VIVE CONVENTIONNELLE : 640 Ko… [OK]',
  'boot.handshake': 'VÉRIFICATION DE LA POIGNÉE DE MAIN CHIFFRÉE (SITE-19)… [OK]',
  'boot.noyau': 'CHARGEMENT DU NOYAU DE SÉCURITÉ : PROTOCOLE BERRYMAN-LANGFORD v9.3…',
  'boot.archive': 'MONTAGE DE L\'ARCHIVE SONORE MULTI-VOIX ET SYNTHÈSE NEURALE… [OK]',
  'boot.satellite': 'LIAISON CHIFFRÉE VERS L\'API CROM… [CONNECTÉ]',
  'boot.accreditation': 'VÉRIFICATION DE L\'ACCRÉDITATION : NIVEAU 4 / RESTREINT… [VALIDÉ]',
  'boot.pareFeu': 'ACTIVATION DU PARE-FEU COGNITIF ET ISOLATION MÉMÉTIQUE… [ACTIF]',
  'boot.signatures': 'CHARGEMENT DES SIGNATURES VOCALES DES CHERCHEURS… [OK]',
  'boot.operationnel': 'TERMINAL SITE-19 OPÉRATIONNEL — CANAL SÉCURISÉ ACTIF',
  'boot.acces': '>_ ACCÈS AUTORISÉ. PRÉPARATION DU TEST D\'INOCULATION…',

  // --- Scanner biométrique --------------------------------------------------
  'bio.validee': 'AUTHENTIFICATION VALIDÉE // ACCÈS AUTORISÉ',
  'bio.erreur': 'ERREUR D\'EMPREINTE — SIGNAL INTERROMPU',
  'bio.maintenez': 'Maintenez le doigt ou le clic sur le capteur',
  'bio.acquisition': 'ACQUISITION DU SILLON DERMOPAPILLAIRE…',
  'bio.minuties': 'ANALYSE DES MINUTIES ET SILLONS…',
  'bio.comparaison': 'COMPARAISON AVEC LE REGISTRE DU SITE-19…',
  'bio.niveau4': 'VÉRIFICATION DE L\'ACCRÉDITATION NIVEAU 4…',

  // --- Annonces de l'intercom -----------------------------------------------
  'intercom.diffusion': 'DIFFUSION P.A. // SITE-19',
  'intercom.canal': 'CANAL GÉNÉRAL',
  'intercom.dosimetre': 'Rappel à tout le personnel : le port du dosimètre est obligatoire en Zone 3.',
  'intercom.transfert': 'Attention — transfert de sujet Classe-D en cours dans le couloir 7. Veuillez dégager le passage.',
  'intercom.bright': 'Le Dr Bright est formellement interdit d\'utiliser SCP-999 sans accord O5.',
  'intercom.alarme': 'Test d\'alarme de confinement programmé. Ne pas évacuer sauf ordre direct.',
  'intercom.keter': 'Rappel : les interactions non autorisées avec des anomalies de classe Keter sont passibles de sanction.',
  'intercom.protocoles': 'Personnel de confinement, veuillez vérifier les protocoles de sécurité du secteur.',

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
