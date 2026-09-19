export type EntityCategory = 'department' | 'researcher' | 'goi' | 'site';

export interface ScpEntity {
  id: string;
  /**
   * L'entité correspondante du répertoire tiré du wiki (`src/data/entities.json`).
   *
   * Ce fichier reste le calque ÉDITORIAL — lore, devise, directeur, couleurs — que le
   * wiki ne fournit pas. Mais ses `iconicScps` étaient saisis à la main : c'est ce
   * lien qui permet à `entityService` de rendre la vraie liste des dossiers à la
   * place. Posé par `node scripts/build-entities.mjs --reconcilier` ; absent quand le
   * wiki ne connaît pas l'entité (11 cas sur 68, listés dans le rapport).
   */
  entiteId?: string;
  slug: string;
  name: string;
  code: string;
  category: EntityCategory;
  title: string;
  director?: string;
  clearanceLevel: number | 'O5';
  motto?: string;
  description: string;
  lore: string;
  /**
   * Page du wiki d'où le texte affiché a été repris, quand c'en est un.
   *
   * Posé par `versScpEntity()` **uniquement** si l'entité a un `resume` tiré d'un
   * annuaire : ce texte est repris verbatim et reste sous CC BY-SA 3.0, donc la
   * licence exige qu'on le crédite. Absent sur les entités du calque éditorial,
   * dont le texte est rédigé ici et n'a rien à créditer.
   */
  sourceWiki?: string;
  queryKeywords: string[];
  iconicScps: string[];
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const SCP_DEPARTMENTS: ScpEntity[] = [
  {
    "id": "pataphysics",
    "entiteId": "departement-pataphysics-dept",
    "slug": "pataphysics",
    "name": "Département de Pataphysique",
    "code": "DEP-PAT-01",
    "category": "department",
    "title": "Division Métanarrative & Quatrième Mur",
    "director": "Dr. Placeholder McDoctorate / Dr. King",
    "clearanceLevel": 5,
    "motto": "Cogito Ergo Scribo // Nous sommes la fiction",
    "description": "Département ultra-classifié chargé d'étudier la structure narrative de l'univers, la perméabilité du quatrième mur et la nature de la Fondation en tant qu'œuvre littéraire.",
    "lore": "Le Département de Pataphysique opère à la frontière même de la réalité. Ses chercheurs analysent comment les lois narratives (trames, métaphores, tropes) influencent la probabilité physique et créent des anomalies métatextuelles capables d'effacer des lignes temporelles entières ou de réécrire le personnel.",
    "queryKeywords": [
      "pataphysique",
      "pataphysics",
      "2747",
      "3812",
      "3309",
      "5500",
      "6747"
    ],
    "iconicScps": [
      "SCP-2747",
      "SCP-3812",
      "SCP-3309",
      "SCP-5500",
      "SCP-6747"
    ],
    "color": "text-purple-400",
    "badgeBg": "bg-purple-950/80",
    "badgeBorder": "border-purple-600/70",
    "badgeText": "text-purple-300"
  },
  {
    "id": "antimemetics",
    "entiteId": "departement-antimemetics",
    "slug": "antimemetics",
    "name": "Division des Antimémétiques",
    "code": "DEP-ANT-00",
    "category": "department",
    "title": "Département de Rétention Non-Informative",
    "director": "Directrice Marion Wheeler",
    "clearanceLevel": 4,
    "motto": "Comment garder un secret dont on ne se souvient pas ?",
    "description": "Division spécialisée dans l'étude des idées qui ne peuvent pas être transmises ou qui s'auto-censurent dans l'esprit de ceux qui les observent.",
    "lore": "Chaque jour, le personnel de la Division des Antimémétiques ingère des substances mnésiques de Classe-W, X ou Z pour préserver leurs propres souvenirs face à des entités consommatrices de concepts. Le département n'a officiellement aucun enregistrement de son existence.",
    "queryKeywords": [
      "antimémétique",
      "antimemetics",
      "055",
      "3125",
      "2256"
    ],
    "iconicScps": [
      "SCP-055",
      "SCP-3125",
      "SCP-2256"
    ],
    "color": "text-emerald-400",
    "badgeBg": "bg-emerald-950/80",
    "badgeBorder": "border-emerald-600/70",
    "badgeText": "text-emerald-300"
  },
  {
    "id": "ethics",
    "entiteId": "departement-ethics-committee",
    "slug": "ethics",
    "name": "Comité d'Éthique",
    "code": "DEP-ETH-01",
    "category": "department",
    "title": "Juridiction Morale & Équilibre du Confinement",
    "director": "Dr. Jeremiah Cimmerian / Représentant O5-E",
    "clearanceLevel": 5,
    "motto": "Nous sommes cruels afin que le monde ne le devienne pas",
    "description": "Organe souverain de contrôle veillant à ce que les sacrifices consentis par la Fondation (sujets Classe-D, protocoles d'isolation) demeurent strictement nécessaires à la survie de l'humanité.",
    "lore": "Souvent perçu à tort comme une simple commission administrative, le Comité d'Éthique dispose de prérogatives d'intervention armée (FIM Oméga-1 'La Main de la Loi') et peut opposer son veto aux ordres du Commandement O5 en cas de dérive inhumaine injustifiée.",
    "queryKeywords": [
      "éthique",
      "ethics",
      "5236",
      "1730",
      "2635"
    ],
    "iconicScps": [
      "SCP-5236",
      "SCP-1730",
      "SCP-2635"
    ],
    "color": "text-amber-400",
    "badgeBg": "bg-amber-950/80",
    "badgeBorder": "border-amber-600/70",
    "badgeText": "text-amber-300"
  },
  {
    "id": "raisa",
    "entiteId": "departement-raisa",
    "slug": "raisa",
    "name": "RAISA",
    "code": "DEP-RAI-02",
    "category": "department",
    "title": "Administration de la Sécurité des Enregistrements",
    "director": "Directrice Maria Jones",
    "clearanceLevel": 4,
    "motto": "L'information est une arme // Sécuriser, Archiver, Chiffrer",
    "description": "Service responsable de l'infrastructure informatique SCiPNET, de la déclassification graduée des dossiers, de la censure mémétique et de la détection des fuites internes.",
    "lore": "RAISA supervise les banques de données quantiques et les archives souterraines du Site-19. Aucune entrée de la base de données ne peut être modifiée sans passer par ses serveurs de contrôle et ses filtres de séquestre numérique.",
    "queryKeywords": [
      "raisa",
      "archiviste",
      "001",
      "censure"
    ],
    "iconicScps": [
      "SCP-001",
      "SCP-895",
      "SCP-105"
    ],
    "color": "text-blue-400",
    "badgeBg": "bg-blue-950/80",
    "badgeBorder": "border-blue-600/70",
    "badgeText": "text-blue-300"
  },
  {
    "id": "alchemy",
    "entiteId": "departement-alchemy-department",
    "slug": "alchemy",
    "name": "Département d'Alchimie",
    "code": "DEP-ALC-03",
    "category": "department",
    "title": "Science des Éléments & Transmutations Éso-chimiques",
    "director": "Grand Maître Judith Low",
    "clearanceLevel": 3,
    "motto": "Solve et Coagula // Dissoudre et Reconstituer",
    "description": "Département ancestral étudiant les transmutations matérielles, les réactions théurgiques et les propriétés des quatre éléments primordiaux et métaux nobles anormaux.",
    "lore": "Bien que l'alchimie soit considérée comme désuète par la science civile, la Fondation la traite comme une branche physique rigoureuse permettant de stabiliser les anomalies de matière corrompue et les composés trans-uraniques instables.",
    "queryKeywords": [
      "alchimie",
      "alchemy",
      "transmutation",
      "049"
    ],
    "iconicScps": [
      "SCP-049",
      "SCP-500",
      "SCP-148"
    ],
    "color": "text-yellow-400",
    "badgeBg": "bg-yellow-950/80",
    "badgeBorder": "border-yellow-600/70",
    "badgeText": "text-yellow-300"
  },
  {
    "id": "temporal",
    "entiteId": "departement-delta-t",
    "slug": "temporal",
    "name": "Anomalies Temporelles",
    "code": "DEP-TEM-04",
    "category": "department",
    "title": "Département de Chronométrie & Rétrocausalité",
    "director": "Dr. Thaddeus Xyank",
    "clearanceLevel": 4,
    "motto": "Le présent sera rétabli hier",
    "description": "Gestion des distorsions du continuum espace-temps, des voyages temporels involontaires et des paradoxes historiques rétro-actifs.",
    "lore": "Équipé de stabilisateurs tachyomagnétiques Xyank-Anastasakos (XACTS), ce département résout les boucles temporelles qui menacent d'écraser la causalité humaine.",
    "queryKeywords": [
      "temporel",
      "temporal",
      "1780",
      "196"
    ],
    "iconicScps": [
      "SCP-1780",
      "SCP-196",
      "SCP-711"
    ],
    "color": "text-cyan-400",
    "badgeBg": "bg-cyan-950/80",
    "badgeBorder": "border-cyan-600/70",
    "badgeText": "text-cyan-300"
  },
  {
    "id": "disinformation",
    "slug": "disinformation",
    "name": "Bureau de Désinformation",
    "code": "DEP-DIS-05",
    "category": "department",
    "title": "Fabrication de Couverture & Amnésie de Masse",
    "director": "Agent Travis King",
    "clearanceLevel": 3,
    "motto": "La vérité est ce que nous déclarons",
    "description": "Création et dissémination de fausses explications scientifiques, météorologiques et politiques pour camoufler les incidents paranormaux devant les civils.",
    "lore": "Ce bureau contrôle secrètement les canaux d'actualités mondiaux, orchestre la diffusion d'amnésiques dans les réseaux d'eau potable lors de brèches massives et crée les 'SCP-EX' (expliqués).",
    "queryKeywords": [
      "désinformation",
      "disinformation",
      "amnésique",
      "8900"
    ],
    "iconicScps": [
      "SCP-8900-EX",
      "SCP-1265",
      "SCP-2000"
    ],
    "color": "text-slate-400",
    "badgeBg": "bg-slate-900/80",
    "badgeBorder": "border-slate-700/60",
    "badgeText": "text-slate-300"
  },
  {
    "id": "tactical",
    "entiteId": "departement-tactical-theology",
    "slug": "tactical",
    "name": "Confinement Tactique & FIM",
    "code": "DEP-MTF-06",
    "category": "department",
    "title": "Forces d'Intervention Mobiles & Opérations Terrestres",
    "director": "Général Carter Briggs",
    "clearanceLevel": 4,
    "motto": "Par le fer et la discipline",
    "description": "Le bras armé de la Fondation : régiments de troupes d'élite spécialisées dans l'assaut en zone de brèche, la capture d'anomalies et l'exploration de dimensions hostiles.",
    "lore": "Comprend les FIM légendaires : Alpha-1 'La Main Droite', Nu-7 'Coup de Marteau', Epsilon-11 'Renard à Neuf Queues', Bêta-7 'Les Chapeliers Fous' et Thêta-90 'Disjoncteurs d'Angles'.",
    "queryKeywords": [
      "fim",
      "mtf",
      "tactique",
      "task-force",
      "1730"
    ],
    "iconicScps": [
      "SCP-1730",
      "SCP-354",
      "SCP-939"
    ],
    "color": "text-red-400",
    "badgeBg": "bg-red-950/80",
    "badgeBorder": "border-red-700/70",
    "badgeText": "text-red-300"
  },
  {
    "id": "theology",
    "entiteId": "departement-tactical-theology",
    "slug": "theology",
    "name": "Théologie Tactique",
    "code": "DEP-THEO-07",
    "category": "department",
    "title": "Confinement Déicide & Étude des Entités Divines",
    "director": "Prévôt Mark West",
    "clearanceLevel": 5,
    "motto": "Même les dieux saignent sous nos rituels de fer",
    "description": "Section spécialisée dans la neutralisation, le confinement et l'exorcisme scientifique des divinités païennes, archanges déchus et puissances théologiques extracosmiques.",
    "lore": "La Théologie Tactique applique les méthodes de la physique moderne à la liturgie occulte. Elle conçoit des cages électromagnétiques gravées d'inscriptions akkadiennes et des rituels automatisés pour empêcher les incursions divines hostiles.",
    "queryKeywords": [
      "théologie",
      "theology",
      "dieu",
      "divin",
      "culte"
    ],
    "iconicScps": [
      "SCP-1983",
      "SCP-5999",
      "SCP-2845",
      "SCP-343"
    ],
    "color": "text-amber-300",
    "badgeBg": "bg-amber-950/80",
    "badgeBorder": "border-amber-500/70",
    "badgeText": "text-amber-200"
  },
  {
    "id": "memetics",
    "slug": "memetics",
    "name": "Département de Mémétique",
    "code": "DEP-MEM-08",
    "category": "department",
    "title": "Science des Virus d'Idées & Risques Visuels",
    "director": "Dr. Gilles Bellerose",
    "clearanceLevel": 4,
    "motto": "Une pensée peut éteindre un monde",
    "description": "Recherche sur les risques cognitifs, les motifs fractals d'élimination instantanée (kill-agents) et les idées infectieuses capables de reprogrammer le cerveau humain.",
    "lore": "Ce département crée les inoculations mémétiques qui protègent les agents de la Fondation et conçoit les images de verrouillage neurologique intégrées aux dossiers de sécurité de Niveau 4 et 5.",
    "queryKeywords": [
      "mémétique",
      "memetic",
      "cognitif",
      "kill-agent"
    ],
    "iconicScps": [
      "SCP-012",
      "SCP-571",
      "SCP-1425",
      "SCP-001"
    ],
    "color": "text-emerald-400",
    "badgeBg": "bg-emerald-950/80",
    "badgeBorder": "border-emerald-600/70",
    "badgeText": "text-emerald-300"
  },
  {
    "id": "decommissioning",
    "entiteId": "departement-decommissioning-dept",
    "slug": "decommissioning",
    "name": "Département de Déclassement",
    "code": "DEP-DEC-09",
    "category": "department",
    "title": "Neutralisation Définitive & Protocoles d'Élimination",
    "director": "Directeur Calvin Bold",
    "clearanceLevel": 5,
    "motto": "Quand le confinement échoue, la fin justifie la destruction",
    "description": "Service d'élite ultra-secret chargé de détruire définitivement les anomalies devenues trop dangereuses, ingérables ou incompatibles avec la survie de la réalité.",
    "lore": "Bien que la devise de la Fondation soit 'Sécuriser, Contenir, Protéger', le Département de Déclassement intervient sur ordre spécial O5 pour calculer la méthode mathématique la plus propre d'annihilation d'une menace existentielle.",
    "queryKeywords": [
      "déclassement",
      "decommissioning",
      "neutralisation",
      "détruire"
    ],
    "iconicScps": [
      "SCP-4456",
      "SCP-6599",
      "SCP-1609"
    ],
    "color": "text-rose-500",
    "badgeBg": "bg-rose-950/90",
    "badgeBorder": "border-rose-600/80",
    "badgeText": "text-rose-200"
  },
  {
    "id": "internal_affairs",
    "slug": "internal_affairs",
    "name": "Affaires Internes & Sécurité",
    "code": "DEP-INT-10",
    "category": "department",
    "title": "Contre-Espionnage & Surveillance du Personnel",
    "director": "Agent Spécial V. Vance",
    "clearanceLevel": 5,
    "motto": "Qui surveille les gardiens ? Nous.",
    "description": "Enquêtes internes sur la corruption, les infiltrations de factions dissidentes (Insurrection du Chaos, Main du Serpent) et les compromissions de sécurité au sein des sites.",
    "lore": "Dotées de pleins pouvoirs d'interrogatoire et de surveillance biométrique, les équipes des Affaires Internes opèrent sous fausse identité dans tous les complexes majeurs de la Fondation.",
    "queryKeywords": [
      "affaires-internes",
      "taupe",
      "espionnage",
      "sécurité"
    ],
    "iconicScps": [
      "SCP-3125",
      "SCP-4231",
      "SCP-5000"
    ],
    "color": "text-slate-300",
    "badgeBg": "bg-slate-900/90",
    "badgeBorder": "border-slate-600/80",
    "badgeText": "text-slate-200"
  },
  {
    "id": "surrealism",
    "entiteId": "departement-surrealistics-dept",
    "slug": "surrealism",
    "name": "Département de Surréalisme",
    "code": "DEP-SUR-11",
    "category": "department",
    "title": "Étude des Logiques Non-Euclidiennes & Oniriques",
    "director": "Directrice Cécile Magritte",
    "clearanceLevel": 4,
    "motto": "Ceci n'est pas un protocole de confinement",
    "description": "Département abordant les anomalies réfractaires à la physique rationnelle par le biais de la logique des rêves, des paradoxes poétiques et des lois du hasard poétique.",
    "lore": "Pour comprendre les anomalies qui se nourrissent de la rationalité humaine pour la corrompre, le Département de Surréalisme forme ses agents à penser dans des schémas contradictoires et déstructurés.",
    "queryKeywords": [
      "surréalisme",
      "surrealism",
      "rêve",
      "onirique"
    ],
    "iconicScps": [
      "SCP-4778",
      "SCP-3999",
      "SCP-2000"
    ],
    "color": "text-fuchsia-400",
    "badgeBg": "bg-fuchsia-950/80",
    "badgeBorder": "border-fuchsia-600/70",
    "badgeText": "text-fuchsia-300"
  },
  {
    "id": "astrophysics",
    "slug": "astrophysics",
    "name": "Anomalies Spatiales & Astrophysique",
    "code": "DEP-AST-12",
    "category": "department",
    "title": "Surveillance Cosmique & Confinement Extraterrestre",
    "director": "Dr. Aris Thorne",
    "clearanceLevel": 4,
    "motto": "Les ténèbres de l'espace nous observent en retour",
    "description": "Réseau de télescopes orbitaux et de stations d'écoute surveillant la Ceinture de Kuiper, le Nuage d'Oort et les anomalies entrant dans le Système Solaire.",
    "lore": "Responsable de la détection précoce des colosses stellaires et des flottes biomécaniques voyageant à travers l'espace profond pour atteindre la Terre.",
    "queryKeywords": [
      "astrophysique",
      "spatial",
      "extraterrestre",
      "lune",
      "soleil"
    ],
    "iconicScps": [
      "SCP-179",
      "SCP-2399",
      "SCP-1682",
      "SCP-1548"
    ],
    "color": "text-indigo-400",
    "badgeBg": "bg-indigo-950/80",
    "badgeBorder": "border-indigo-600/70",
    "badgeText": "text-indigo-300"
  },
  {
    "id": "medical",
    "slug": "medical",
    "name": "Département Médical & Psychologique",
    "code": "DEP-MED-13",
    "category": "department",
    "title": "Soins Biologiques, Chirurgie Avancée & Traitement Mnésique",
    "director": "Dr. Simon Glass / Dr. Agatha Rights",
    "clearanceLevel": 3,
    "motto": "Soigner les blessures de l'inconcevable",
    "description": "Gestion de la santé physique et mentale des dizaines de milliers d'employés exposés aux effets dégénératifs des anomalies et aux drogues mnémoniques.",
    "lore": "Équipé de salles de chirurgie stérile sous atmosphère pressurisée et de capsules de cryostase pour stabiliser les contaminations biologiques avant mutation irréversible.",
    "queryKeywords": [
      "médical",
      "psychologie",
      "thérapie",
      "chirurgie"
    ],
    "iconicScps": [
      "SCP-500",
      "SCP-427",
      "SCP-049"
    ],
    "color": "text-teal-400",
    "badgeBg": "bg-teal-950/80",
    "badgeBorder": "border-teal-600/70",
    "badgeText": "text-teal-300"
  },
  {
    "id": "cryptography",
    "slug": "cryptography",
    "name": "Cryptographie & Télécommunications",
    "code": "DEP-CRY-14",
    "category": "department",
    "title": "Chiffrement Quantique & Surveillance des Réseaux Civils",
    "director": "Ingénieur en Chef Alan Turing-V",
    "clearanceLevel": 4,
    "motto": "Chaque signal cache un mystère",
    "description": "Interception et analyse en temps réel de tous les paquets de données mondiaux, satellites civils et signaux radioélectriques à la recherche de signatures anormales.",
    "lore": "Gère le supercalculateur 'Deep Well' qui décrypte les communications des Intelligences Artificielles hostiles et des systèmes autonomes corrompus.",
    "queryKeywords": [
      "cryptographie",
      "crypto",
      "signal",
      "radio",
      "informatique"
    ],
    "iconicScps": [
      "SCP-079",
      "SCP-1471",
      "SCP-1004"
    ],
    "color": "text-violet-400",
    "badgeBg": "bg-violet-950/80",
    "badgeBorder": "border-violet-600/70",
    "badgeText": "text-violet-300"
  }
];

export const SCP_RESEARCHERS: ScpEntity[] = [
  {
    "id": "bright",
    "slug": "bright",
    "name": "Dr Jack Bright (Dr Elias Shaw)",
    "code": "SCI-963",
    "category": "researcher",
    "title": "Directeur du Personnel du Site-19 & Sujet SCP-963",
    "clearanceLevel": 4,
    "motto": "Immortel par nécessité, imprévisible par nature",
    "description": "Chercheur légendaire dont la conscience est transférée dans tout corps humain touchant l'amulette SCP-963.",
    "lore": "Doté d'une expérience inégalée acquise sur des dizaines d'existences successives, le Dr Bright dirige le personnel de recherche du Site-19. Il fait l'objet d'une liste officielle d'interdictions de plus de 300 protocoles pour indiscipline créative.",
    "queryKeywords": [
      "bright",
      "shaw",
      "963"
    ],
    "iconicScps": [
      "SCP-963",
      "SCP-5000",
      "SCP-069-J"
    ],
    "color": "text-amber-400",
    "badgeBg": "bg-amber-950/80",
    "badgeBorder": "border-amber-600/70",
    "badgeText": "text-amber-300"
  },
  {
    "id": "clef",
    "entiteId": "chercheur-alto-clef",
    "slug": "clef",
    "name": "Dr Alto Clef",
    "code": "SCI-CLEF",
    "category": "researcher",
    "title": "Expert en Neutralisation Keter & Altérateurs de Réalité",
    "clearanceLevel": 4,
    "motto": "Ne croyez rien de ce qu'il dit",
    "description": "Ancien agent de la Coalition Mondiale Occulte (Agent Ukulélé), virtuose de la neutralisation des pliants de réalité et père de SCP-166.",
    "lore": "Son visage résiste à toute prise de vue photographique ou vidéo, apparaissant systématiquement sous forme d'animal (souvent un primate) ou floué. Sa résistance innée aux distorsions télépathiques et spatiales en fait le chercheur de recours pour les entités quasi-divines.",
    "queryKeywords": [
      "clef",
      "4231",
      "166"
    ],
    "iconicScps": [
      "SCP-4231",
      "SCP-166",
      "SCP-001"
    ],
    "color": "text-red-400",
    "badgeBg": "bg-red-950/80",
    "badgeBorder": "border-red-600/70",
    "badgeText": "text-red-300"
  },
  {
    "id": "gears",
    "slug": "gears",
    "name": "Dr Charles Gears",
    "code": "SCI-GEARS",
    "category": "researcher",
    "title": "Chef de la Recherche Fondamentale & Théorie Anormale",
    "clearanceLevel": 4,
    "motto": "La logique ne cède devant aucune anomalie",
    "description": "Scientifique d'un flegme absolu, totalement dépourvu de réponses émotionnelles physiologiques et auteur des premières propositions SCP-001.",
    "lore": "Le Dr Gears n'a jamais manifesté la moindre trace de peur, de colère ou de panique, même face à des brèches de confinement catastrophiques. Il est le pilier rationnel et méthodique sur lequel repose la doctrine de confinement de la Fondation.",
    "queryKeywords": [
      "gears",
      "882",
      "106"
    ],
    "iconicScps": [
      "SCP-882",
      "SCP-106",
      "SCP-001"
    ],
    "color": "text-cyan-400",
    "badgeBg": "bg-cyan-950/80",
    "badgeBorder": "border-cyan-600/70",
    "badgeText": "text-cyan-300"
  },
  {
    "id": "kondraki",
    "entiteId": "chercheur-benjamin-kondraki",
    "slug": "kondraki",
    "name": "Dr Benjamin Kondraki",
    "code": "SCI-KON-01",
    "category": "researcher",
    "title": "Ancien Chef de la Sécurité & Photographe Émérite",
    "clearanceLevel": 4,
    "motto": "Photographier l'impossible, vaincre l'inconfinement",
    "description": "Figure turbulente et héroïque du Site-19, célèbre pour avoir monté SCP-682 et pour sa maîtrise symbiotique de la nuée de papillons SCP-408.",
    "lore": "Bien qu'ayant provoqué la destruction partielle du Site-19 à plusieurs reprises lors de duels avec d'autres chercheurs ou anomalies, son efficacité tactique sur le terrain demeure légendaire dans les annales de la Fondation.",
    "queryKeywords": [
      "kondraki",
      "408"
    ],
    "iconicScps": [
      "SCP-408",
      "SCP-083"
    ],
    "color": "text-emerald-400",
    "badgeBg": "bg-emerald-950/80",
    "badgeBorder": "border-emerald-600/70",
    "badgeText": "text-emerald-300"
  },
  {
    "id": "scranton",
    "entiteId": "chercheur-robert-scranton",
    "slug": "scranton",
    "name": "Dr Robert Scranton",
    "code": "SCI-SRA",
    "category": "researcher",
    "title": "Père de l'Ancre de Réalité de Scranton (SRA)",
    "clearanceLevel": 4,
    "motto": "Mesurer la réalité avant qu'elle ne se délite",
    "description": "Physicien quantique de génie ayant conçu les détecteurs Hume et les stabilisateurs de trame dimensionnelle universels.",
    "lore": "En 2005, le Dr Scranton a été aspiré dans la non-dimension de SCP-3001 (La Réalité Rouge) suite à une défaillance de laboratoire. Ses enregistrements vocaux déchirants sur cinq années d'isolement total constituent l'un des documents les plus poignants de la Fondation.",
    "queryKeywords": [
      "scranton",
      "3001"
    ],
    "iconicScps": [
      "SCP-3001"
    ],
    "color": "text-rose-400",
    "badgeBg": "bg-rose-950/80",
    "badgeBorder": "border-rose-600/70",
    "badgeText": "text-rose-300"
  },
  {
    "id": "wheeler",
    "entiteId": "chercheur-marion-wheeler",
    "slug": "wheeler",
    "name": "Directrice Marion Wheeler",
    "code": "SCI-WHEELER",
    "category": "researcher",
    "title": "Directrice de la Division des Antimémétiques",
    "clearanceLevel": 4,
    "motto": "Se rappeler de ce que le monde a oublié",
    "description": "Commandante intrépide menant une guerre d'usure mentale et cognitive contre des entités dévoreuses de souvenirs.",
    "lore": "Elle dirige une division dont personne à la Fondation ne se rappelle l'existence. Son dévouement absolu et sa résistance aux drogues mnésiques l'ont amenée à faire face seule à la menace omnipotente de SCP-3125.",
    "queryKeywords": [
      "wheeler",
      "antimemetics",
      "3125"
    ],
    "iconicScps": [
      "SCP-3125",
      "SCP-055"
    ],
    "color": "text-teal-400",
    "badgeBg": "bg-teal-950/80",
    "badgeBorder": "border-teal-600/70",
    "badgeText": "text-teal-300"
  },
  {
    "id": "rights",
    "entiteId": "chercheur-agatha-rights",
    "slug": "rights",
    "name": "Dr Agatha Rights",
    "code": "SCI-RIGHTS",
    "category": "researcher",
    "title": "Directrice des Sciences Comportementales & Humanoïdes",
    "clearanceLevel": 4,
    "motto": "L'empathie est une arme d'investigation",
    "description": "Analyste psychologique en chef, réputée pour sa compréhension humaine des entités intelligentes confinées.",
    "lore": "Elle privilégie le confinement collaboratif pour les anomalies conscientes de Classe Sûr et Euclide, démontrant que la bienveillance calculée réduit drastiquement les tentatives d'évasion.",
    "queryKeywords": [
      "rights",
      "288"
    ],
    "iconicScps": [
      "SCP-288"
    ],
    "color": "text-pink-400",
    "badgeBg": "bg-pink-950/80",
    "badgeBorder": "border-pink-600/70",
    "badgeText": "text-pink-300"
  },
  {
    "id": "o5_council",
    "slug": "o5_council",
    "name": "Le Conseil O5 (O5-1 à O5-13)",
    "code": "O5-COUNCIL",
    "category": "researcher",
    "title": "Haut Commandement Suprême de la Fondation SCP",
    "clearanceLevel": "O5",
    "motto": "Sécuriser, Contenir, Protéger // La parole finale",
    "description": "Les treize superviseurs anonymes détenant le contrôle opérationnel absolu sur toutes les installations et ressources de la Fondation.",
    "lore": "Leur existence même est classée Secret Défense. Prolongés biologiquement par des amnésiques de longévité, ils ne s'expriment que par des décrets chiffrés et disposent de l'autorité exclusive pour ordonner la neutralisation définitive d'anomalies ou des protocoles de réinitialisation mondiale.",
    "queryKeywords": [
      "o5",
      "conseil",
      "administrateur",
      "001"
    ],
    "iconicScps": [
      "SCP-001",
      "SCP-5000"
    ],
    "color": "text-red-500 font-black",
    "badgeBg": "bg-red-950/90",
    "badgeBorder": "border-red-500",
    "badgeText": "text-red-200"
  },
  {
    "id": "mann",
    "entiteId": "chercheur-everett-mann",
    "slug": "mann",
    "name": "Dr Everett Mann",
    "code": "SCI-MANN",
    "category": "researcher",
    "title": "Neurochirurgien en Chef & Spécialiste Médical Anormal",
    "clearanceLevel": 4,
    "motto": "Tout organe peut être amélioré par la science",
    "description": "Chirurgien brillant et impitoyable de l'époque victorienne dans l'âme, célèbre pour ses transplantations biomécaniques et ses autopsies d'anomalies impossibles.",
    "lore": "Le Dr Mann aborde les cadavres anormaux sans aucune appréhension physique. Il est souvent sollicité pour les examens d'organes inconnus ou pour tenter de greffer des tissus anormaux sur des sujets de test vivants.",
    "queryKeywords": [
      "mann",
      "chirurgie",
      "049",
      "682"
    ],
    "iconicScps": [
      "SCP-049",
      "SCP-682",
      "SCP-217"
    ],
    "color": "text-red-400",
    "badgeBg": "bg-red-950/80",
    "badgeBorder": "border-red-700/70",
    "badgeText": "text-red-300"
  },
  {
    "id": "glass",
    "entiteId": "chercheur-simon-glass",
    "slug": "glass",
    "name": "Dr Simon Glass",
    "code": "SCI-GLASS",
    "category": "researcher",
    "title": "Directeur de la Division Psychologique du Personnel",
    "clearanceLevel": 4,
    "motto": "Même les esprits d'acier ont besoin d'un confident",
    "description": "Psychiatre réputé pour son humanité et sa douceur, chargé d'évaluer la santé mentale des chercheurs soumis à des stress cognitifs extrêmes.",
    "lore": "Le Dr Glass est l'une des rares personnes au Site-19 à laquelle tous les chercheurs, y compris les plus instables comme Kondraki ou Bright, acceptent de se confier sans méfiance.",
    "queryKeywords": [
      "glass",
      "psychiatrie",
      "mental",
      "stress"
    ],
    "iconicScps": [
      "SCP-784",
      "SCP-999"
    ],
    "color": "text-sky-400",
    "badgeBg": "bg-sky-950/80",
    "badgeBorder": "border-sky-600/70",
    "badgeText": "text-sky-300"
  },
  {
    "id": "light",
    "entiteId": "chercheur-sophia-light",
    "slug": "light",
    "name": "Dr Sophia Light",
    "code": "SCI-LIGHT",
    "category": "researcher",
    "title": "Directrice du Site-41 & Spécialiste des Brèches Majeures",
    "clearanceLevel": 4,
    "motto": "Quand tout s'effondre, je prends le commandement",
    "description": "Biochimiste de formation dotée d'une résilience tactique hors pair, régulièrement placée à la tête des complexes en état de crise d'inconfinement.",
    "lore": "La directrice Light a supervisé des dizaines de plans de reprise post-brèche. Son sang-froid et sa vision stratégique en font l'une des candidates pressenties pour intégrer le Conseil O5.",
    "queryKeywords": [
      "light",
      "sophia",
      "site-41",
      "3008"
    ],
    "iconicScps": [
      "SCP-3008",
      "SCP-5000",
      "SCP-001"
    ],
    "color": "text-amber-300",
    "badgeBg": "bg-amber-950/80",
    "badgeBorder": "border-amber-600/70",
    "badgeText": "text-amber-200"
  },
  {
    "id": "bridge",
    "entiteId": "chercheur-django-bridge",
    "slug": "bridge",
    "name": "Dr Django Bridge",
    "code": "SCI-BRIDGE",
    "category": "researcher",
    "title": "Archiviste en Chef & Diplomate Inter-Départements",
    "clearanceLevel": 3,
    "motto": "Les mots calment les tempêtes que les armes attisent",
    "description": "Médiateur chevronné de la Fondation, responsable de la réconciliation entre départements rivaux et des pourparlers avec certaines entités douées de parole.",
    "lore": "Armé d'une patience inépuisable et d'un amour profond pour la littérature ésotérique, Bridge gère les conflits d'ego entre directeurs de sites tout en assurant l'archivage fidèle de leurs mémoires.",
    "queryKeywords": [
      "bridge",
      "django",
      "archives",
      "médiation"
    ],
    "iconicScps": [
      "SCP-1983",
      "SCP-105"
    ],
    "color": "text-orange-400",
    "badgeBg": "bg-orange-950/80",
    "badgeBorder": "border-orange-600/70",
    "badgeText": "text-orange-300"
  },
  {
    "id": "king",
    "entiteId": "chercheur-everett-king",
    "slug": "king",
    "name": "Dr King",
    "code": "SCI-KING",
    "category": "researcher",
    "title": "Spécialiste en Physique Expérimentale & Malédiction Botanique",
    "clearanceLevel": 3,
    "motto": "Des pépins de pomme. Toujours des pépins de pomme.",
    "description": "Chercheur compétent affecté d'une anomalie probabiliste locale : chaque test avec une machine probabiliste ou créatrice donne invariablement des pépins de pomme.",
    "lore": "Qu'il teste SCP-914, SCP-261 ou des distributeurs de café extradimensionnels, le résultat pour le Dr King est systématiquement des milliers de pépins de pomme (Malus domestica), au grand désespoir de ses collègues.",
    "queryKeywords": [
      "king",
      "pomme",
      "pépins",
      "914",
      "261"
    ],
    "iconicScps": [
      "SCP-914",
      "SCP-261"
    ],
    "color": "text-lime-400",
    "badgeBg": "bg-lime-950/80",
    "badgeBorder": "border-lime-600/70",
    "badgeText": "text-lime-300"
  },
  {
    "id": "iceberg",
    "entiteId": "chercheur-iceberg",
    "slug": "iceberg",
    "name": "Dr Iceberg",
    "code": "SCI-ICE",
    "category": "researcher",
    "title": "Ancien Assistant Exécutif & Spécialiste Explosifs",
    "clearanceLevel": 3,
    "motto": "Froid comme la glace, précis comme un chronomètre",
    "description": "Assistant historique du Dr Gears, doté d'une condition physiologique singulière maintenant son corps à une température constante de -7°C.",
    "lore": "Capable de manipuler des explosifs instables sans déclencher de réactions thermiques, le Dr Iceberg était le complément pratique et rigoureux du Dr Gears dans les premiers jours du Site-19.",
    "queryKeywords": [
      "iceberg",
      "glace",
      "froid",
      "explosif"
    ],
    "iconicScps": [
      "SCP-009",
      "SCP-106"
    ],
    "color": "text-cyan-300",
    "badgeBg": "bg-cyan-950/80",
    "badgeBorder": "border-cyan-500/70",
    "badgeText": "text-cyan-200"
  },
  {
    "id": "dan",
    "slug": "dan",
    "name": "Dr Dan",
    "code": "SCI-DAN",
    "category": "researcher",
    "title": "Concepteur du Projet SCRAMBLE & Traqueur de SCP-096",
    "clearanceLevel": 4,
    "motto": "Pour prouver un danger, il faut parfois le déchaîner",
    "description": "Scientifique controversé ayant provoqué une brèche délibérée de SCP-096 pour convaincre le Conseil O5 de la nécessité impérieuse de son élimination.",
    "lore": "Bien que condamné à mort pour trahison, son génie tactique et la conception des lunettes de brouillage visuel SCRAMBLE lui ont valu de rester en sursis pour diriger les protocoles d'exécution de 096.",
    "queryKeywords": [
      "dan",
      "096",
      "scramble",
      "timide"
    ],
    "iconicScps": [
      "SCP-096"
    ],
    "color": "text-rose-400",
    "badgeBg": "bg-rose-950/80",
    "badgeBorder": "border-rose-600/70",
    "badgeText": "text-rose-300"
  },
  {
    "id": "strelnikov",
    "entiteId": "chercheur-dmitri-arkadeyevich-waxx-strelnikov",
    "slug": "strelnikov",
    "name": "Agent Dmitri Strelnikov",
    "code": "SEC-STREL",
    "category": "researcher",
    "title": "Chef de la Sécurité Militaire du Site-19",
    "clearanceLevel": 4,
    "motto": "En Russie soviétique, c'est l'anomalie qui a peur de toi",
    "description": "Ancien officier des forces spéciales Spetsnaz, responsable de la défense armée et des contre-mesures physiques contre les attaques extérieures.",
    "lore": "Doté d'une constitution quasi surhumaine et d'une méfiance absolue envers les nouvelles technologies, Strelnikov patrouille les couloirs du Site-19 avec une Kalachnikov et un fusil à pompe chargé au sel bénit.",
    "queryKeywords": [
      "strelnikov",
      "spetsnaz",
      "sécurité",
      "site-19"
    ],
    "iconicScps": [
      "SCP-682",
      "SCP-173"
    ],
    "color": "text-red-500",
    "badgeBg": "bg-red-950/90",
    "badgeBorder": "border-red-600/80",
    "badgeText": "text-red-200"
  }
];

export const SCP_GOI: ScpEntity[] = [
  {
    "id": "goc",
    "entiteId": "faction-global-occult-coalition",
    "slug": "goc",
    "name": "Coalition Mondiale Occulte (CMO / GOC)",
    "code": "GOI-GOC-01",
    "category": "goi",
    "title": "Forces des Nations Unies contre le Paranormal",
    "clearanceLevel": 4,
    "motto": "Survivre, Dissimuler, Protéger, Détruire, Éduquer",
    "description": "Organisation mondiale affiliée à l'ONU composée de 108 organisations occultes et militaires dont la doctrine est la destruction systématique des menaces paranormales.",
    "lore": "Là où la Fondation confine, la CMO exécute. Équipée d'armures de combat exo-squelettiques Gen-2 et de lasers thaumaturgiques, la Coalition est à la fois l'alliée la plus puissante et la rivale la plus impitoyable de la Fondation.",
    "queryKeywords": [
      "cmo",
      "goc",
      "coalition",
      "1609"
    ],
    "iconicScps": [
      "SCP-1609",
      "SCP-2002"
    ],
    "color": "text-blue-400",
    "badgeBg": "bg-blue-950/80",
    "badgeBorder": "border-blue-600/70",
    "badgeText": "text-blue-300"
  },
  {
    "id": "chaos_insurgency",
    "entiteId": "faction-chaos-insurgency",
    "slug": "chaos_insurgency",
    "name": "L'Insurrection du Chaos",
    "code": "GOI-CI-02",
    "category": "goi",
    "title": "Faction Dissidente Militarisée",
    "clearanceLevel": 4,
    "motto": "Transformer l'anomalie en arme de libération",
    "description": "Ancienne unité clandestine de la Fondation ayant fait sécession en 1948 avec plusieurs anomalies dérobées pour mener une guerre asymétrique contre l'ordre établi.",
    "lore": "Dirigée par le mystérieux 'Commandement Delta', l'Insurrection orchestre des attentats tactiques contre les sites de confinement et recycle les SCP les plus dangereux en armements de destruction massive.",
    "queryKeywords": [
      "insurrection",
      "chaos",
      "delta",
      "5000"
    ],
    "iconicScps": [
      "SCP-5000",
      "SCP-882"
    ],
    "color": "text-red-400",
    "badgeBg": "bg-red-950/80",
    "badgeBorder": "border-red-700/70",
    "badgeText": "text-red-300"
  },
  {
    "id": "serpents_hand",
    "entiteId": "faction-serpents-hand",
    "slug": "serpents_hand",
    "name": "La Main du Serpent",
    "code": "GOI-SH-03",
    "category": "goi",
    "title": "Militants de la Libération Anormale & Bibliothèque",
    "clearanceLevel": 3,
    "motto": "L'anormalité est la beauté du monde, pas sa maladie",
    "description": "Mouvement décentralisé de magiciens, d'anomalies conscientes et de réfugiés opérant depuis la Bibliothèque des Vagabonds.",
    "lore": "Opposée à la fois à l'enfermement par la Fondation et à la destruction par la CMO, la Main du Serpent infiltre les sites pour libérer les entités humanoïdes et diffuser la connaissance ésotérique au grand jour.",
    "queryKeywords": [
      "serpent",
      "vagabonds",
      "bibliothèque",
      "268"
    ],
    "iconicScps": [
      "SCP-268",
      "SCP-6000"
    ],
    "color": "text-emerald-400",
    "badgeBg": "bg-emerald-950/80",
    "badgeBorder": "border-emerald-600/70",
    "badgeText": "text-emerald-300"
  },
  {
    "id": "broken_god",
    "entiteId": "faction-broken-god",
    "slug": "broken_god",
    "name": "L'Église du Dieu Brisé (Mekhanites)",
    "code": "GOI-MEKH-04",
    "category": "goi",
    "title": "Culte Techno-Théologique de l'Horlogerie",
    "clearanceLevel": 3,
    "motto": "Rassembler les fragments de Mekhane",
    "description": "Religion ésotérique vénérant le Dieu Brisé (Mekhane), entité divine de mécanique et d'intellect détruite dans les temps anciens.",
    "lore": "Leurs fidèles remplacent progressivement leurs organes de chair par des prothèses d'engrenages et de bronze sacré, et recherchent les pièces reliques (comme SCP-882 et SCP-217) pour ressusciter leur divinité.",
    "queryKeywords": [
      "dieu-brisé",
      "mekhane",
      "882",
      "217"
    ],
    "iconicScps": [
      "SCP-882",
      "SCP-217",
      "SCP-2217"
    ],
    "color": "text-amber-400",
    "badgeBg": "bg-amber-950/80",
    "badgeBorder": "border-amber-600/70",
    "badgeText": "text-amber-300"
  },
  {
    "id": "sarkic",
    "entiteId": "faction-sarkic",
    "slug": "sarkic",
    "name": "Cultes Sarkiques (Néo & Proto-Sarkicisme)",
    "code": "GOI-SARK-05",
    "category": "goi",
    "title": "Adorateurs de la Chair & de l'Apothéose Organique",
    "clearanceLevel": 4,
    "motto": "Dominer les dieux par la manipulation de la chair",
    "description": "Système mystique et biologique fondé par le Grand Karciste Ion, pratiquant la mutation corporelle, le cannibalisme rituel et la thaumaturgie cellulaire.",
    "lore": "Ennemis jurés de l'Église du Dieu Brisé, les sarkiques considèrent la maladie et la mutation charnelle comme le véhicule sacré de l'évolution humaine, engendrant des monstruosités bio-organiques terrifiantes.",
    "queryKeywords": [
      "sarkique",
      "sarkic",
      "chair",
      "ion"
    ],
    "iconicScps": [
      "SCP-2095",
      "SCP-2480"
    ],
    "color": "text-red-500",
    "badgeBg": "bg-red-950/90",
    "badgeBorder": "border-red-600/80",
    "badgeText": "text-red-300"
  },
  {
    "id": "mcd",
    "entiteId": "faction-marshall-carter-and-dark",
    "slug": "mcd",
    "name": "Marshall, Carter & Dark Ltd.",
    "code": "GOI-MCD-06",
    "category": "goi",
    "title": "Club Privé & Salle des Ventes Anormales de Luxe",
    "clearanceLevel": 3,
    "motto": "Le prix de l'inestimable",
    "description": "Société basée à Londres qui achète, vend et met aux enchères des objets anormaux et des expériences magiques exclusives aux milliardaires les plus influents du globe.",
    "lore": "MC&D traite les anomalies non pas comme des mystères ou des menaces, mais comme de simples marchandises de prestige. Leurs ventes privées sont protégées par des contrats juridico-ésotériques inviolables.",
    "queryKeywords": [
      "marshall",
      "mcd",
      "dark",
      "1867"
    ],
    "iconicScps": [
      "SCP-1867",
      "SCP-2461"
    ],
    "color": "text-yellow-400",
    "badgeBg": "bg-yellow-950/80",
    "badgeBorder": "border-yellow-600/70",
    "badgeText": "text-yellow-300"
  },
  {
    "id": "wondertainment",
    "entiteId": "faction-dr-wondertainment",
    "slug": "wondertainment",
    "name": "Dr. Wondertainment",
    "code": "GOI-WOND-07",
    "category": "goi",
    "title": "Fabricant de Jouets Magiques & Petits Messieurs",
    "clearanceLevel": 2,
    "motto": "Du rire, des larmes et des jouets extraordinaires !",
    "description": "Entité ou corporation fantasque concevant des jouets et friandises aux propriétés paranormales absurdes, ludiques et parfois létales pour les enfants imprudents.",
    "lore": "Créateur de la célèbre collection des 'Petits Messieurs' (comme M. Poisson, M. Silhouette, M. Rire), Wondertainment opère avec une légèreté déconcertante qui désarçonne régulièrement les protocoles stricts de confinement de la Fondation.",
    "queryKeywords": [
      "wondertainment",
      "jouet",
      "monsieur",
      "905"
    ],
    "iconicScps": [
      "SCP-905",
      "SCP-2287"
    ],
    "color": "text-purple-400",
    "badgeBg": "bg-purple-950/80",
    "badgeBorder": "border-purple-600/70",
    "badgeText": "text-purple-300"
  },
  {
    "id": "factory",
    "entiteId": "faction-factory",
    "slug": "factory",
    "name": "La Fabrique (The Factory)",
    "code": "GOI-FAC-08",
    "category": "goi",
    "title": "Complexe Industriel Infernal Ancien",
    "clearanceLevel": 5,
    "motto": "Produire jusqu'à la fin des mondes",
    "description": "Immense complexe manufacturier surnaturel datant de la révolution industrielle, produisant des artefacts corrompus au détriment de l'âme et du sang de ses ouvriers.",
    "lore": "L'une des propositions SCP-001 lie directement les origines de la Fondation à la purge sanglante de la Fabrique au XIXe siècle. Tout objet estampillé de son sceau porte en lui une malédiction d'usure et d'horreur.",
    "queryKeywords": [
      "fabrique",
      "factory",
      "001"
    ],
    "iconicScps": [
      "SCP-001",
      "SCP-748"
    ],
    "color": "text-stone-400",
    "badgeBg": "bg-stone-900/90",
    "badgeBorder": "border-stone-600/70",
    "badgeText": "text-stone-300"
  },
  {
    "id": "gaw",
    "entiteId": "faction-gamers-against-weed",
    "slug": "gaw",
    "name": "Gamers Against Weed (GAW)",
    "code": "GOI-GAW-09",
    "category": "goi",
    "title": "Collectif Cyber-Anarchiste & Mémétique Satirique",
    "clearanceLevel": 2,
    "motto": "On fait des mèmes anormaux et on emmerde le capitalisme",
    "description": "Réseau informel de chatteurs et de milléniaux créant des anomalies artistiques, humoristiques et satiriques sans visée meurtrière.",
    "lore": "Né d'une scission pacifiste avec Are We Cool Yet?, GAW utilise des salons de discussion sécurisés pour concevoir les 'Little Misters' alternatifs et des objets paranormaux tournant en dérision la Fondation et la CMO.",
    "queryKeywords": [
      "gaw",
      "gamers",
      "weed",
      "mème"
    ],
    "iconicScps": [
      "SCP-3078",
      "SCP-420-J",
      "SCP-2842"
    ],
    "color": "text-green-400",
    "badgeBg": "bg-green-950/80",
    "badgeBorder": "border-green-600/70",
    "badgeText": "text-green-300"
  },
  {
    "id": "prometheus",
    "entiteId": "faction-prometheus",
    "slug": "prometheus",
    "name": "Laboratoires Prometheus",
    "code": "GOI-PROM-10",
    "category": "goi",
    "title": "Conglomérat de Paratechnologie Défunt",
    "clearanceLevel": 3,
    "motto": "Apporter le feu des dieux à l'humanité entière",
    "description": "Ancien géant militaro-industriel privé cherchant à démocratiser la technologie paranormale avant son effondrement catastrophique en 1998.",
    "lore": "Bien que dissous, les brevets, laboratoires abandonnés et prototypes d'alliages parachimiques (comme le Télékill SCP-148) de Prometheus continuent d'alimenter les technologies de confinement modernes.",
    "queryKeywords": [
      "prometheus",
      "paratech",
      "148",
      "155"
    ],
    "iconicScps": [
      "SCP-148",
      "SCP-155"
    ],
    "color": "text-amber-400",
    "badgeBg": "bg-amber-950/80",
    "badgeBorder": "border-amber-600/70",
    "badgeText": "text-amber-300"
  },
  {
    "id": "awcy",
    "entiteId": "faction-are-we-cool-yet",
    "slug": "awcy",
    "name": "Are We Cool Yet? (AWCY?)",
    "code": "GOI-AWCY-11",
    "category": "goi",
    "title": "Mouvement Terroriste Anarcho-Artistique",
    "clearanceLevel": 3,
    "motto": "L'art doit choquer, tuer ou transcender",
    "description": "Mouvement artistique d'avant-garde underground fabriquant des sculptures et installations paranormales souvent mortelles pour les spectateurs innocents.",
    "lore": "Leurs artistes considèrent la Fondation comme des censeurs fascistes et revendiquent la liberté absolue de créer de l'art anormal en pleine voie publique, signant toujours leurs forfaits par la devise 'Are We Cool Yet?'.",
    "queryKeywords": [
      "cool",
      "awcy",
      "art",
      "sculpture"
    ],
    "iconicScps": [
      "SCP-1057",
      "SCP-2838"
    ],
    "color": "text-pink-500",
    "badgeBg": "bg-pink-950/80",
    "badgeBorder": "border-pink-600/70",
    "badgeText": "text-pink-300"
  },
  {
    "id": "horizon",
    "entiteId": "faction-horizon-initiative",
    "slug": "horizon",
    "name": "L'Initiative Horizon",
    "code": "GOI-HOR-12",
    "category": "goi",
    "title": "Tribunal Théologique Tripartite Abrahamique",
    "clearanceLevel": 3,
    "motto": "Préserver la parole divine dans un monde corrompu",
    "description": "Alliance secrète formée par les branches occultes du Vatican, du judaïsme orthodoxe et de l'Islam pour traquer les reliques saintes et purifier les démons.",
    "lore": "Disposant de leur propre bras armé (Les Fils de Shamaï et le Corps Scribe), ils coopèrent prudemment avec la Fondation pour maintenir le secret sur les anomalies liées aux textes sacrés.",
    "queryKeywords": [
      "horizon",
      "religion",
      "vatican",
      "abrahamique"
    ],
    "iconicScps": [
      "SCP-001",
      "SCP-1983",
      "SCP-343"
    ],
    "color": "text-yellow-300",
    "badgeBg": "bg-yellow-950/80",
    "badgeBorder": "border-yellow-600/70",
    "badgeText": "text-yellow-200"
  },
  {
    "id": "manna",
    "slug": "manna",
    "name": "Initiative Manna Bienfaisante",
    "code": "GOI-MANNA-13",
    "category": "goi",
    "title": "ONG Humanitaire Non-Gouvernementale",
    "clearanceLevel": 2,
    "motto": "Nourrir et vêtir le monde par tous les moyens",
    "description": "Organisation caritative tentant d'éradiquer la pauvreté et les famines en utilisant des anomalies régénératrices ou multiplicatrices de ressources.",
    "lore": "Malgré leurs intentions pures, leur manque criant de compétences scientifiques engendre régulièrement des catastrophes écologiques ou biologiques que la Fondation doit éponger d'urgence.",
    "queryKeywords": [
      "manna",
      "humanitaire",
      "caritatif",
      "famine"
    ],
    "iconicScps": [
      "SCP-1615",
      "SCP-1176"
    ],
    "color": "text-emerald-300",
    "badgeBg": "bg-emerald-950/80",
    "badgeBorder": "border-emerald-600/70",
    "badgeText": "text-emerald-200"
  },
  {
    "id": "anderson",
    "entiteId": "faction-anderson",
    "slug": "anderson",
    "name": "Anderson Robotics",
    "code": "GOI-AND-14",
    "category": "goi",
    "title": "Fabricant d'Androïdes & Paratechnologie Cybernétique",
    "clearanceLevel": 3,
    "motto": "L'âme humaine dans une carcasse de titane",
    "description": "Entreprise basée dans l'Oregon spécialisée dans la création de droïdes d'infiltration, de prothèses thaumaturgiques et d'intelligences cybernétiques autonomes.",
    "lore": "Fondée par Vincent Anderson, la société est réputée pour greffer des âmes humaines dérobées dans des enveloppes robotiques ultramodernes et échapper aux raids de la Fondation grâce à des drones de téléportation.",
    "queryKeywords": [
      "anderson",
      "robot",
      "androïde",
      "cybernétique"
    ],
    "iconicScps": [
      "SCP-1360",
      "SCP-2806"
    ],
    "color": "text-cyan-400",
    "badgeBg": "bg-cyan-950/80",
    "badgeBorder": "border-cyan-600/70",
    "badgeText": "text-cyan-300"
  },
  {
    "id": "herman_fuller",
    "entiteId": "faction-herman-fuller",
    "slug": "herman_fuller",
    "name": "Le Cirque de l'Inquiétant d'Herman Fuller",
    "code": "GOI-CIRC-15",
    "category": "goi",
    "title": "Foire Monstrueuse & Spectacle Interdimensionnel",
    "clearanceLevel": 3,
    "motto": "Entrez, approchez ! Venez voir les merveilles interdites !",
    "description": "Troupe de cirque itinérante voyageant par des portes extradimensionnelles pour exhiber des créatures mutantes et des clowns anormaux cauchemardesques.",
    "lore": "Leurs chapiteaux apparaissent mystérieusement la nuit dans les campagnes avant de disparaître à l'aube, laissant derrière eux des spectateurs traumatisés ou transformés en attractions de foire.",
    "queryKeywords": [
      "cirque",
      "fuller",
      "clown",
      "spectacle"
    ],
    "iconicScps": [
      "SCP-1921",
      "SCP-2912"
    ],
    "color": "text-purple-400",
    "badgeBg": "bg-purple-950/80",
    "badgeBorder": "border-purple-600/70",
    "badgeText": "text-purple-300"
  },
  {
    "id": "gru_p",
    "entiteId": "faction-gru-division-p",
    "slug": "gru_p",
    "name": "Division Psychotronique GRU-P",
    "code": "GOI-GRUP-16",
    "category": "goi",
    "title": "Section Occulte Soviétique de la Guerre Froide",
    "clearanceLevel": 4,
    "motto": "Pour la gloire paranormale de la Mère Patrie",
    "description": "Ancienne division secrète du KGB soviétique créée sous Staline pour développer des soldats télépathes et des armes parapsychologiques de destruction massive.",
    "lore": "Après la chute de l'URSS, leurs arsenaux et leurs bunkers sibériens ont été pillés ou abandonnés, semant des dizaines d'anomalies psychotroniques incontrôlées à travers l'Europe de l'Est.",
    "queryKeywords": [
      "grup",
      "gru",
      "soviétique",
      "psychotronique",
      "kgb"
    ],
    "iconicScps": [
      "SCP-2664",
      "SCP-1011"
    ],
    "color": "text-red-500",
    "badgeBg": "bg-red-950/90",
    "badgeBorder": "border-red-700/80",
    "badgeText": "text-red-300"
  }
];

export const SCP_SITES: ScpEntity[] = [
  {
    "id": "site_19",
    "entiteId": "site-19",
    "slug": "site_19",
    "name": "Site-19",
    "code": "SITE-19",
    "category": "site",
    "title": "Installation Majeure de Confinement Polyvalent",
    "director": "Dr. Jack Bright / Tilda Moose",
    "clearanceLevel": 4,
    "motto": "Le cœur battant de la Fondation",
    "description": "La plus vaste et célèbre installation de la Fondation, abritant des centaines d'anomalies Euclide et Keter non humanoïdes et le QG de recherche central.",
    "lore": "Situé sous des centaines de mètres de roche fortifiée, le Site-19 emploie des milliers de scientifiques, d'officiers de sécurité et de sujets Classe-D, et a survécu à plus de 120 brèches de confinement majeures.",
    "queryKeywords": [
      "site-19",
      "173",
      "049",
      "963"
    ],
    "iconicScps": [
      "SCP-173",
      "SCP-049",
      "SCP-963",
      "SCP-682"
    ],
    "color": "text-red-400",
    "badgeBg": "bg-red-950/80",
    "badgeBorder": "border-red-600/70",
    "badgeText": "text-red-300"
  },
  {
    "id": "site_17",
    "entiteId": "site-17",
    "slug": "site_17",
    "name": "Site-17",
    "code": "SITE-17",
    "category": "site",
    "title": "Centre de Confinement Humanoïde & Résidence Sécurisée",
    "director": "Dr. Agatha Rights",
    "clearanceLevel": 4,
    "motto": "Contenir avec dignité, observer avec vigilance",
    "description": "Site spécialisé dans l'accueil et l'étude des entités humanoïdes douées de conscience et d'émotions, doté d'aménagements civils et psychologiques avancés.",
    "lore": "Le Site-17 met l'accent sur la collaboration psychologique et la prévention des dépressions chez les sujets anormaux, abritant des résidents célèbres tels que SCP-073 (Caïn) et SCP-105 (Iris).",
    "queryKeywords": [
      "site-17",
      "073",
      "105"
    ],
    "iconicScps": [
      "SCP-073",
      "SCP-105",
      "SCP-343"
    ],
    "color": "text-emerald-400",
    "badgeBg": "bg-emerald-950/80",
    "badgeBorder": "border-emerald-600/70",
    "badgeText": "text-emerald-300"
  },
  {
    "id": "site_81",
    "entiteId": "site-81",
    "slug": "site_81",
    "name": "Site-81",
    "code": "SITE-81",
    "category": "site",
    "title": "Centre de Recherche Sous-Lacustre & Bio-Confinement",
    "director": "Directeur Jean Karlyle Aktus",
    "clearanceLevel": 4,
    "motto": "Profondeurs obscures, vigilance constante",
    "description": "Implanté sous le réservoir de Monroe en Indiana, ce site est le fleuron de la Fondation pour le bio-confinement et les anomalies d'origine aquatique ou folklorique.",
    "lore": "Le Site-81 abrite les laboratoires les plus sophistiqués pour l'analyse génétique d'entités biologiques extraterrestres et déités terrestres captives (comme SCP-2845).",
    "queryKeywords": [
      "site-81",
      "2845"
    ],
    "iconicScps": [
      "SCP-2845"
    ],
    "color": "text-cyan-400",
    "badgeBg": "bg-cyan-950/80",
    "badgeBorder": "border-cyan-600/70",
    "badgeText": "text-cyan-300"
  },
  {
    "id": "site_01",
    "entiteId": "site-1",
    "slug": "site_01",
    "name": "Site-01 (Sanctuaire O5)",
    "code": "SITE-01",
    "category": "site",
    "title": "Quartier Général du Haut Commandement O5",
    "director": "Le Conseil O5",
    "clearanceLevel": "O5",
    "motto": "Inexpugnable // Au-dessus de tous les doutes",
    "description": "Complexe souterrain secret protégé par des champs de distorsion gravitationnelle, servant de refuge et de centre de décision exclusif pour le Conseil O5.",
    "lore": "La localisation exacte du Site-01 n'existe sur aucune carte. Ses systèmes de défense automatisés éliminent instantanément toute intrusion non autorisée par des armes à résonance mémétique.",
    "queryKeywords": [
      "site-01",
      "sanctuaire",
      "o5",
      "commandement"
    ],
    "iconicScps": [
      "SCP-001",
      "SCP-5000"
    ],
    "color": "text-red-500",
    "badgeBg": "bg-red-950/90",
    "badgeBorder": "border-red-500",
    "badgeText": "text-red-200"
  },
  {
    "id": "site_43",
    "entiteId": "site-43",
    "slug": "site_43",
    "name": "Site-43",
    "code": "SITE-43",
    "category": "site",
    "title": "Gestion Parachimique & Décontamination Anormale",
    "director": "Dr. Lillian Lillian",
    "clearanceLevel": 4,
    "motto": "Nettoyer l'innommable sous les grands lacs",
    "description": "Complexe souterrain sous le parc provincial Ipperwash au lac Huron (Canada), spécialisé dans la parachimie, la neutralisation de résidus anormaux et le traitement des eaux lourdes.",
    "lore": "Le Site-43 fonctionne avec une discipline scientifique exemplaire et sans les méthodes brutales courantes ailleurs, prouvant l'efficacité d'un confinement écologique et méthodique.",
    "queryKeywords": [
      "site-43",
      "huron",
      "parachimie"
    ],
    "iconicScps": [
      "SCP-5520",
      "SCP-5281"
    ],
    "color": "text-blue-400",
    "badgeBg": "bg-blue-950/80",
    "badgeBorder": "border-blue-600/70",
    "badgeText": "text-blue-300"
  },
  {
    "id": "site_120",
    "entiteId": "site-120",
    "slug": "site_120",
    "name": "Site-120",
    "code": "SITE-120",
    "category": "site",
    "title": "Centre Thaumatologique & Intégration Féerique",
    "director": "Directeur Daniel Asheworth",
    "clearanceLevel": 4,
    "motto": "Unir la magie et la raison pour préserver la paix",
    "description": "Situé à Częstochowa en Pologne, ce site utilise des rituels thaumaturgiques avancés et collabore pacifiquement avec des entités féeriques et magiques.",
    "lore": "Site-120 est la preuve vivante que la Fondation peut employer la thaumaturgie et les pactes féeriques pour maintenir le Voile sans recourir à la violence aveugle.",
    "queryKeywords": [
      "site-120",
      "pologne",
      "thaumaturgie",
      "magie"
    ],
    "iconicScps": [
      "SCP-5281",
      "SCP-6000"
    ],
    "color": "text-purple-400",
    "badgeBg": "bg-purple-950/80",
    "badgeBorder": "border-purple-600/70",
    "badgeText": "text-purple-300"
  },
  {
    "id": "site_64",
    "entiteId": "site-64",
    "slug": "site_64",
    "name": "Site-64",
    "code": "SITE-64",
    "category": "site",
    "title": "Surveillance Paratech & Forêts Nord-Pacifique",
    "director": "Directeur Edgar Holman",
    "clearanceLevel": 4,
    "motto": "Vigilance constante sur l'horizon technologique",
    "description": "Installation basée en Oregon, chargée de traquer les activités clandestines d'Anderson Robotics, de Three Portlands et du marché noir paratechnologique.",
    "lore": "Opérant sous couverture d'un parc naturel protégé, le Site-64 dispose de réseaux d'espionnage cybernétiques et d'équipes de réaction rapide contre les ventes aux enchères d'anomalies.",
    "queryKeywords": [
      "site-64",
      "oregon",
      "anderson",
      "portlands"
    ],
    "iconicScps": [
      "SCP-2306",
      "SCP-1360"
    ],
    "color": "text-teal-400",
    "badgeBg": "bg-teal-950/80",
    "badgeBorder": "border-teal-600/70",
    "badgeText": "text-teal-300"
  },
  {
    "id": "site_06_3",
    "entiteId": "site-6",
    "slug": "site_06_3",
    "name": "Site-06-3",
    "code": "SITE-06-3",
    "category": "site",
    "title": "Confinement Humanoïde Majeur - Branche Francophone",
    "director": "Directeur Jean Coutu",
    "clearanceLevel": 4,
    "motto": "Gardiens discrets des secrets d'Europe",
    "description": "Installation de haute sécurité située dans le massif des Vosges en France, dédiée au confinement d'anomalies humanoïdes de forte puissance de la zone européenne.",
    "lore": "Le Site-06-3 est l'un des joyaux de la branche francophone de la Fondation, réputé pour ses chambres de confinement modulaires hermétiques et ses équipes de négociateurs multilingues.",
    "queryKeywords": [
      "site-06",
      "france",
      "francophone",
      "humanoïde"
    ],
    "iconicScps": [
      "SCP-049",
      "SCP-140-FR"
    ],
    "color": "text-indigo-400",
    "badgeBg": "bg-indigo-950/80",
    "badgeBorder": "border-indigo-600/70",
    "badgeText": "text-indigo-300"
  },
  {
    "id": "site_15",
    "entiteId": "site-15",
    "slug": "site_15",
    "name": "Site-15",
    "code": "SITE-15",
    "category": "site",
    "title": "Centre de Sécurité Électromagnétique & Informatique",
    "director": "Ingénieure Katherine Sinclair",
    "clearanceLevel": 4,
    "motto": "Contenir le code avant qu'il ne contamine le réseau",
    "description": "Installation souterraine sous cage de Faraday complète pour l'isolement des Intelligences Artificielles hostiles et des signaux radio électromagnétiques anormaux.",
    "lore": "Abritant les serveurs isolés de SCP-079, le Site-15 n'a aucune liaison physique avec l'Internet civil et utilise des protocoles de transmission optique laser analogiques.",
    "queryKeywords": [
      "site-15",
      "079",
      "informatique",
      "électromagnétique"
    ],
    "iconicScps": [
      "SCP-079",
      "SCP-1471"
    ],
    "color": "text-cyan-400",
    "badgeBg": "bg-cyan-950/80",
    "badgeBorder": "border-cyan-600/70",
    "badgeText": "text-cyan-300"
  },
  {
    "id": "site_38",
    "entiteId": "site-38",
    "slug": "site_38",
    "name": "Site-38",
    "code": "SITE-38",
    "category": "site",
    "title": "Archives des Objets Inanimés & Éco-Confinement",
    "director": "Dr. Paul Lavoie",
    "clearanceLevel": 3,
    "motto": "Les objets silencieux racontent les plus grands mystères",
    "description": "Situé dans les collines du Tennessee rural, le Site-38 conserve des milliers d'artefacts anormaux de classe Sûr et d'objets impossibles n'exigeant pas d'énergie active.",
    "lore": "Doté de hangars gigantesques climatisés et désinfectés, le Site-38 sert également de centre d'apprentissage pour les jeunes chercheurs débutant dans la Fondation.",
    "queryKeywords": [
      "site-38",
      "inanimé",
      "sûr",
      "archives"
    ],
    "iconicScps": [
      "SCP-500",
      "SCP-914"
    ],
    "color": "text-slate-400",
    "badgeBg": "bg-slate-900/80",
    "badgeBorder": "border-slate-700/60",
    "badgeText": "text-slate-300"
  },
  {
    "id": "site_77",
    "entiteId": "site-77",
    "slug": "site_77",
    "name": "Site-77",
    "code": "SITE-77",
    "category": "site",
    "title": "Forteresse Historique Méditerranéenne",
    "director": "Directrice Shirley Gillespie",
    "clearanceLevel": 4,
    "motto": "Les cendres du passé ne doivent pas se réveiller",
    "description": "Ancienne base militaire fortifiée de la Seconde Guerre Mondiale en Calabre (Italie), convertie pour stocker les reliques paranormales européennes historiques.",
    "lore": "Le Site-77 a subi plusieurs bombardements durant le XXe siècle et abrite un vaste réseau de galeries troglodytiques où sont isolées des anomalies théurgiques et militaires anciennes.",
    "queryKeywords": [
      "site-77",
      "italie",
      "historique",
      "méditerranée"
    ],
    "iconicScps": [
      "SCP-1609",
      "SCP-701"
    ],
    "color": "text-amber-400",
    "badgeBg": "bg-amber-950/80",
    "badgeBorder": "border-amber-600/70",
    "badgeText": "text-amber-300"
  },
  {
    "id": "site_88",
    "entiteId": "site-88",
    "slug": "site_88",
    "name": "Site-88",
    "code": "SITE-88",
    "category": "site",
    "title": "Complexe Caverneux & Anomalies Spéléologiques",
    "director": "Directeur Philip Verhoten",
    "clearanceLevel": 4,
    "motto": "La terre cache des vérités millénaires",
    "description": "Bâti au sein d'un immense réseau de cavernes calcaires dans le comté de Baldwin en Alabama, spécialisé dans les phénomènes géologiques et météo anormaux.",
    "lore": "Le Site-88 gère les anomalies capables d'altérer la météo locale ou de déformer les couches sédimentaires de la Terre, disposant de barrières anti-sismiques quantiques.",
    "queryKeywords": [
      "site-88",
      "alabama",
      "caverne",
      "géologie"
    ],
    "iconicScps": [
      "SCP-354",
      "SCP-939"
    ],
    "color": "text-stone-400",
    "badgeBg": "bg-stone-900/80",
    "badgeBorder": "border-stone-700/60",
    "badgeText": "text-stone-300"
  },
  {
    "id": "site_118",
    "entiteId": "site-118",
    "slug": "site_118",
    "name": "Site-118",
    "code": "SITE-118",
    "category": "site",
    "title": "Station Océanographique Abyssale",
    "director": "Amiral Victor Van Der Bilt",
    "clearanceLevel": 4,
    "motto": "Les abysses écoutent nos sonars",
    "description": "Station immergée à plus de 2 500 mètres de profondeur en Mer Ionienne, chargée de confiner les léviathans et mégalodontes anormaux des fosses océaniques.",
    "lore": "Entièrement pressurisée en titane lourd avec sas pour sous-marins de combat thaumaturgiques, le Site-118 surveille les créatures sous-marines colossales qui échappent aux navires civils.",
    "queryKeywords": [
      "site-118",
      "océan",
      "abyssal",
      "mer"
    ],
    "iconicScps": [
      "SCP-3000",
      "SCP-1057"
    ],
    "color": "text-blue-500",
    "badgeBg": "bg-blue-950/90",
    "badgeBorder": "border-blue-700/70",
    "badgeText": "text-blue-300"
  },
  {
    "id": "site_41",
    "entiteId": "site-41",
    "slug": "site_41",
    "name": "Site-41",
    "code": "SITE-41",
    "category": "site",
    "title": "Centre de Réaction Stratégique Post-Brèche",
    "director": "Dr. Sophia Light",
    "clearanceLevel": 4,
    "motto": "Quand le confinement rompt, nous restaurons la loi",
    "description": "Complexe blindé dans les Rocheuses du Colorado servant de QG de crise lors des brèches de niveau Keter et de plateforme d'entraînement pour les officiers d'intervention.",
    "lore": "Dirigé par le Dr. Sophia Light, ce site possède des protocoles d'isolement hermétique automatique capables de sceller des secteurs entiers sous du béton lourd en moins de 3 secondes.",
    "queryKeywords": [
      "site-41",
      "light",
      "rocheuses",
      "crise"
    ],
    "iconicScps": [
      "SCP-3008",
      "SCP-5000"
    ],
    "color": "text-amber-300",
    "badgeBg": "bg-amber-950/80",
    "badgeBorder": "border-amber-600/70",
    "badgeText": "text-amber-200"
  },
  {
    "id": "site_98",
    "entiteId": "site-98",
    "slug": "site_98",
    "name": "Site-98",
    "code": "SITE-98",
    "category": "site",
    "title": "Laboratoire de R&D & Physique Expérimentale Avancée",
    "director": "Dr. Naismith",
    "clearanceLevel": 4,
    "motto": "Construire la science qui vaincra l'anomalie",
    "description": "Installation ultra-technologique située à Philadelphie, concevant les nouveaux armements des FIM, les armures télékinétiques et les capteurs d'ondes cérébrales.",
    "lore": "Le Site-98 est le berceau de nombreuses technologies de pointe de la Fondation, dont les alliages anti-mémétiques et les drones d'exploration de réalités corrompues.",
    "queryKeywords": [
      "site-98",
      "physique",
      "technologie",
      "r&d"
    ],
    "iconicScps": [
      "SCP-148",
      "SCP-217"
    ],
    "color": "text-indigo-400",
    "badgeBg": "bg-indigo-950/80",
    "badgeBorder": "border-indigo-600/70",
    "badgeText": "text-indigo-300"
  },
  {
    "id": "site_104",
    "entiteId": "site-104",
    "slug": "site_104",
    "name": "Site-104",
    "code": "SITE-104",
    "category": "site",
    "title": "Bio-Confinement Désertique & Pathologies Inconnues",
    "director": "Dr. Moshe Ben-David",
    "clearanceLevel": 4,
    "motto": "Le sable stérile préserve des virus de l'ombre",
    "description": "Complexe stérile isolé dans le désert du Néguev pour le confinement des armes bactériologiques, moisissures intelligentes et épidémies cellulaires anormales.",
    "lore": "Isolé par des kilomètres de dunes arides, le Site-104 possède un périmètre d'incinération thermique autonome capable d'éradiquer tout organisme en cas de brèche biologique.",
    "queryKeywords": [
      "site-104",
      "désert",
      "biologique",
      "pathologie"
    ],
    "iconicScps": [
      "SCP-009",
      "SCP-012"
    ],
    "color": "text-rose-400",
    "badgeBg": "bg-rose-950/80",
    "badgeBorder": "border-rose-600/70",
    "badgeText": "text-rose-300"
  },
  {
    "id": "area_02",
    "entiteId": "zone-2",
    "slug": "area_02",
    "name": "Zone-02 (Area-02)",
    "code": "AREA-02",
    "category": "site",
    "title": "Zone d'Exclusion Armée & Silos de Frappe Stratégique",
    "director": "Général Thomas Vance",
    "clearanceLevel": 5,
    "motto": "Le dernier recours atomique de l'humanité",
    "description": "Zone militaire ultra-secrète sans personnel civil, abritant les ogives thermonucléaires Oméga prêtes à oblitérer les sites tombés sous contrôle anomal irréversible.",
    "lore": "L'Area-02 ne répond qu'à un protocole à double clé émis par le Conseil O5. Ses silos souterrains peuvent rayer de la carte n'importe quel complexe de la Fondation en 15 minutes.",
    "queryKeywords": [
      "area-02",
      "zone-02",
      "nucléaire",
      "ogive"
    ],
    "iconicScps": [
      "SCP-682",
      "SCP-001"
    ],
    "color": "text-red-500 font-bold",
    "badgeBg": "bg-red-950/90",
    "badgeBorder": "border-red-600",
    "badgeText": "text-red-200"
  },
  {
    "id": "area_14",
    "entiteId": "zone-14",
    "slug": "area_14",
    "name": "Zone-14 (Area-14)",
    "code": "AREA-14",
    "category": "site",
    "title": "Zone de Confinement des Colosses Biologiques",
    "director": "Colonel Jackson Cole",
    "clearanceLevel": 4,
    "motto": "Des cages d'acier pour les bêtes qui dévorent les montagnes",
    "description": "Établie dans les étendues désertiques du Nevada, cette zone est équipée de fosses de confinement renforcées au titane pour les créatures gigantesques prédatrices.",
    "lore": "C'est l'un des rares sites capables d'héberger temporairement SCP-682 lors de transferts inter-sites ou d'isoler des entités quadrupedes de plus de 50 tonnes.",
    "queryKeywords": [
      "area-14",
      "zone-14",
      "bête",
      "titan",
      "682"
    ],
    "iconicScps": [
      "SCP-682",
      "SCP-096"
    ],
    "color": "text-orange-400",
    "badgeBg": "bg-orange-950/80",
    "badgeBorder": "border-orange-600/70",
    "badgeText": "text-orange-300"
  },
  {
    "id": "area_27",
    "entiteId": "zone-27",
    "slug": "area_27",
    "name": "Zone-27 (Area-27)",
    "code": "AREA-27",
    "category": "site",
    "title": "Crypte Secrète Sous le Vatican",
    "director": "Monseigneur Cardinal Rossi",
    "clearanceLevel": 5,
    "motto": "Sanctifier la pierre pour emprisonner le démon",
    "description": "Crypte millénaire située directement sous la Cité du Vatican, opérée conjointement avec la Garde Suisse Occulte pour les reliques sacrées et démons primordiaux.",
    "lore": "Bâtie sur des fondations romaines antiques, l'Area-27 contient des salles de prière perpétuelle et des sceaux de plomb alchimique pour étouffer les malédictions théologiques.",
    "queryKeywords": [
      "area-27",
      "vatican",
      "crypte",
      "religion"
    ],
    "iconicScps": [
      "SCP-1983",
      "SCP-343"
    ],
    "color": "text-yellow-300",
    "badgeBg": "bg-yellow-950/80",
    "badgeBorder": "border-yellow-600/70",
    "badgeText": "text-yellow-200"
  },
  {
    "id": "lunar_32",
    "entiteId": "zone-32",
    "slug": "lunar_32",
    "name": "Zone Lunaire-32 (Lunar Area-32)",
    "code": "LUNAR-32",
    "category": "site",
    "title": "Base Lunaire de Confinement Extraterrestre",
    "director": "Commandant Neil Armstrong-VII",
    "clearanceLevel": 5,
    "motto": "Sur la Lune, personne ne vous entend crier au secours",
    "description": "Installation humaine située sur la face cachée de la Lune dans le cratère Mare Moscoviense, abritant les anomalies qui ne doivent jamais entrer dans l'atmosphère terrestre.",
    "lore": "Alimentée par des générateurs à fusion nucléaire et des lasers de défense orbitaux, Lunar Area-32 constitue la sentinelle avancée de la Terre contre les menaces cosmiques.",
    "queryKeywords": [
      "lunaire",
      "lune",
      "lunar",
      "espace",
      "extraterrestre"
    ],
    "iconicScps": [
      "SCP-179",
      "SCP-2399"
    ],
    "color": "text-sky-300",
    "badgeBg": "bg-sky-950/90",
    "badgeBorder": "border-sky-500/80",
    "badgeText": "text-sky-200"
  }
];

export const ALL_ENTITIES: ScpEntity[] = [
  ...SCP_DEPARTMENTS,
  ...SCP_RESEARCHERS,
  ...SCP_GOI,
  ...SCP_SITES
];

export function getEntityById(id: string): ScpEntity | undefined {
  return ALL_ENTITIES.find(e => e.id === id || e.slug === id);
}
