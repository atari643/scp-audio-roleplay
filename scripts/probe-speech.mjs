/**
 * Sonde de prononciation : est-ce que le moteur neural développe DÉJÀ cette forme ?
 *
 * `speechText.ts` avertit en tête que la moitié de sa normalisation a failli être du code
 * mort, écrite sur des hypothèses jamais vérifiées : edge-tts corrige tout seul beaucoup
 * plus de choses qu'on ne le croit. Ce script rejoue la méthode qui avait servi à s'en
 * apercevoir, mais en série et avec un cache.
 *
 * PRINCIPE. On fait lire deux textes au même moteur, avec la même voix :
 *
 *     écrit     « le Dir. Vemhoff a voté »
 *     attendu   « le Directeur Vemhoff a voté »
 *
 * L'audio d'edge-tts est du MP3 à débit constant : sa TAILLE est donc proportionnelle à sa
 * DURÉE. Deux tailles identiques ⇒ le moteur a prononcé la même chose ⇒ il développe déjà
 * l'abréviation, et écrire une règle serait ajouter du code mort. Deux tailles différentes
 * ⇒ il lit « dir » et la règle est justifiée.
 *
 * On appelle `python -m edge_tts` exactement comme le fait `ttsPlugin` (vite.config.ts), ce
 * qui évite d'avoir à lancer le serveur de dev.
 *
 * Usage :
 *   node scripts/probe-speech.mjs                      toute la table
 *   node scripts/probe-speech.mjs --only heure         les sondes dont l'id contient "heure"
 *   node scripts/probe-speech.mjs --keep tmp/audio     écrit les MP3 pour écoute
 *   node scripts/probe-speech.mjs --refetch            ignore le cache
 *   node scripts/probe-speech.mjs --voice fr-FR-VivienneMultilingualNeural
 *   node scripts/probe-speech.mjs --voices --only titre/   les 12 voix du catalogue
 *   node scripts/probe-speech.mjs --homographs             mots à double prononciation
 *
 * Le cache disque (scripts/.probe-cache) ne garde que la TAILLE de chaque rendu : relancer
 * après avoir ajouté trois sondes ne refait que ces trois rendus.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(HERE, '.probe-cache', 'sizes.json');

const DEFAULT_VOICE = 'fr-FR-RemyMultilingualNeural';

/**
 * Seuil d'égalité. Deux rendus du MÊME texte ne sont pas toujours au bit près (le service
 * réencode), mais l'écart observé reste sous le pour cent. Un mot de plus ou de moins pèse
 * beaucoup plus : « Dir. » contre « Directeur », c'est ~15 % sur une phrase courte.
 */
const EQUAL_RATIO = 0.02;

// ---------------------------------------------------------------- la table des sondes

/**
 * Chaque sonde compare une forme telle que le wiki l'écrit à la forme qu'on voudrait
 * entendre. `lang` sert seulement à choisir la voix par défaut.
 *
 * Les phrases porteuses viennent de vrais dossiers (corpus scripts/.audit-cache) : une
 * abréviation isolée n'a pas le même contexte prosodique qu'une abréviation en phrase, et
 * c'est le comportement en phrase qui nous intéresse.
 */
const PROBES = [
  // ---- lot 1 : titres et grades
  { id: 'titre/dir', ecrit: 'le Dir. Vemhoff a disposé du vote décisif', attendu: 'le Directeur Vemhoff a disposé du vote décisif' },
  { id: 'titre/dr', ecrit: 'le Dr Bellini est arrivé sur le site', attendu: 'le Docteur Bellini est arrivé sur le site' },
  { id: 'titre/dre', ecrit: 'la Dre Léarce a signé le rapport', attendu: 'la Docteure Léarce a signé le rapport' },
  { id: 'titre/agt', ecrit: 'l’Agt. Hawley a sécurisé la zone', attendu: 'l’Agent Hawley a sécurisé la zone' },
  { id: 'titre/lt', ecrit: 'le Lt Marchand attend les ordres', attendu: 'le Lieutenant Marchand attend les ordres' },
  { id: 'titre/capt', ecrit: 'le Capt. Doria a pris le commandement', attendu: 'le Capitaine Doria a pris le commandement' },
  { id: 'titre/cpt', ecrit: 'le Cpt. Doria a pris le commandement', attendu: 'le Capitaine Doria a pris le commandement' },
  { id: 'titre/monsieur', ecrit: 'M. Accorsi a refusé de répondre', attendu: 'Monsieur Accorsi a refusé de répondre' },
  { id: 'titre/madame', ecrit: 'Mme Accorsi a refusé de répondre', attendu: 'Madame Accorsi a refusé de répondre' },
  { id: 'titre/prof', ecrit: 'le Prof. Snider a reçu le colis', attendu: 'le Professeur Snider a reçu le colis' },
  { id: 'titre/sgt', ecrit: 'le Sgt Liu a ouvert le feu', attendu: 'le Sergent Liu a ouvert le feu' },
  { id: 'titre/col', ecrit: 'le Col. Régelle a validé la manœuvre', attendu: 'le Colonel Régelle a validé la manœuvre' },
  { id: 'titre/jr', ecrit: 'le Dir. MacCarthy Jr. n’a pas pu participer', attendu: 'le Directeur MacCarthy Junior n’a pas pu participer' },
  { id: 'titre/initiale-intacte', ecrit: 'le Dir. Jonathan A. King est décédé', attendu: 'le Directeur Jonathan A. King est décédé', note: 'l’initiale doit rester épelée' },

  // ---- lot 1 : numéro, locutions
  { id: 'lex/objet-no', ecrit: 'Objet no : SCP-4004', attendu: 'Objet numéro : SCP-4004' },
  { id: 'lex/no-chiffre', ecrit: 'le sujet no 6 a été transféré', attendu: 'le sujet numéro 6 a été transféré' },
  { id: 'lex/n-degre', ecrit: 'le sujet n° 6 a été transféré', attendu: 'le sujet numéro 6 a été transféré' },
  { id: 'lex/cf', ecrit: 'cf. l’addendum précédent', attendu: 'voir l’addendum précédent' },
  { id: 'lex/p-ex', ecrit: 'certains objets, p. ex. SCP-173, résistent', attendu: 'certains objets, par exemple SCP-173, résistent' },
  { id: 'lex/etc', ecrit: 'des cordes, des chaînes, etc.', attendu: 'des cordes, des chaînes, et cetera.' },

  // ---- lot 1 : sigles — épelés ou lus comme un mot ?
  //
  // Comparer « FIM » à « F.I.M. » ne prouve rien : les points ajoutent leurs propres pauses
  // et allongent l'audio même quand les deux sont épelés pareil. La référence doit être une
  // forme épelée SANS ponctuation ajoutée, donc des lettres séparées par des espaces.
  { id: 'sigle/fim', ecrit: 'la FIM Bêta-2 est intervenue', attendu: 'la F I M Bêta-2 est intervenue' },
  { id: 'sigle/pcs', ecrit: 'les PCS ont été révisées', attendu: 'les P C S ont été révisées' },
  { id: 'sigle/gdi', ecrit: 'un GdI hostile a été repéré', attendu: 'un G D I hostile a été repéré' },
  { id: 'sigle/cmo', ecrit: 'la CMO a revendiqué l’opération', attendu: 'la C M O a revendiqué l’opération' },
  { id: 'sigle/raisa', ecrit: 'la RAISA a archivé le dossier', attendu: 'la R A I S A a archivé le dossier' },
  { id: 'sigle/scp', ecrit: 'SCP-096 doit rester confiné', attendu: 'S C P-096 doit rester confiné' },
  // Contre-épreuve. L'en-tête de speechText.ts a mesuré que la CASSE seule ne change rien à
  // la prononciation (« PROCÉDURES » ≡ « Procédures ») : les capitales ne forcent donc PAS
  // l'épellation. Comparer le sigle à un mot prononçable des mêmes lettres tranche : durée
  // identique ⇒ le moteur le lit comme un mot, et il faut l'espacer nous-mêmes.
  { id: 'sigle/fim-vs-mot', ecrit: 'la FIM Bêta-2 est intervenue', attendu: 'la fime Bêta-2 est intervenue' },
  { id: 'sigle/scp-vs-mot', ecrit: 'SCP-096 doit rester confiné', attendu: 'Skeup-096 doit rester confiné' },

  // ---- lot 1 : homoglyphes
  { id: 'homo/grec-lettre', ecrit: 'la FIM α-1 est mobilisée', attendu: 'la FIM Alpha-1 est mobilisée' },
  { id: 'homo/grec-zeta', ecrit: 'Ζ9-Cap a répondu', attendu: 'Zêta-9-Cap a répondu' },
  { id: 'homo/cyrillique', ecrit: 'le Dr Аndrews est absent', attendu: 'le Dr Andrews est absent', note: 'А cyrillique U+0410' },

  // ---- lot 2 : dates et heures
  { id: 'nb/date-slash', ecrit: 'incident du 08/07/2022', attendu: 'incident du 8 juillet 2022' },
  { id: 'nb/date-courte', ecrit: 'incident du 16/7/1950', attendu: 'incident du 16 juillet 1950' },
  { id: 'nb/heure-collee', ecrit: 'à 16h20 le sujet a disparu', attendu: 'à 16 heures 20 le sujet a disparu' },
  { id: 'nb/heure-espacee', ecrit: 'à 23 h 05 le sujet a disparu', attendu: 'à 23 heures 5 le sujet a disparu' },
  { id: 'nb/heure-simple', ecrit: 'après 48h de confinement', attendu: 'après 48 heures de confinement' },

  // ---- lot 2 : ordinaux et romains
  { id: 'nb/ordinal-1er', ecrit: 'le 1er essai a échoué', attendu: 'le premier essai a échoué' },
  { id: 'nb/ordinal-eme', ecrit: 'le 3ème essai a échoué', attendu: 'le troisième essai a échoué' },
  { id: 'nb/ordinal-e', ecrit: 'le 45e essai a échoué', attendu: 'le quarante-cinquième essai a échoué' },
  { id: 'nb/romain-siecle', ecrit: 'au XIXe siècle', attendu: 'au dix-neuvième siècle' },
  { id: 'nb/romain-classe', ecrit: 'une anomalie de Classe II', attendu: 'une anomalie de Classe deux' },

  // ---- lot 2 : unités
  { id: 'nb/unite-m', ecrit: 'un couloir de 5 m de long', attendu: 'un couloir de 5 mètres de long' },
  { id: 'nb/unite-cm', ecrit: 'une entaille de 20 cm', attendu: 'une entaille de 20 centimètres' },
  { id: 'nb/unite-km', ecrit: 'un rayon de 100 km', attendu: 'un rayon de 100 kilomètres' },
  { id: 'nb/unite-degre', ecrit: 'maintenu à 35 °C', attendu: 'maintenu à 35 degrés Celsius' },
  { id: 'nb/unite-pourcent', ecrit: '50 % des sujets ont survécu', attendu: '50 pour cent des sujets ont survécu' },
  { id: 'nb/unite-min', ecrit: 'après 30 min d’exposition', attendu: 'après 30 minutes d’exposition' },
  { id: 'nb/unite-s', ecrit: 'après 2 s d’exposition', attendu: 'après 2 secondes d’exposition' },
  { id: 'nb/unite-m2', ecrit: 'une salle de 40 m² environ', attendu: 'une salle de 40 mètres carrés environ' },
  { id: 'nb/unite-kg', ecrit: 'un bloc de 12 kg', attendu: 'un bloc de 12 kilogrammes' },

  // Discriminants. Un écart ne dit pas CE QUE le moteur a dit, seulement qu'il a dit autre
  // chose. « 12 kg » plus court que « 12 kilogrammes » peut vouloir dire « douze kilos »
  // (parfait, aucune règle à écrire) aussi bien que « douze ka-gé » (défaut). On recompare
  // donc à la lecture courte plausible avant de conclure.
  { id: 'disc/kg-kilos', ecrit: 'un bloc de 12 kg', attendu: 'un bloc de 12 kilos' },
  { id: 'disc/s-sec', ecrit: 'après 2 s d’exposition', attendu: 'après 2 sec d’exposition' },
  { id: 'disc/h-hache', ecrit: 'après 48h de confinement', attendu: 'après 48 hache de confinement' },

  // ---- lot 2 : nombres et codes
  { id: 'nb/grand-nombre', ecrit: 'un total de 219 308 784 personnes', attendu: 'un total de 219308784 personnes' },
  { id: 'nb/decimale', ecrit: 'une hauteur de 2,5 m', attendu: 'une hauteur de 2 virgule 5 mètres' },
  { id: 'code/scp-fr', ecrit: 'SCP-608-FR est stable', attendu: 'SCP 608 FR est stable' },
  { id: 'code/o5', ecrit: 'O5-12 a voté contre', attendu: 'O 5-12 a voté contre' },
  { id: 'code/site', ecrit: 'transféré au Site-19', attendu: 'transféré au Site 19' },
  { id: 'code/classe-d', ecrit: 'le sujet D-3481 a été introduit', attendu: 'le sujet D 3481 a été introduit' },

  // Le tiret des codes : simple pause, ou le mot « tiret » prononcé ? L'écart avec la forme
  // espacée ne le dit pas. On compare donc au « tiret » explicite — c'est la mesure la plus
  // importante du fichier, le corpus contient 12 682 codes SCP.
  { id: 'disc/tiret-scp', ecrit: 'SCP-608-FR est stable', attendu: 'SCP tiret 608 tiret FR est stable' },
  { id: 'disc/tiret-site', ecrit: 'transféré au Site-19', attendu: 'transféré au Site tiret 19' },
  { id: 'disc/tiret-o5', ecrit: 'O5-12 a voté contre', attendu: 'O5 tiret 12 a voté contre' },

  // Le tiret orphelin d'une énumération (« Sites-15, -43, -87 ») est-il un « tiret » ou un
  // « moins » ? Question tranchée en faveur du statu quo : le signe moins d'une valeur
  // négative est déjà lu correctement, et une règle qui l'attaquerait transformerait
  // « -7 °C » en « 7 °C », soit un contresens, pour 11 occurrences dans tout le corpus.
  { id: 'disc/enum-tiret', ecrit: 'Sites 15, -43, -87 assignés', attendu: 'Sites 15, tiret 43, tiret 87 assignés' },
  { id: 'disc/enum-moins', ecrit: 'Sites 15, -43, -87 assignés', attendu: 'Sites 15, moins 43, moins 87 assignés' },
  { id: 'disc/negatif', ecrit: 'maintenu à -7 °C', attendu: 'maintenu à moins 7 °C', note: 'DÉJÀ LU : ne pas toucher au signe moins' },

  // ---- lot 3 : blocs ACS (« ALIGNEMENT RATIONNEL : A=A » de SCP-5145). Côté app, les
  // étiquettes sortent déjà en casse de phrase (softenUppercaseRun) — la question est ce
  // que le MOTEUR fait des valeurs : le signe « = », le sigle collé après un point, et
  // les valeurs signées. IAA tranche s'il doit rejoindre KEEP_UPPERCASE.
  { id: 'acs/egal', ecrit: 'Alignement rationnel : A=A.', attendu: 'Alignement rationnel : A égale A.' },
  { id: 'acs/iaa-epelle', ecrit: 'Superviseur : SALVADOR.IAA.', attendu: 'Superviseur : SALVADOR. I A A.' },
  { id: 'acs/iaa-mot', ecrit: 'Superviseur : SALVADOR.IAA.', attendu: 'Superviseur : SALVADOR. Iaa.', note: 'contre-épreuve : lu comme un mot ?' },
  // Discriminants : un écart ne dit pas CE QUE le moteur a dit. IAA brut est plus court que
  // la forme en mot — « ia » seul ? « Cote : -6 » diverge de « moins 6 » : tiret, ou signe
  // sauté ? « +0/-0 » est plus long que « plus 0 moins 0 » : une pause au « / » ?
  { id: 'acs/iaa-ia', ecrit: 'Superviseur : SALVADOR.IAA.', attendu: 'Superviseur : SALVADOR. Ia.' },
  // IAA existe aussi comme sigle indépendant (« les IAA d'investigation », scp-5001, 4011,
  // 7002…). softenUppercaseRun lui fait quitter KEEP_UPPERCASE : l'app envoie « Iaa ». Ces
  // deux sondes mesurent le sigle standalone brut (le moteur épelle-t-il les capitales ?)
  // et l'état actuel de l'app (« Iaa ») contre la cible épelée.
  { id: 'acs/iaa-standalone', ecrit: 'Les IAA d’investigation de la Fondation', attendu: 'Les I A A d’investigation de la Fondation' },
  { id: 'acs/iaa-actuel', ecrit: 'Les Iaa d’investigation de la Fondation', attendu: 'Les I A A d’investigation de la Fondation' },
  { id: 'acs/cote-tiret', ecrit: 'Cote : -6.', attendu: 'Cote : tiret 6.' },
  { id: 'acs/cote-nu', ecrit: 'Cote : -6.', attendu: 'Cote : 6.', note: 'signe sauté ?' },
  { id: 'acs/pmz-tiret', ecrit: 'Cote : +0/-0.', attendu: 'Cote : plus 0 tiret moins 0.' },
  { id: 'acs/pmz-virgule', ecrit: 'Cote : +0/-0.', attendu: 'Cote : plus 0, moins 0.', note: 'le « / » vaut-il déjà une pause ?' },
  { id: 'acs/cote-negatif', ecrit: 'Cote : -6.', attendu: 'Cote : moins 6.' },
  { id: 'acs/plus-moins-zero', ecrit: 'Cote : +0/-0.', attendu: 'Cote : plus 0 moins 0.' },

  // ---- lot 3bis : tableaux (les valeurs aplaties par CROM). « N/A » est la valeur de
  // tableau la plus fréquente du corpus (16 occurrences, scp-7215 et autres). La règle
  // « N/A » → « sans objet » de speechText.ts est un choix de clarté lexicale, pas une
  // correction de défaut : sur Rémy, « N/A » contextuel sort à 3,19 s contre 3,10 s pour
  // « sans objet » — le moteur le lit déjà substantiellement (« N A »), jamais « na ».
  // Ces sondes documentent l'écart réel sur les douze voix avant de figer le verdict.
  { id: 'tableaux/na-contextuel', ecrit: 'Force d’Intervention assignée : N/A.', attendu: 'Force d’Intervention assignée : sans objet.' },
  { id: 'tableaux/na-isole', ecrit: 'Statut : N/A', attendu: 'Statut : sans objet' },

  // ---- lot 3 : ce que la ponctuation permet vraiment (pas de SSML avec edge-tts)
  { id: 'pause/point-vs-virgule', ecrit: 'Le sujet a disparu, l’équipe est intervenue.', attendu: 'Le sujet a disparu. L’équipe est intervenue.', note: 'mesure la pause gagnée par un point' },
  { id: 'pause/suspension', ecrit: 'Le sujet a disparu. L’équipe est intervenue.', attendu: 'Le sujet a disparu… L’équipe est intervenue.', note: 'mesure la pause gagnée par des points de suspension' },

  // Phrasé : la prose SCP est longue et administrative, et le seul levier de respiration
  // interne au texte est la ponctuation. Reste à savoir laquelle produit déjà un silence.
  { id: 'phrase/point-virgule', ecrit: 'Le confinement est maintenu ; les tests reprennent demain.', attendu: 'Le confinement est maintenu. Les tests reprennent demain.' },
  { id: 'phrase/deux-points', ecrit: 'Une seule conclusion : le confinement a échoué.', attendu: 'Une seule conclusion. Le confinement a échoué.' },
  { id: 'phrase/virgule-mais', ecrit: 'Le sujet a coopéré, mais les résultats restent nuls.', attendu: 'Le sujet a coopéré. Mais les résultats restent nuls.' },
  { id: 'phrase/virgule-cependant', ecrit: 'Le sujet a coopéré, cependant les résultats restent nuls.', attendu: 'Le sujet a coopéré. Cependant les résultats restent nuls.' },
  { id: 'phrase/virgule-simple', ecrit: 'Le sujet a coopéré, les résultats restent nuls.', attendu: 'Le sujet a coopéré, et les résultats restent nuls.', note: 'témoin : une virgule ordinaire' },

  // ---- lot 4 : termes du lore — le code-switching des voix multilingues
  //
  // Le service détecte la langue par fragment : un terme anglais au milieu d'une phrase
  // française peut être lu avec la prononciation d'origine, voire faire basculer la
  // phrase entière. Chaque sonde compare la forme du wiki à la forme française visée.
  // Égalité de durée ⇒ le moteur lit déjà la forme française ⇒ règle inutile. Écart ⇒
  // écouter les MP3 (`--keep`) avant d'écrire la règle : pour certains noms propres
  // (Marshall, Carter and Dark ; la devise), l'anglais est peut-être assumé.
  { id: 'termes/euclid', ecrit: 'l’objet Euclid est retenu au Site-19', attendu: 'l’objet Euclide est retenu au Site-19' },
  { id: 'termes/keter', ecrit: 'l’objet est reclassé Keter', attendu: 'l’objet est reclassé Kéter' },
  { id: 'termes/safe', ecrit: 'l’objet est classé Safe', attendu: 'l’objet est classé Sûr', note: 'le wiki FR traduit la classe' },
  { id: 'termes/thaumiel', ecrit: 'l’objet est classé Thaumiel', attendu: 'l’objet est classé Thomiel', note: 'francisation « to-mi-èl » à arbitrer à l’oreille' },
  { id: 'termes/apollyon', ecrit: 'l’objet est classé Apollyon', attendu: 'l’objet est classé Apollion', note: 'un « l » ou deux ? à l’oreille' },
  { id: 'termes/d-class', ecrit: 'du personnel D-Class a été affecté', attendu: 'du personnel D-Classe a été affecté' },
  { id: 'termes/foundation', ecrit: 'la SCP Foundation a été informée', attendu: 'la SCP Fondation a été informée' },
  { id: 'termes/amnestics', ecrit: 'des amnestics de classe A ont été administrés', attendu: 'des amnésiques de classe A ont été administrés' },
  { id: 'termes/marshall', ecrit: 'Marshall, Carter and Dark Ltd.', attendu: 'Marshall, Carter et Dark Ltd.', note: 'l’anglais du nom est-il lissé ou lu à l’anglaise ?' },
  { id: 'termes/devise', ecrit: 'Secure. Contain. Protect.', attendu: 'Sécuriser. Confiner. Protéger.', note: 'la devise : anglais assumé ou traduit ?' },

  // ---- lot 5 : sessions de terminal (SCP-2317)
  //
  // Les saisies d'un terminal SCiPNET sont lues telles que l'utilisateur les tape. Trois
  // formes n'existent que là : le retour arrière « ^H » d'une phrase-clé corrigée, les
  // identifiants « nom@@domaine | motdepasse », les numéros à tirets.
  //
  // `ecrit` est ici la forme qui SORT de normalizeForSpeech, pas la forme du wiki : la
  // normalisation retire déjà « ^ » et « | », et c'est ce qui reste qu'il faut mesurer —
  // « Je^H^H » atteint le moteur sous la forme « Je H H ».
  { id: 'terminal/retour-arriere', ecrit: 'de venir à l’aide de leur groupe. Je H H Ne pouvant m’arrêter devant la mort', attendu: 'de venir à l’aide de leur groupe. Je Ne pouvant m’arrêter devant la mort' },
  { id: 'terminal/retour-arriere-mot', ecrit: 'Ciel Rouge au Matin Avertit le e H mArin.', attendu: 'Ciel Rouge au Matin Avertit le e mArin.' },
  { id: 'terminal/arobase-double', ecrit: 'jvance1@@fondation.scp motdepasse9910', attendu: 'jvance1@fondation.scp motdepasse9910' },
  { id: 'terminal/nipsp', ecrit: 'Nipsp: 329-765-1029-007', attendu: 'Nipsp: 329 765 1029 007' },
  // SCP-3125 écrit le nom de l'antimème avec une lettre télougoue : « వ est là ». Le moteur
  // la dit-il, ou la phrase perd-elle son sujet ? Verdict : muette (0 % contre la phrase sans
  // elle). Aucune règle — l'antimème n'a pas de nom prononçable, et lui en inventer un
  // trahirait la page.
  { id: 'glyphe/telougou-muet', ecrit: 'వ est là, que nous soyons prêts ou non.', attendu: ' est là, que nous soyons prêts ou non.' },
  { id: 'glyphe/telougou-va', ecrit: 'వ est là, que nous soyons prêts ou non.', attendu: 'Va est là, que nous soyons prêts ou non.' },
  // Discriminant : l'écart du NIPSP vient-il d'un « tiret » prononcé, ou d'un « moins » ?
  { id: 'disc/nipsp-tiret', ecrit: 'Nipsp: 329-765-1029-007', attendu: 'Nipsp: 329 tiret 765 tiret 1029 tiret 007' },
];

/**
 * Balayage des sigles de `KEEP_UPPERCASE` (speechText.ts).
 *
 * Cette liste repose sur l'idée que « la synthèse les épelle » parce qu'ils sont en
 * capitales. La mesure montre que c'est faux : la casse seule ne change rien (l'en-tête de
 * speechText.ts le documentait déjà pour les mots ordinaires), et un sigle prononçable
 * comme FIM sort en « fim ».
 *
 * Chaque sigle est comparé à une forme épelée (lettres séparées par des espaces). Écart
 * faible ⇒ le moteur épelle déjà ⇒ ne rien faire. Écart net ⇒ il le lit comme un mot, et
 * seul l'usage français dit si c'est un problème (ONU et URSS se disent comme des mots,
 * FIM non). Le script mesure, l'arbitrage reste humain.
 */
const ACRONYMS = [
  'SCP', 'RAISA', 'FIM', 'FIS', 'GDI', 'GOI', 'ACS', 'DAT', 'MTF', 'DEA', 'CDI',
  'ADN', 'IA', 'PDG', 'ONU', 'USA', 'URSS', 'UIU', 'GRU', 'CIA', 'FBI', 'ND', 'JO'
];

function acronymProbes() {
  return ACRONYMS.map(sigle => ({
    id: `bal/${sigle.toLowerCase()}`,
    ecrit: `le rapport mentionne ${sigle} dans ce paragraphe`,
    attendu: `le rapport mentionne ${sigle.split('').join(' ')} dans ce paragraphe`
  }));
}

/**
 * Les douze voix du catalogue français (`src/types/neuralVoices.ts`).
 *
 * Dix d'entre elles ne sont pas nativement françaises : ce sont des voix multilingues
 * d'autres locales, qui lisent le français avec une possible coloration d'accent. Rien ne
 * garantit qu'elles butent aux mêmes endroits que Rémy, sur lequel toutes les règles ont
 * été calibrées. `--voices` rejoue les mêmes sondes sur les douze et signale les verdicts
 * qui divergent : une règle utile pour l'une et inutile pour l'autre devrait être
 * conditionnée à la voix plutôt qu'appliquée partout.
 */
const VOICES_FR = [
  'fr-FR-RemyMultilingualNeural',
  'fr-FR-VivienneMultilingualNeural',
  'en-US-AndrewMultilingualNeural',
  'en-US-BrianMultilingualNeural',
  'en-AU-WilliamMultilingualNeural',
  'de-DE-FlorianMultilingualNeural',
  'it-IT-GiuseppeMultilingualNeural',
  'ko-KR-HyunsuMultilingualNeural',
  'en-US-AvaMultilingualNeural',
  'en-US-EmmaMultilingualNeural',
  'de-DE-SeraphinaMultilingualNeural',
  'pt-BR-ThalitaMultilingualNeural'
];

/**
 * Homographes : mots dont la prononciation dépend du sens.
 *
 * Ils ne se mesurent pas comme le reste. Comparer deux textes différents ne dirait rien —
 * ici le texte ne change pas, seul le CONTEXTE change. On mesure donc la durée du mot
 * lui-même, par différence : on rend la phrase avec, puis sans, dans les deux contextes.
 *
 *   « à l'est du site »   moins  « à l' du site »       = durée de « est » sens géographique
 *   « le sujet est calme » moins « le sujet calme »     = durée de « est » sens verbal
 *
 * Deux durées identiques ⇒ le moteur prononce le mot pareil dans les deux cas ⇒ il ne
 * distingue pas les sens, et l'un des deux est forcément faux. Deux durées différentes ⇒ il
 * s'appuie sur le contexte et il n'y a rien à corriger.
 *
 * Seuls les homographes dont les deux prononciations n'ont pas la même longueur sont
 * mesurables ainsi. « fils » (/fis/ ou /fil/) et « portions » ont le même nombre de
 * phonèmes dans les deux sens : la méthode ne peut rien en dire, et ils ne figurent pas ici
 * plutôt que d'être testés pour la forme.
 */
const HOMOGRAPHS = [
  {
    id: 'homographe/est',
    mot: 'est',
    a: ["la sortie se trouve à l'est du bâtiment", "la sortie se trouve à l' du bâtiment"],
    b: ['le sujet est parfaitement calme', 'le sujet parfaitement calme']
  },
  {
    id: 'homographe/plus',
    mot: 'plus',
    a: ['le sujet ne réagit plus aux stimuli', 'le sujet ne réagit aux stimuli'],
    b: ['il faut plus de personnel sur place', 'il faut de personnel sur place']
  },
  {
    id: 'homographe/couvent',
    mot: 'couvent',
    a: ['les oiseaux couvent leurs œufs sans relâche', 'les oiseaux leurs œufs sans relâche'],
    b: ['le couvent abandonné se dresse au nord', 'le abandonné se dresse au nord']
  },
  {
    id: 'homographe/violent',
    mot: 'violent',
    a: ['les sujets violent le protocole établi', 'les sujets le protocole établi'],
    b: ['un choc violent a suivi la brèche', 'un choc a suivi la brèche']
  },
  {
    id: 'homographe/content',
    mot: 'content',
    a: ['les témoins content la même histoire', 'les témoins la même histoire'],
    b: ['le chercheur content a signé le rapport', 'le chercheur a signé le rapport']
  },
  {
    id: 'homographe/negligent',
    mot: 'négligent',
    a: ['les gardes négligent les vérifications', 'les gardes les vérifications'],
    b: ['un agent négligent a ouvert la porte', 'un agent a ouvert la porte']
  }
];

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const args = {
    voice: DEFAULT_VOICE,
    only: null,
    keep: null,
    refetch: false,
    acronyms: false,
    voices: false,
    homographs: false
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--voice') args.voice = argv[++i];
    else if (a === '--only') args.only = argv[++i];
    else if (a === '--keep') args.keep = argv[++i];
    else if (a === '--refetch') args.refetch = true;
    else if (a === '--acronyms') args.acronyms = true;
    else if (a === '--voices') args.voices = true;
    else if (a === '--homographs') args.homographs = true;
    else if (a === '--help' || a === '-h') {
      console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]);
      process.exit(0);
    }
  }
  return args;
}

// ---------------------------------------------------------------- rendu

/**
 * Rend un texte et renvoie la taille de l'audio.
 *
 * Même invocation que `ttsPlugin` : `python -m edge_tts --voice=… --text=… --write-media=-`.
 * On ne passe ni rate ni pitch : ils changeraient la durée sans rien apprendre sur la
 * prononciation, qui est la seule chose mesurée ici.
 */
function render(text, voice) {
  return new Promise((resolve, reject) => {
    const child = spawn('python', ['-m', 'edge_tts', `--voice=${voice}`, `--text=${text}`, '--write-media=-']);
    const chunks = [];
    let err = '';
    child.stdout.on('data', c => chunks.push(c));
    child.stderr.on('data', c => { err += c.toString(); });
    child.on('error', reject);
    child.on('close', code => {
      const buf = Buffer.concat(chunks);
      if (code !== 0 || buf.length === 0) {
        reject(new Error(`edge-tts a échoué (code ${code}) : ${err.trim().split('\n').pop() || 'aucun audio'}`));
        return;
      }
      resolve(buf);
    });
  });
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function cacheKey(text, voice) {
  return crypto.createHash('sha1').update(`${voice} ${text}`).digest('hex').slice(0, 16);
}

// ---------------------------------------------------------------- exécution

/** Durée (en octets d'audio) d'un mot dans une phrase, par différence avec la phrase sans lui. */
async function poidsDuMot(avec, sans, voice, cache, refetch) {
  const mesure = async texte => {
    const key = cacheKey(texte, voice);
    if (cache[key] != null && !refetch) return cache[key];
    const buf = await render(texte, voice);
    cache[key] = buf.length;
    return buf.length;
  };
  return (await mesure(avec)) - (await mesure(sans));
}

async function runHomographs(args, cache) {
  console.log(`Voix : ${args.voice}\n`);
  console.log('homographe          contexte A   contexte B   écart   verdict');
  console.log('-'.repeat(72));

  let ambigus = 0;
  for (const h of HOMOGRAPHS) {
    const a = await poidsDuMot(h.a[0], h.a[1], args.voice, cache, args.refetch);
    const b = await poidsDuMot(h.b[0], h.b[1], args.voice, cache, args.refetch);
    const max = Math.max(Math.abs(a), Math.abs(b), 1);
    const ecart = Math.abs(a - b) / max;
    // Deux prononciations de longueurs différentes se voient largement au-dessus du bruit.
    const distingue = ecart > 0.15;
    if (!distingue) ambigus++;
    console.log(
      `${h.mot.padEnd(20)}${String(a).padStart(8)}${String(b).padStart(13)}` +
        `${(ecart * 100).toFixed(0).padStart(8)} %  ${distingue ? 'distingue les deux sens' : 'MÊME PRONONCIATION'}`
    );
  }

  saveCache(cache);
  console.log('\n' + '-'.repeat(72));
  console.log(`Homographes que le moteur ne distingue pas : ${ambigus} / ${HOMOGRAPHS.length}`);
  console.log(
    'Un homographe non distingué se corrige au cas par cas, et seulement si le sens fautif\n' +
      'est celui qui revient dans les dossiers — réécrire le texte pour lever une ambiguïté\n' +
      "s'éloigne de la page d'origine, ce qui est le contraire du but."
  );
  process.exit(0);
}

/** Rejoue la même table sur les douze voix et signale les verdicts qui divergent. */
async function runAllVoices(args, cache) {
  const table = args.acronyms ? acronymProbes() : PROBES;
  const probes = args.only ? table.filter(p => p.id.includes(args.only)) : table;
  console.log(`${probes.length} sonde(s) × ${VOICES_FR.length} voix\n`);

  const verdicts = new Map(probes.map(p => [p.id, []]));
  for (const voice of VOICES_FR) {
    process.stderr.write(`\r${voice.padEnd(40)}`);
    for (const probe of probes) {
      let tailles;
      try {
        tailles = await Promise.all(
          [probe.ecrit, probe.attendu].map(async texte => {
            const key = cacheKey(texte, voice);
            if (cache[key] != null && !args.refetch) return cache[key];
            const buf = await render(texte, voice);
            cache[key] = buf.length;
            return buf.length;
          })
        );
      } catch {
        verdicts.get(probe.id).push('ERREUR');
        continue;
      }
      const max = Math.max(...tailles);
      const ecart = max ? Math.abs(tailles[0] - tailles[1]) / max : 0;
      verdicts.get(probe.id).push(ecart <= EQUAL_RATIO ? 'DÉJÀ LU' : 'RÈGLE');
    }
  }
  process.stderr.write('\r'.padEnd(42) + '\r');
  saveCache(cache);

  console.log('sonde                     verdict par voix (dans l ordre du catalogue)');
  console.log('-'.repeat(78));
  const divergentes = [];
  for (const [id, liste] of verdicts) {
    const uniques = new Set(liste);
    const resume = uniques.size === 1 ? [...uniques][0] : [...uniques].join(' / ');
    if (uniques.size > 1) divergentes.push([id, liste]);
    console.log(id.padEnd(26) + resume);
  }

  console.log('\n' + '-'.repeat(78));
  if (divergentes.length === 0) {
    console.log('Aucune divergence : les règles valent pour les douze voix.');
  } else {
    console.log(`Divergences (règle à conditionner à la voix) : ${divergentes.length}`);
    for (const [id, liste] of divergentes) {
      const nonConcernees = VOICES_FR.filter((_, i) => liste[i] === 'DÉJÀ LU');
      console.log(`  ${id.padEnd(24)} inutile pour : ${nonConcernees.join(', ') || '—'}`);
    }
  }
  process.exit(0);
}

async function main() {
  const args = parseArgs(process.argv);
  const cache = args.refetch ? {} : loadCache();

  if (args.homographs) return runHomographs(args, cache);
  if (args.voices) return runAllVoices(args, cache);
  const table = args.acronyms ? acronymProbes() : PROBES;
  const probes = args.only ? table.filter(p => p.id.includes(args.only)) : table;

  if (!probes.length) {
    console.error(`Aucune sonde ne correspond à « ${args.only} ».`);
    process.exit(1);
  }
  if (args.keep) fs.mkdirSync(args.keep, { recursive: true });

  console.log(`Voix : ${args.voice}   —   ${probes.length} sonde(s)\n`);

  const rows = [];
  for (const probe of probes) {
    const variants = [
      ['ecrit', probe.ecrit],
      ['attendu', probe.attendu]
    ];
    const sizes = {};
    let failed = null;

    for (const [kind, text] of variants) {
      const key = cacheKey(text, args.voice);
      if (cache[key] != null && !args.keep) {
        sizes[kind] = cache[key];
        continue;
      }
      try {
        const buf = await render(text, args.voice);
        sizes[kind] = buf.length;
        cache[key] = buf.length;
        if (args.keep) {
          const name = `${probe.id.replace(/\//g, '_')}.${kind}.mp3`;
          fs.writeFileSync(path.join(args.keep, name), buf);
        }
      } catch (e) {
        failed = e.message;
        break;
      }
    }

    if (failed) {
      rows.push({ id: probe.id, verdict: 'ERREUR', detail: failed, note: probe.note });
      continue;
    }

    const max = Math.max(sizes.ecrit, sizes.attendu);
    const ecart = max ? Math.abs(sizes.ecrit - sizes.attendu) / max : 0;
    rows.push({
      id: probe.id,
      verdict: ecart <= EQUAL_RATIO ? 'DÉJÀ LU' : 'RÈGLE',
      ecart,
      sizes,
      note: probe.note
    });
  }

  saveCache(cache);

  // -------------------------------------------------------------- rapport
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('sonde', 26) + pad('verdict', 10) + pad('écart', 9) + 'octets écrit → attendu');
  console.log('-'.repeat(78));
  for (const r of rows) {
    if (r.verdict === 'ERREUR') {
      console.log(pad(r.id, 26) + pad('ERREUR', 10) + r.detail);
      continue;
    }
    console.log(
      pad(r.id, 26) +
      pad(r.verdict, 10) +
      pad(`${(r.ecart * 100).toFixed(1)} %`, 9) +
      `${r.sizes.ecrit} → ${r.sizes.attendu}` +
      (r.note ? `   (${r.note})` : '')
    );
  }

  const aRegler = rows.filter(r => r.verdict === 'RÈGLE');
  const dejaLu = rows.filter(r => r.verdict === 'DÉJÀ LU');
  const erreurs = rows.filter(r => r.verdict === 'ERREUR');

  console.log('\n' + '-'.repeat(78));
  console.log(`RÈGLE JUSTIFIÉE : ${aRegler.length}   —   ${aRegler.map(r => r.id).join(', ') || '—'}`);
  console.log(`DÉJÀ LU par le moteur (ne rien écrire) : ${dejaLu.length}   —   ${dejaLu.map(r => r.id).join(', ') || '—'}`);
  if (erreurs.length) console.log(`ERREURS : ${erreurs.length}`);

  process.exit(erreurs.length ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
