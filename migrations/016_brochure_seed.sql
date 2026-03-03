-- ============================================================================
-- Migration 016: Seed brochure templates with content from Word documents
-- ============================================================================

-- =============================================
-- VILLARS / FR
-- =============================================
UPDATE brochure_templates
SET sections = '[
  {
    "id": "welcome",
    "type": "welcome",
    "enabled": true,
    "title": "Bienvenue à Villars",
    "content": "La station de Villars, située à l''extrémité Est du Lac Léman, dans la partie francophone de la Suisse, est l''une des stations de montagne suisses les plus proches de l''aéroport de Genève. Érigée sur un balcon naturel orienté plein sud, la station offre sport, détente et culture loin de la pollution et du bruit.\nÀ 1''250m d''altitude, tous les plaisirs des vacances sont possibles dans un cadre idyllique offrant un panorama grandiose s''étendant du Lac Léman au Mont-Blanc.\n\nACTIVITES ET SERVICES POUR GROUPES\nVillars Expérience est le partenaire officiel pour toutes les demandes de services et d''activités pour groupes. Actif dans toutes les Alpes Vaudoises, Villars Expérience, en partenariat avec le Bureau des Guides des Alpes Vaudoises, est au service de ses clients depuis plus de 35 ans et leur propose des activités, teambuildings, repas, soirées exclusives ou transferts sur mesure.",
    "images": [],
    "metadata": null
  },
  {
    "id": "hotel-royalp",
    "type": "hotel",
    "enabled": true,
    "title": "Chalet Royalp Hôtel & Spa 5*",
    "content": "Exceptionnellement bien situé sur les hauteurs de Villars-sur-Ollon et offrant des vues imprenables sur les Alpes suisses et françaises, le Chalet RoyAlp Hôtel & Spa est le premier hôtel cinq étoiles de la station offrant un accès direct aux pistes en hiver et au parcours de golf en été.\nMembre de Leading Hotels of the World, le Chalet RoyAlp Hôtel & Spa dispose de 62 magnifiques chambres et 27 résidences de standing combinant avec goût le style alpin à une atmosphère moderne et chaleureuse.\nLa cuisine variée et de saison du Chef saura ravir toutes les papilles : spécialités suisses traditionnelles au Grizzly, plats raffinés au restaurant gastronomique du Jardin des Alpes, menus originaux à la table du Restaurant Rochegrise.\nEnfin, le Spa by RoyAlp, régulièrement primé, offre 1 200 m2 de détente et de délassement pour une expérience inoubliable.",
    "images": [],
    "metadata": {
      "hotelSlug": "royalp",
      "category": "5*",
      "conferenceRooms": [
        {"name": "Le Grand Muveran", "m2": "130", "height": "2m80", "theatre": 56, "seminar": 95, "uShape": 45, "banquet": 0},
        {"name": "Les Dents du Midi", "m2": "135", "height": "4m – 5m40", "theatre": 40, "seminar": 75, "uShape": 33, "banquet": 0},
        {"name": "Riveralp", "m2": "315", "height": "2m80 – 5m40", "theatre": 80, "seminar": 200, "uShape": 80, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Salle plénière insonorisée avec lumière du jour",
          "Eaux minérales, bloc-notes et stylos, 2x flip chart",
          "Système Click & Share, écran, beamer, sonorisation 360°, 1 micro sans fil",
          "Pause-café permanente : café Nespresso, thés, jus, eau, fruits",
          "Matin : viennoiseries et pause salée du Chef",
          "Après-midi : brochettes de fruits et pause sucrée du Chef",
          "Déjeuner menu 2 plats ou buffet (dès 20 pers.), eau et café inclus",
          "Assistance équipe Conférence & Événements"
        ],
        "priceDay": "CHF 135.00 (€ 145)",
        "priceHalfDay": "CHF 120.00 (€ 129)"
      }
    }
  },
  {
    "id": "hotel-villars-palace",
    "type": "hotel",
    "enabled": true,
    "title": "Villars Palace 5* Superior",
    "content": "Réouvert en 2022 après deux ans de rénovation, le Villars Palace 5* sup signe la renaissance d''un lieu emblématique alliant histoire, art et engagement environnemental. Derrière sa majestueuse architecture du XIXe siècle – pierre, bois, moulures et lustres – l''hôtel dévoile des espaces contemporains où confort et élégance se rencontrent.\nSes 109 chambres et suites, au design minimaliste et chaleureux, offrent un cadre apaisant pour les séjours professionnels.\nParfaitement adapté au MICE, le Villars Palace dispose de sept salles de séminaire équipées, d''un théâtre historique de 1895, d''une salle de bal spectaculaire et d''un showroom modulable.",
    "images": [],
    "metadata": {
      "hotelSlug": "villars-palace",
      "category": "5* Superior",
      "conferenceRooms": [
        {"name": "La Ballroom", "m2": "443", "height": "-", "theatre": 0, "seminar": 0, "uShape": 0, "banquet": 0},
        {"name": "Le Théâtre", "m2": "395", "height": "5m61", "theatre": 0, "seminar": 400, "uShape": 0, "banquet": 0},
        {"name": "Le Salon Hergé", "m2": "165", "height": "3m36", "theatre": 0, "seminar": 70, "uShape": 35, "banquet": 0},
        {"name": "Salon Vaud", "m2": "95", "height": "2m69", "theatre": 30, "seminar": 50, "uShape": 28, "banquet": 0},
        {"name": "Salon Genève", "m2": "72", "height": "2m69", "theatre": 24, "seminar": 40, "uShape": 24, "banquet": 0},
        {"name": "Salon Fribourg", "m2": "76", "height": "2m69", "theatre": 24, "seminar": 40, "uShape": 24, "banquet": 0},
        {"name": "Salon Neuchâtel", "m2": "70", "height": "2m69", "theatre": 16, "seminar": 35, "uShape": 20, "banquet": 0},
        {"name": "Salon Valais", "m2": "57", "height": "2m69", "theatre": 12, "seminar": 25, "uShape": 16, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Salle plénière insonorisée avec lumière naturelle",
          "Eau minérale filtrée à discrétion",
          "Blocs-notes et stylos",
          "Écran tactile Samsung Flip, visioconférence Logitech, partage Barco",
          "2 pauses café/jour : Nespresso, thés, jus, viennoiseries, verrines, fruits secs (matin), madeleines, macarons, tartes (après-midi)",
          "Déjeuner menu 3 plats ou buffet (dès 30 pers.)",
          "Wifi gratuit",
          "Assistance équipe Conférences & Événements"
        ],
        "priceDay": "CHF 145.00 (€ 155)",
        "priceHalfDay": "CHF 125.00 (€ 134)"
      }
    }
  },
  {
    "id": "hotel-victoria",
    "type": "hotel",
    "enabled": true,
    "title": "Victoria Hotel & Residence 4*",
    "content": "Réouvert en décembre 2022, le Victoria Hotel & Residence 4* propose un cadre contemporain offrant une superbe vue sur les Alpes. Entièrement rénové, l''établissement dévoile une architecture moderne, inspirée par les matériaux locaux et l''authenticité suisse.\nSes 156 chambres et suites familiales, dont certaines communicantes, présentent un design élégant et fonctionnel, parfaitement adapté aux séjours de groupes professionnels.\nEngagé dans une démarche durable, l''hôtel privilégie les circuits courts et le zero waste dans ses deux restaurants : Les Saisons et Peppino.\nPiscine, sauna, fitness et un bar avec terrasse complètent l''offre.",
    "images": [],
    "metadata": {
      "hotelSlug": "eurotel-victoria",
      "category": "4*",
      "conferenceRooms": [
        {"name": "Villars", "m2": "190", "height": "2m80", "theatre": 60, "seminar": 160, "uShape": 40, "banquet": 0},
        {"name": "Villars 1", "m2": "95", "height": "2m80", "theatre": 30, "seminar": 80, "uShape": 20, "banquet": 0},
        {"name": "Villars 2", "m2": "95", "height": "2m80", "theatre": 30, "seminar": 80, "uShape": 20, "banquet": 0},
        {"name": "Diablerets", "m2": "55", "height": "2m80", "theatre": 0, "seminar": 0, "uShape": 0, "banquet": 0},
        {"name": "Diablerets 1", "m2": "28", "height": "2m80", "theatre": 0, "seminar": 0, "uShape": 0, "banquet": 0},
        {"name": "Diablerets 2", "m2": "28", "height": "2m80", "theatre": 0, "seminar": 0, "uShape": 0, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Salle plénière insonorisée avec lumière naturelle",
          "Eau minérale filtrée dans la salle",
          "Bloc-notes et stylos",
          "Écran tactile Samsung Flip 85\"",
          "2 pauses café/jour incl. Nespresso, thés, jus, viennoiseries, verrines (matin), madeleines, macarons, gâteau du Chef (après-midi)",
          "Déjeuner menu 3 plats ou buffet (dès 30 pers.)",
          "Wifi gratuit",
          "Assistance équipe Conférences & Événements"
        ],
        "priceDay": "CHF 120.00 (€ 129)",
        "priceHalfDay": "CHF 105.00 (€ 113)"
      }
    }
  },
  {
    "id": "hotel-villars-lodge",
    "type": "hotel",
    "enabled": true,
    "title": "Villars Lodge",
    "content": "Classé Lodge selon les critères d''Hôtellerie Suisse, le Villars Lodge offre une adresse accessible, conviviale et fonctionnelle pour les groupes professionnels.\nSes chambres et appartements, allant de l''option economy à comfort ou classic, disposent de capacités de 1 à 4 personnes et garantissent confort et praticité dans un style minimaliste.\nAu cœur de l''établissement, le Bar propose une expérience conviviale de type table d''hôte, mettant à l''honneur une cuisine fraîche et de saison.",
    "images": [],
    "metadata": {
      "hotelSlug": "villars-lodge",
      "category": "Lodge"
    }
  },
  {
    "id": "hotel-viu",
    "type": "hotel",
    "enabled": true,
    "title": "Hôtel VIU 4*",
    "content": "Situé en plein centre de Villars, l''Hôtel VIU accueille séminaires et événements privés dans un cadre chaleureux, mélangeant art de vivre chinois et ambiance de montagne.\nLe restaurant, Horizon 1904, fait découvrir les saveurs d''Asie et propose une touche culinaire unique.\nDisposant de 60 chambres et un espace Bien-être, le tout rénové, l''Hôtel VIU propose de se réunir dans un lieu ressourçant avec une vue panoramique.",
    "images": [],
    "metadata": {
      "hotelSlug": "hotel-viu",
      "category": "4*",
      "conferenceRooms": [
        {"name": "Chamois", "m2": "75", "height": "2m34", "theatre": 20, "seminar": 40, "uShape": 20, "banquet": 0},
        {"name": "Bouquetin", "m2": "75", "height": "2m34", "theatre": 20, "seminar": 40, "uShape": 20, "banquet": 0},
        {"name": "Chevreuil", "m2": "150", "height": "2m34", "theatre": 40, "seminar": 100, "uShape": 0, "banquet": 0},
        {"name": "Renardeau", "m2": "82", "height": "2m47", "theatre": 20, "seminar": 30, "uShape": 20, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Salle plénière avec lumière du jour et accès terrasse",
          "Beamer, flipchart, bloc-notes, stylo, écran Huawei connecté, tableau d''affichage",
          "Pause permanente : café Nespresso, thé, fruits, jus, eaux, pâtisseries, viennoiseries",
          "WiFi 6 haut débit",
          "Demi-pension, menu 3 plats midi ou soir, eau et café inclus"
        ],
        "priceDay": "CHF 126.00 (€ 135)",
        "priceHalfDay": "CHF 90.00 (€ 97)"
      }
    }
  },
  {
    "id": "hotel-alpe-fleurie",
    "type": "hotel",
    "enabled": true,
    "title": "Alpe Fleurie Hôtel & Résidence 3*",
    "content": "L''Alpe Fleurie, c''est trois générations de tradition hôtelière qui vous accueillent depuis 1946. Idéalement situé au cœur de la station, avec un accès direct aux pistes de ski et aux sentiers de randonnée.\nDe la chambre simple à la suite résidentielle, l''hôtel offre un large choix de chambres, dont la plupart donnent sur un panorama unique sur les Alpes.\nAvec sa superbe terrasse panoramique surplombant les Dents-du-Midi, le restaurant propose une cuisine traditionnelle variée et des spécialités locales.",
    "images": [],
    "metadata": {
      "hotelSlug": "alpe-fleurie",
      "category": "3*"
    }
  },
  {
    "id": "hotel-mazots-du-clos",
    "type": "hotel",
    "enabled": false,
    "title": "Les Mazots du Clos",
    "content": "Niché à 1 300 mètres d''altitude sur une terrasse ensoleillée, Les Mazots du Clos offre une vue imprenable sur la vallée du Rhône et les majestueuses Dents-du-Midi.\nCet établissement de sept chambres est idéalement situé à quelques pas du téléphérique du Roc d''Orsay et du centre du village.\nLes clients bénéficient d''un accès gratuit à un somptueux spa comprenant saunas, hammam, jacuzzi et piscine extérieure chauffée.",
    "images": [],
    "metadata": {
      "hotelSlug": "mazots-du-clos",
      "conferenceRooms": [
        {"name": "Boardroom", "m2": "-", "height": "-", "theatre": 0, "seminar": 0, "uShape": 10, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Écran de projection, caméra HD",
          "Tableau à feuilles mobiles, stylos, cahiers",
          "Wi-Fi haut débit",
          "Grande table de conférence ergonomique"
        ],
        "priceDay": "CHF 600.00 (€ 643)",
        "priceHalfDay": "CHF 350.00 (€ 375)"
      }
    }
  },
  {
    "id": "hotel-miroir-argentine",
    "type": "hotel",
    "enabled": false,
    "title": "Miroir d''Argentine",
    "content": "Le Restaurant & Hôtel du Miroir d''Argentine est situé sur les hauteurs de Bex, protégé par le magnifique cirque montagneux.\nLa cuisine proposée est celle du terroir environnant, et le cadre magnifique offre une évasion sublime loin du quotidien.\nSitué à 15 minutes en voiture de Villars en été. 8 chambres, 23 lits.",
    "images": [],
    "metadata": {
      "hotelSlug": "miroir-argentine",
      "conferenceRooms": [
        {"name": "Carnotzet du Miroir", "m2": "32", "height": "-", "theatre": 0, "seminar": 25, "uShape": 0, "banquet": 0},
        {"name": "Cave à vin du Refuge", "m2": "28", "height": "-", "theatre": 0, "seminar": 20, "uShape": 0, "banquet": 0}
      ]
    }
  },
  {
    "id": "hotel-wafo",
    "type": "hotel",
    "enabled": false,
    "title": "Hôtel WAFO",
    "content": "L''hôtel WAFO à Gryon est un lieu de villégiature idéal niché au cœur des montagnes suisses. Offrant une vue imprenable sur les Alpes.\nLes chambres, alliant les riches influences du Cameroun à l''atmosphère chaleureuse des Alpes vaudoises, sont soigneusement aménagées.\nLe restaurant, La Table du Wafo, propose une cuisine créative à base de produits locaux. 9 chambres et 1 dortoir, 29 lits.",
    "images": [],
    "metadata": {
      "hotelSlug": "hotel-wafo",
      "conferenceRooms": [
        {"name": "La Boutique", "m2": "-", "height": "-", "theatre": 0, "seminar": 0, "uShape": 10, "banquet": 0},
        {"name": "La Réception", "m2": "-", "height": "-", "theatre": 0, "seminar": 0, "uShape": 0, "banquet": 30}
      ]
    }
  },
  {
    "id": "hotel-grand-bains-lavey",
    "type": "hotel",
    "enabled": false,
    "title": "Grand Hôtel des Bains (Lavey) 4*",
    "content": "Le Grand Hôtel des Bains bénéficie d''un emplacement privilégié face à la majestueuse chaîne des Dents du Midi.\nLes 70 chambres rénovées s''ouvrent sur le parc ombragé de l''hôtel. Accès direct aux piscines et à l''espace bien-être.\nL''établissement dispose de 10 salles de séminaire équipées. Situé à 30 minutes de Villars.",
    "images": [],
    "metadata": {
      "hotelSlug": "grand-hotel-bains-lavey",
      "category": "4*",
      "conferenceRooms": [
        {"name": "Salle Historique", "m2": "227", "height": "-", "theatre": 50, "seminar": 160, "uShape": 60, "banquet": 0},
        {"name": "Salle Plénière", "m2": "93", "height": "-", "theatre": 26, "seminar": 70, "uShape": 26, "banquet": 0},
        {"name": "Salon Bridge", "m2": "63", "height": "-", "theatre": 12, "seminar": 50, "uShape": 24, "banquet": 0},
        {"name": "Salon Bibliothèque", "m2": "44", "height": "-", "theatre": 0, "seminar": 25, "uShape": 20, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Mise à disposition de la salle de réunion",
          "Carnets, stylos, projecteur, écran, flip chart, WiFi",
          "Eau minérale dans la salle",
          "Deux pauses café, viennoiseries, eau et jus",
          "Déjeuner buffet complet au restaurant La Table des Bains",
          "Accès quotidien aux piscines (avec nuitée)"
        ]
      }
    }
  },
  {
    "id": "activities-summer",
    "type": "activities-summer",
    "enabled": true,
    "title": "Activités et teambuildings été",
    "content": "La région de Villars-Gryon-Les Diablerets-Bex offre une large palette d''activités.\nVoici un aperçu de quelques activités pour groupes. De nombreuses autres activités sont possibles sur demande.\n\nLes prix indiqués sont susceptibles de varier en fonction du nombre de participants, de la durée de l''activité et des éventuelles exigences particulières.\nFrais de gestion et TVA 8,1% non compris.\nContactez Villars Expérience, notre partenaire exclusif pour les activités.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Les Olympiades des alpages", "description": "Traire une vache, jouer du cor des Alpes ou couper du bois : participez à ces activités et bien d''autres lors des jeux « olympiques » inspirés des alpages.", "price": "dès CHF 65.00 (€ 66) / pers."},
        {"name": "Chasse aux trésors", "description": "Explorez la région à l''aide d''indices et d''énigmes à résoudre, tout en parcourant les villages et les prairies alpines.", "price": "dès CHF 55.00 (€ 56) / pers."},
        {"name": "Yourte privée", "description": "Dans notre charmante yourte à l''orée de la forêt, profitez d''une soirée relaxante en pleine nature et dégustez des produits locaux.", "price": "dès CHF 85.00 (€ 87) / pers."},
        {"name": "EscapeXperience", "description": "Nos escape games mobiles s''adressent aux personnes qui aiment résoudre des mystères et déchiffrer des énigmes. Jouable en intérieur comme en extérieur.", "price": "dès CHF 85.00 (€ 87) / pers."}
      ]
    }
  },
  {
    "id": "activities-winter",
    "type": "activities-winter",
    "enabled": true,
    "title": "Activités et teambuildings hiver",
    "content": "La région de Villars-Gryon-Les Diablerets-Bex offre une large palette d''activités.\nVoici un aperçu de quelques activités pour groupes. De nombreuses autres activités sont possibles sur demande.\n\nLes tarifs mentionnés sont à titre indicatif et dépendent du nombre de participants.\nManagement fee et TVA 8.1% non inclus.\nContactez Villars Expérience, notre partenaire exclusif pour les activités.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Challenges de glisse", "description": "Divers postes/activités de glisse, d''agilité et de concentration pratiquées sous forme de tournus.", "price": "dès CHF 65.00 (€ 66) / pers."},
        {"name": "Curling", "description": "Après l''apprentissage des bases de ce sport national, les équipes sont mises à l''épreuve par un tournoi.", "price": "dès CHF 75.00 (€ 77) / pers."},
        {"name": "Randonnée en raquettes", "description": "Randonnée en raquettes à neige à la découverte de sublimes panoramas, moments magiques au cœur de la montagne.", "price": "dès CHF 55.00 (€ 58) / pers."},
        {"name": "Initiation au biathlon", "description": "Combinez le tir à la carabine avec une course relai en raquettes, à pied ou à ski de fond. Idéal pour la cohésion d''équipe.", "price": "dès CHF 85.00 (€ 87) / pers."},
        {"name": "Soirée refuge", "description": "Soirée raclette au feu de bois dans un chalet construit en 1700, privatisé pour 15 à 30 participants.", "price": "dès CHF 51.00 (€ 52) / pers."}
      ]
    }
  },
  {
    "id": "ski",
    "type": "ski",
    "enabled": true,
    "title": "Domaine skiable",
    "content": "132 km de pistes pour tous les niveaux, de 1''200 à 3''000 mètres d''altitude.\nLes tarifs ci-dessous permettent l''accès à tout le domaine skiable, sans le Glacier 3000. Des tarifs de groupe sont disponibles sur demande.\n\nMoniteur de ski : journée CHF 525.00 (€ 561)\nGuide de montagne : journée CHF 670.00 (€ 717)",
    "images": [],
    "metadata": {
      "skiPrices": [
        {"period": "Dès 12h", "skipass": "CHF 54.00 (€ 58)", "rental": "CHF 68.00 (€ 73)"},
        {"period": "1 jour", "skipass": "CHF 74.00 (€ 79)", "rental": "CHF 83.00 (€ 89)"},
        {"period": "2 jours", "skipass": "CHF 134.00 (€ 143)", "rental": "CHF 147.00 (€ 157)"}
      ]
    }
  },
  {
    "id": "contacts",
    "type": "contacts",
    "enabled": true,
    "title": "Contacts",
    "content": "Une équipe de professionnels à votre service pour vous proposer des solutions rapides et personnalisées pour vos événements à la montagne.\n\nSEMINARS DEPARTMENT\nVillars - Les Diablerets\nseminaires@villars.ch\nwww.alpesvaudoises.ch",
    "images": [],
    "metadata": null
  }
]'::jsonb
WHERE destination = 'villars' AND lang = 'fr';

-- =============================================
-- VILLARS / EN
-- =============================================
UPDATE brochure_templates
SET sections = '[
  {
    "id": "welcome",
    "type": "welcome",
    "enabled": true,
    "title": "Welcome to Villars",
    "content": "The resort of Villars, located at the eastern end of Lake Geneva in the French-speaking part of Switzerland, is one of the closest Swiss mountain resorts to Geneva Airport. Perched on a natural south-facing balcony, the resort offers sport, relaxation and culture far from pollution and noise.\nAt 1,250m altitude, all the pleasures of a holiday are possible in an idyllic setting with a grandiose panorama stretching from Lake Geneva to Mont Blanc.\n\nACTIVITIES AND SERVICES FOR GROUPS\nVillars Experience is the official partner for all group activity and service requests. Active throughout the Vaud Alps, in partnership with the Bureau des Guides, Villars Experience has been serving its clients for over 35 years with activities, team buildings, dinners, exclusive evenings and tailor-made transfers.",
    "images": [],
    "metadata": null
  },
  {
    "id": "hotel-royalp",
    "type": "hotel",
    "enabled": true,
    "title": "Chalet Royalp Hotel & Spa 5*",
    "content": "Exceptionally well located on the heights of Villars-sur-Ollon with breathtaking views of the Swiss and French Alps, the Chalet RoyAlp Hotel & Spa is the first five-star hotel in the resort with direct access to the slopes in winter and the golf course in summer.\nA member of Leading Hotels of the World, it features 62 magnificent rooms and 27 upscale residences combining Alpine style with a modern, warm atmosphere.\nThe Spa by RoyAlp, regularly awarded, offers 1,200 m2 of relaxation for an unforgettable experience.",
    "images": [],
    "metadata": {
      "hotelSlug": "royalp",
      "category": "5*",
      "conferenceRooms": [
        {"name": "Le Grand Muveran", "m2": "130", "height": "2m80", "theatre": 56, "seminar": 95, "uShape": 45, "banquet": 0},
        {"name": "Les Dents du Midi", "m2": "135", "height": "4m – 5m40", "theatre": 40, "seminar": 75, "uShape": 33, "banquet": 0},
        {"name": "Riveralp", "m2": "315", "height": "2m80 – 5m40", "theatre": 80, "seminar": 200, "uShape": 80, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Soundproofed plenary room with daylight",
          "Mineral water, notepads, pens, 2x flip chart",
          "Click & Share, screen, beamer, 360° sound, 1 wireless mic",
          "Permanent coffee break: Nespresso, teas, juice, water, fruit",
          "Morning: pastries and savoury Chef''s break",
          "Afternoon: fruit skewers and sweet Chef''s break",
          "2-course lunch menu or buffet (from 20 ppl), water & coffee incl.",
          "Conference & Events team assistance"
        ],
        "priceDay": "CHF 135.00 (€ 145)",
        "priceHalfDay": "CHF 120.00 (€ 129)"
      }
    }
  },
  {
    "id": "hotel-villars-palace",
    "type": "hotel",
    "enabled": true,
    "title": "Villars Palace 5* Superior",
    "content": "Reopened in 2022 after two years of renovation, the Villars Palace marks the rebirth of an iconic venue blending history, art and environmental commitment. Behind its majestic 19th-century architecture, the hotel reveals contemporary spaces where comfort and elegance meet.\nIts 109 rooms and suites offer a soothing setting for professional stays.\nPerfectly suited for MICE, the Villars Palace has seven equipped seminar rooms, a historic 1895 theatre, a spectacular ballroom and a modular showroom.",
    "images": [],
    "metadata": {
      "hotelSlug": "villars-palace",
      "category": "5* Superior",
      "conferenceRooms": [
        {"name": "La Ballroom", "m2": "443", "height": "-", "theatre": 0, "seminar": 0, "uShape": 0, "banquet": 0},
        {"name": "Le Théâtre", "m2": "395", "height": "5m61", "theatre": 0, "seminar": 400, "uShape": 0, "banquet": 0},
        {"name": "Le Salon Hergé", "m2": "165", "height": "3m36", "theatre": 0, "seminar": 70, "uShape": 35, "banquet": 0},
        {"name": "Salon Vaud", "m2": "95", "height": "2m69", "theatre": 30, "seminar": 50, "uShape": 28, "banquet": 0},
        {"name": "Salon Genève", "m2": "72", "height": "2m69", "theatre": 24, "seminar": 40, "uShape": 24, "banquet": 0},
        {"name": "Salon Fribourg", "m2": "76", "height": "2m69", "theatre": 24, "seminar": 40, "uShape": 24, "banquet": 0},
        {"name": "Salon Neuchâtel", "m2": "70", "height": "2m69", "theatre": 16, "seminar": 35, "uShape": 20, "banquet": 0},
        {"name": "Salon Valais", "m2": "57", "height": "2m69", "theatre": 12, "seminar": 25, "uShape": 16, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Soundproofed plenary room with natural light",
          "Filtered mineral water at discretion",
          "Notepads and pens",
          "Samsung Flip touch screen, Logitech videoconferencing, Barco sharing",
          "2 coffee breaks/day with pastries, fruit, snacks",
          "3-course lunch or buffet (from 30 ppl)",
          "Free WiFi",
          "Conference & Events team assistance"
        ],
        "priceDay": "CHF 145.00 (€ 155)",
        "priceHalfDay": "CHF 125.00 (€ 134)"
      }
    }
  },
  {
    "id": "hotel-victoria",
    "type": "hotel",
    "enabled": true,
    "title": "Victoria Hotel & Residence 4*",
    "content": "Reopened in December 2022, the Victoria Hotel & Residence 4* offers a contemporary setting with superb views of the Alps. Fully renovated, the property features modern architecture inspired by local materials and Swiss authenticity.\nIts 156 rooms and family suites present an elegant and functional design, perfectly suited for professional group stays.\nPool, sauna, fitness and a bar with terrace complete the offer.",
    "images": [],
    "metadata": {
      "hotelSlug": "eurotel-victoria",
      "category": "4*",
      "conferenceRooms": [
        {"name": "Villars", "m2": "190", "height": "2m80", "theatre": 60, "seminar": 160, "uShape": 40, "banquet": 0},
        {"name": "Villars 1", "m2": "95", "height": "2m80", "theatre": 30, "seminar": 80, "uShape": 20, "banquet": 0},
        {"name": "Villars 2", "m2": "95", "height": "2m80", "theatre": 30, "seminar": 80, "uShape": 20, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Soundproofed plenary room with natural light",
          "Filtered mineral water",
          "Notepads and pens",
          "Samsung Flip 85\" touch screen",
          "2 coffee breaks/day",
          "3-course business lunch or buffet (from 30 ppl)",
          "Free WiFi",
          "Conference & Events team assistance"
        ],
        "priceDay": "CHF 120.00 (€ 129)",
        "priceHalfDay": "CHF 105.00 (€ 113)"
      }
    }
  },
  {
    "id": "hotel-viu",
    "type": "hotel",
    "enabled": true,
    "title": "Hotel VIU 4*",
    "content": "Located in the heart of Villars, Hotel VIU hosts seminars and private events in a warm setting blending Chinese art de vivre with a mountain ambiance.\n60 rooms and a renovated wellness area. Panoramic views.",
    "images": [],
    "metadata": {
      "hotelSlug": "hotel-viu",
      "category": "4*",
      "conferenceRooms": [
        {"name": "Chamois", "m2": "75", "height": "2m34", "theatre": 20, "seminar": 40, "uShape": 20, "banquet": 0},
        {"name": "Bouquetin", "m2": "75", "height": "2m34", "theatre": 20, "seminar": 40, "uShape": 20, "banquet": 0},
        {"name": "Chevreuil", "m2": "150", "height": "2m34", "theatre": 40, "seminar": 100, "uShape": 0, "banquet": 0},
        {"name": "Renardeau", "m2": "82", "height": "2m47", "theatre": 20, "seminar": 30, "uShape": 20, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Plenary room with daylight and terrace access",
          "Beamer, flipchart, notepad, pen, Huawei connected screen",
          "Permanent break: Nespresso, tea, fruit, juice, water, pastries",
          "High-speed WiFi 6",
          "Half-board, 3-course lunch or dinner, water & coffee incl."
        ],
        "priceDay": "CHF 126.00 (€ 135)",
        "priceHalfDay": "CHF 90.00 (€ 97)"
      }
    }
  },
  {
    "id": "hotel-alpe-fleurie",
    "type": "hotel",
    "enabled": true,
    "title": "Alpe Fleurie Hotel & Residence 3*",
    "content": "Three generations of hospitality tradition since 1946. Ideally located in the heart of the resort with direct access to ski slopes and hiking trails.\nA wide choice of rooms with panoramic Alpine views. Traditional restaurant with panoramic terrace.",
    "images": [],
    "metadata": {"hotelSlug": "alpe-fleurie", "category": "3*"}
  },
  {
    "id": "activities-summer",
    "type": "activities-summer",
    "enabled": true,
    "title": "Summer activities & team buildings",
    "content": "The Villars-Gryon-Les Diablerets-Bex region offers a wide range of activities.\nHere is an overview of some group activities. Many other activities are available on request.\n\nPrices may vary depending on the number of participants and specific requirements.\nManagement fee and VAT 8.1% not included.\nContact Villars Experience, our exclusive partner for activities.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Alpine Olympics", "description": "Milking a cow, playing the alphorn or chopping wood: take part in these and many other activities during the Alpine-inspired Olympic games.", "price": "from CHF 65.00 (€ 66) / pers."},
        {"name": "Treasure Hunt", "description": "Explore the region using clues and riddles while roaming through Alpine villages and meadows.", "price": "from CHF 55.00 (€ 56) / pers."},
        {"name": "Private Yurt", "description": "Enjoy a relaxing evening in nature in our charming yurt at the edge of the forest, tasting local products.", "price": "from CHF 85.00 (€ 87) / pers."},
        {"name": "EscapeXperience", "description": "Mobile escape games for those who love solving mysteries and deciphering riddles. Playable indoors or outdoors.", "price": "from CHF 85.00 (€ 87) / pers."}
      ]
    }
  },
  {
    "id": "activities-winter",
    "type": "activities-winter",
    "enabled": true,
    "title": "Winter activities & team buildings",
    "content": "The Villars-Gryon-Les Diablerets-Bex region offers a wide range of winter activities.\nMany other activities are available on request.\n\nPrices may vary. Management fee and VAT 8.1% not included.\nContact Villars Experience, our exclusive partner for activities.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Sliding Challenges", "description": "Various sliding, agility and concentration activities in a fun and playful rotation format.", "price": "from CHF 65.00 (€ 66) / pers."},
        {"name": "Curling", "description": "After learning the basics, teams compete in a tournament. A unique chance to discover this precision sport.", "price": "from CHF 75.00 (€ 77) / pers."},
        {"name": "Snowshoeing", "description": "Snowshoe hike discovering sublime panoramas, magical moments in the heart of the mountain.", "price": "from CHF 55.00 (€ 58) / pers."},
        {"name": "Biathlon initiation", "description": "Combine rifle shooting with a relay race on snowshoes, on foot or cross-country skiing. Ideal for team cohesion.", "price": "from CHF 85.00 (€ 87) / pers."},
        {"name": "Mountain refuge evening", "description": "Raclette evening over a wood fire in a chalet built in 1700, privatised for 15-30 participants.", "price": "from CHF 51.00 (€ 52) / pers."}
      ]
    }
  },
  {
    "id": "ski",
    "type": "ski",
    "enabled": true,
    "title": "Ski area",
    "content": "132 km of slopes for all levels, from 1,200 to 3,000 metres altitude.\nPrices below grant access to the entire ski area, excluding Glacier 3000. Group rates available on request.\n\nSki instructor: CHF 525.00 (€ 561) / day\nMountain guide: CHF 670.00 (€ 717) / day",
    "images": [],
    "metadata": {
      "skiPrices": [
        {"period": "From 12pm", "skipass": "CHF 54.00 (€ 58)", "rental": "CHF 68.00 (€ 73)"},
        {"period": "1 day", "skipass": "CHF 74.00 (€ 79)", "rental": "CHF 83.00 (€ 89)"},
        {"period": "2 days", "skipass": "CHF 134.00 (€ 143)", "rental": "CHF 147.00 (€ 157)"}
      ]
    }
  },
  {
    "id": "contacts",
    "type": "contacts",
    "enabled": true,
    "title": "Contacts",
    "content": "A team of professionals at your service to offer fast and personalised solutions for your mountain events.\n\nSEMINARS DEPARTMENT\nVillars - Les Diablerets\nseminaires@villars.ch\nwww.alpesvaudoises.ch",
    "images": [],
    "metadata": null
  }
]'::jsonb
WHERE destination = 'villars' AND lang = 'en';

-- =============================================
-- VILLARS / DE
-- =============================================
UPDATE brochure_templates
SET sections = '[
  {
    "id": "welcome",
    "type": "welcome",
    "enabled": true,
    "title": "Willkommen in Villars",
    "content": "Der Ferienort Villars liegt am östlichen Ende des Genfersees im französischsprachigen Teil der Schweiz und ist einer der nächstgelegenen Schweizer Bergferienorte zum Flughafen Genf. Auf einem natürlichen, nach Süden ausgerichteten Balkon gelegen, bietet der Ort Sport, Erholung und Kultur.\nAuf 1''250 m Höhe sind alle Ferienfreuden in einer idyllischen Umgebung mit einem grossartigen Panorama vom Genfersee bis zum Mont Blanc möglich.\n\nAKTIVITÄTEN UND DIENSTLEISTUNGEN FÜR GRUPPEN\nVillars Experience ist der offizielle Partner für alle Gruppenaktivitäten und Dienstleistungen. Seit über 35 Jahren bieten sie Aktivitäten, Teambuildings, Abendessen und massgeschneiderte Transfers an.",
    "images": [],
    "metadata": null
  },
  {
    "id": "hotel-royalp",
    "type": "hotel",
    "enabled": true,
    "title": "Chalet Royalp Hotel & Spa 5*",
    "content": "Aussergewöhnlich gut gelegen auf den Höhen von Villars-sur-Ollon mit atemberaubendem Blick auf die Schweizer und französischen Alpen. Das erste Fünf-Sterne-Hotel des Ortes mit direktem Zugang zu den Pisten im Winter und zum Golfplatz im Sommer.\nMitglied der Leading Hotels of the World, mit 62 Zimmern und 27 Residenzen. Das Spa by RoyAlp bietet 1''200 m2 Entspannung.",
    "images": [],
    "metadata": {
      "hotelSlug": "royalp",
      "category": "5*",
      "conferenceRooms": [
        {"name": "Le Grand Muveran", "m2": "130", "height": "2m80", "theatre": 56, "seminar": 95, "uShape": 45, "banquet": 0},
        {"name": "Les Dents du Midi", "m2": "135", "height": "4m – 5m40", "theatre": 40, "seminar": 75, "uShape": 33, "banquet": 0},
        {"name": "Riveralp", "m2": "315", "height": "2m80 – 5m40", "theatre": 80, "seminar": 200, "uShape": 80, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Schallisolierter Plenarsaal mit Tageslicht",
          "Mineralwasser, Notizblöcke, Stifte, 2x Flipchart",
          "Click & Share, Bildschirm, Beamer, 360°-Sound, 1 Funkmikrofon",
          "Permanente Kaffeepause: Nespresso, Tees, Saft, Wasser, Früchte",
          "Morgens: Gebäck und herzhafte Chef-Pause",
          "Nachmittags: Fruchtspiesse und süsse Chef-Pause",
          "2-Gang-Mittagessen oder Buffet (ab 20 Pers.)",
          "Betreuung durch Konferenz- & Event-Team"
        ],
        "priceDay": "CHF 135.00 (€ 145)",
        "priceHalfDay": "CHF 120.00 (€ 129)"
      }
    }
  },
  {
    "id": "hotel-villars-palace",
    "type": "hotel",
    "enabled": true,
    "title": "Villars Palace 5* Superior",
    "content": "2022 nach zweijähriger Renovation wiedereröffnet, vereint der Villars Palace Geschichte, Kunst und Umweltengagement. 109 Zimmer und Suiten in minimalistischem, warmem Design.\nSieben ausgestattete Seminarräume, ein historisches Theater von 1895, ein spektakulärer Ballsaal.",
    "images": [],
    "metadata": {
      "hotelSlug": "villars-palace",
      "category": "5* Superior",
      "conferenceRooms": [
        {"name": "La Ballroom", "m2": "443", "height": "-", "theatre": 0, "seminar": 0, "uShape": 0, "banquet": 0},
        {"name": "Le Théâtre", "m2": "395", "height": "5m61", "theatre": 0, "seminar": 400, "uShape": 0, "banquet": 0},
        {"name": "Le Salon Hergé", "m2": "165", "height": "3m36", "theatre": 0, "seminar": 70, "uShape": 35, "banquet": 0},
        {"name": "Salon Vaud", "m2": "95", "height": "2m69", "theatre": 30, "seminar": 50, "uShape": 28, "banquet": 0},
        {"name": "Salon Genève", "m2": "72", "height": "2m69", "theatre": 24, "seminar": 40, "uShape": 24, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Schallisolierter Plenarsaal mit Tageslicht",
          "Gefiltertes Mineralwasser",
          "Notizblöcke und Stifte",
          "Samsung Flip Touchscreen, Logitech Videokonferenz, Barco-Sharing",
          "2 Kaffeepausen/Tag",
          "3-Gang-Mittagessen oder Buffet (ab 30 Pers.)",
          "Gratis WLAN",
          "Betreuung durch Konferenz- & Event-Team"
        ],
        "priceDay": "CHF 145.00 (€ 155)",
        "priceHalfDay": "CHF 125.00 (€ 134)"
      }
    }
  },
  {
    "id": "hotel-victoria",
    "type": "hotel",
    "enabled": true,
    "title": "Victoria Hotel & Residence 4*",
    "content": "Im Dezember 2022 wiedereröffnet, bietet das Victoria Hotel einen zeitgenössischen Rahmen mit herrlichem Alpenblick. 156 Zimmer und Familiensuiten. Pool, Sauna, Fitness und Bar mit Terrasse.",
    "images": [],
    "metadata": {
      "hotelSlug": "eurotel-victoria",
      "category": "4*",
      "conferenceRooms": [
        {"name": "Villars", "m2": "190", "height": "2m80", "theatre": 60, "seminar": 160, "uShape": 40, "banquet": 0},
        {"name": "Villars 1", "m2": "95", "height": "2m80", "theatre": 30, "seminar": 80, "uShape": 20, "banquet": 0},
        {"name": "Villars 2", "m2": "95", "height": "2m80", "theatre": 30, "seminar": 80, "uShape": 20, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Schallisolierter Plenarsaal mit Tageslicht",
          "Gefiltertes Mineralwasser",
          "Samsung Flip 85\" Touchscreen",
          "2 Kaffeepausen/Tag",
          "3-Gang-Mittagessen oder Buffet",
          "Gratis WLAN"
        ],
        "priceDay": "CHF 120.00 (€ 129)",
        "priceHalfDay": "CHF 105.00 (€ 113)"
      }
    }
  },
  {
    "id": "hotel-viu",
    "type": "hotel",
    "enabled": true,
    "title": "Hotel VIU 4*",
    "content": "Im Herzen von Villars gelegen. 60 Zimmer und renovierter Wellnessbereich. Panoramablick. Restaurant Horizon 1904 mit asiatischer Küche.",
    "images": [],
    "metadata": {
      "hotelSlug": "hotel-viu",
      "category": "4*",
      "conferenceRooms": [
        {"name": "Chamois", "m2": "75", "height": "2m34", "theatre": 20, "seminar": 40, "uShape": 20, "banquet": 0},
        {"name": "Bouquetin", "m2": "75", "height": "2m34", "theatre": 20, "seminar": 40, "uShape": 20, "banquet": 0},
        {"name": "Chevreuil", "m2": "150", "height": "2m34", "theatre": 40, "seminar": 100, "uShape": 0, "banquet": 0},
        {"name": "Renardeau", "m2": "82", "height": "2m47", "theatre": 20, "seminar": 30, "uShape": 20, "banquet": 0}
      ],
      "conferencePackage": {
        "priceDay": "CHF 126.00 (€ 135)",
        "priceHalfDay": "CHF 90.00 (€ 97)",
        "includes": ["Plenarsaal mit Tageslicht und Terrasse", "Beamer, Flipchart, Huawei-Bildschirm", "Permanente Pause: Nespresso, Tee, Früchte", "Highspeed WiFi 6", "Halbpension, 3-Gang-Menü"]
      }
    }
  },
  {
    "id": "hotel-alpe-fleurie",
    "type": "hotel",
    "enabled": true,
    "title": "Alpe Fleurie Hotel & Residenz 3*",
    "content": "Drei Generationen Gastfreundschaft seit 1946. Ideal gelegen im Zentrum des Ortes mit direktem Zugang zu Skipisten und Wanderwegen. Panoramaterrasse mit Blick auf die Dents-du-Midi.",
    "images": [],
    "metadata": {"hotelSlug": "alpe-fleurie", "category": "3*"}
  },
  {
    "id": "activities-summer",
    "type": "activities-summer",
    "enabled": true,
    "title": "Sommeraktivitäten & Teambuildings",
    "content": "Die Region Villars-Gryon-Les Diablerets-Bex bietet eine breite Palette an Aktivitäten.\nHier ein Überblick über einige Gruppenaktivitäten. Viele weitere Aktivitäten auf Anfrage.\n\nPreise können je nach Teilnehmerzahl variieren.\nManagementgebühr und MwSt. 8,1% nicht inbegriffen.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Alp-Olympiade", "description": "Kuh melken, Alphorn spielen oder Holz hacken: Nehmen Sie an diesen und vielen weiteren alpenländischen Olympia-Spielen teil.", "price": "ab CHF 65.00 (€ 66) / Pers."},
        {"name": "Schatzsuche", "description": "Erkunden Sie die Region mit Hinweisen und Rätseln durch alpine Dörfer und Wiesen.", "price": "ab CHF 55.00 (€ 56) / Pers."},
        {"name": "Private Jurte", "description": "Geniessen Sie einen entspannten Abend in der Natur in unserer Jurte am Waldrand.", "price": "ab CHF 85.00 (€ 87) / Pers."},
        {"name": "EscapeXperience", "description": "Mobile Escape Games für alle, die Rätsel lösen lieben. Drinnen oder draussen spielbar.", "price": "ab CHF 85.00 (€ 87) / Pers."}
      ]
    }
  },
  {
    "id": "activities-winter",
    "type": "activities-winter",
    "enabled": true,
    "title": "Winteraktivitäten & Teambuildings",
    "content": "Die Region bietet eine breite Palette an Winteraktivitäten.\nViele weitere Aktivitäten auf Anfrage.\n\nPreise sind Richtwerte. Managementgebühr und MwSt. nicht inbegriffen.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Rutsch-Challenges", "description": "Verschiedene Rutsch-, Geschicklichkeits- und Konzentrationsposten im Rotationsprinzip.", "price": "ab CHF 65.00 (€ 66) / Pers."},
        {"name": "Curling", "description": "Nach dem Erlernen der Grundlagen treten die Teams in einem Turnier gegeneinander an.", "price": "ab CHF 75.00 (€ 77) / Pers."},
        {"name": "Schneeschuhwandern", "description": "Schneeschuhwanderung mit atemberaubenden Panoramen im Herzen der Berge.", "price": "ab CHF 55.00 (€ 58) / Pers."},
        {"name": "Biathlon-Einführung", "description": "Kombination aus Gewehrschiessen und Staffellauf auf Schneeschuhen. Ideal für Teamzusammenhalt.", "price": "ab CHF 85.00 (€ 87) / Pers."},
        {"name": "Hüttenabend", "description": "Raclette-Abend am Holzfeuer in einem Chalet von 1700, privatisiert für 15-30 Teilnehmer.", "price": "ab CHF 51.00 (€ 52) / Pers."}
      ]
    }
  },
  {
    "id": "ski",
    "type": "ski",
    "enabled": true,
    "title": "Skigebiet",
    "content": "132 km Pisten für alle Niveaus, von 1''200 bis 3''000 Meter Höhe.\nDie untenstehenden Tarife gelten für das gesamte Skigebiet ohne Glacier 3000. Gruppentarife auf Anfrage.\n\nSkilehrer: CHF 525.00 (€ 561) / Tag\nBergführer: CHF 670.00 (€ 717) / Tag",
    "images": [],
    "metadata": {
      "skiPrices": [
        {"period": "Ab 12 Uhr", "skipass": "CHF 54.00 (€ 58)", "rental": "CHF 68.00 (€ 73)"},
        {"period": "1 Tag", "skipass": "CHF 74.00 (€ 79)", "rental": "CHF 83.00 (€ 89)"},
        {"period": "2 Tage", "skipass": "CHF 134.00 (€ 143)", "rental": "CHF 147.00 (€ 157)"}
      ]
    }
  },
  {
    "id": "contacts",
    "type": "contacts",
    "enabled": true,
    "title": "Kontakte",
    "content": "Ein Team von Fachleuten steht Ihnen für schnelle und massgeschneiderte Lösungen für Ihre Bergveranstaltungen zur Verfügung.\n\nSEMINARS DEPARTMENT\nVillars - Les Diablerets\nseminaires@villars.ch\nwww.alpesvaudoises.ch",
    "images": [],
    "metadata": null
  }
]'::jsonb
WHERE destination = 'villars' AND lang = 'de';

-- =============================================
-- DIABLERETS / FR
-- =============================================
UPDATE brochure_templates
SET sections = '[
  {
    "id": "welcome",
    "type": "welcome",
    "enabled": true,
    "title": "Bienvenue aux Diablerets",
    "content": "Au cœur des Alpes Vaudoises et dans une nature intacte, la station des Diablerets est un authentique village de montagne, situé au pied d''un imposant massif montagneux, coiffé d''un des plus beaux glaciers de Suisse.\nSituée à l''extrémité Est du Lac Léman, blottie à 1''200 mètres d''altitude, la station se trouve dans la partie francophone de la Suisse et est l''une des stations les plus proches de l''aéroport de Genève, à seulement 130 km.\nLa station dispose d''une Maison des Congrès et de salles de conférences pouvant accueillir jusqu''à 350 personnes. Une belle offre hôtelière de près de 400 lits dans des hôtels MICE.\n\nACTIVITES ET SERVICES POUR GROUPES\nDiablerets Expérience est le partenaire officiel pour toutes les demandes de services et d''activités pour groupes.",
    "images": [],
    "metadata": null
  },
  {
    "id": "hotel-glacier",
    "type": "hotel",
    "enabled": true,
    "title": "The Glacier Hotel 4*+",
    "content": "The Glacier Hotel est un établissement situé au cœur du village, dirigé depuis plus de 40 ans par la famille Wartner.\nDoté du confort d''un hôtel 4* Supérieur, il comprend un restaurant proposant une excellente cuisine traditionnelle, un bar, une piscine, un sauna et un sanarium.\n110 chambres spacieuses dont 25 Junior Suites, la plupart avec balcon et vue sur les montagnes.\nSitué à proximité des pistes de ski, de ski fond et de la patinoire.",
    "images": [],
    "metadata": {
      "hotelSlug": "glacier-hotel",
      "category": "4*+",
      "conferenceRooms": [
        {"name": "Salon Diablerets", "m2": "180", "height": "2m60", "theatre": 65, "seminar": 150, "uShape": 30, "banquet": 0},
        {"name": "Salon Isenau", "m2": "33", "height": "2m50", "theatre": 20, "seminar": 35, "uShape": 15, "banquet": 0},
        {"name": "Salon Meilleret", "m2": "22", "height": "2m50", "theatre": 10, "seminar": 20, "uShape": 10, "banquet": 0},
        {"name": "Salon Villars", "m2": "30", "height": "2m80", "theatre": 12, "seminar": 15, "uShape": 14, "banquet": 0},
        {"name": "Salon Isenau + Meilleret", "m2": "55", "height": "2m60", "theatre": 30, "seminar": 55, "uShape": 26, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Verre de bienvenue, nuitée, petit déjeuner",
          "Lunch léger, dîner 4 plats",
          "2 pauses café, eaux minérales pendant la conférence",
          "Libre utilisation de la salle et des équipements",
          "Piscine couverte, sauna, sanarium, carte Bienvenue (été)",
          "Écrans, beamer, rétroprojecteur, flipchart, pupitre, TV vidéo",
          "WiFi dans toutes les chambres et salles"
        ]
      }
    }
  },
  {
    "id": "hotel-les-sources",
    "type": "hotel",
    "enabled": true,
    "title": "Hôtel Les Sources 3*",
    "content": "L''Hôtel Les Sources est agréablement situé près du centre du village, face au prestigieux massif des Diablerets.\nIdéalement situé à 100 mètres du Parc des Sports, à 300 mètres des remontées mécaniques et de la Maison des Congrès.\nRénové en 2005, 48 chambres non-fumeurs avec douche/WC, radio, téléphone, TV et WiFi gratuit, restaurant, bar, terrasse, salon avec cheminée et minigolf.",
    "images": [],
    "metadata": {
      "hotelSlug": "les-sources",
      "category": "3*",
      "conferenceRooms": [
        {"name": "Glacier", "m2": "110", "height": "3m", "theatre": 60, "seminar": 90, "uShape": 28, "banquet": 0},
        {"name": "Isenau", "m2": "45", "height": "3m", "theatre": 25, "seminar": 35, "uShape": 16, "banquet": 0},
        {"name": "Chaussy", "m2": "30", "height": "2m50", "theatre": 16, "seminar": 20, "uShape": 12, "banquet": 0},
        {"name": "Bretaye", "m2": "15", "height": "2m50", "theatre": 9, "seminar": 11, "uShape": 0, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Logement en chambre individuelle ou double",
          "Petit-déjeuner buffet",
          "1 à 2 pauses café, minérales pendant les séances",
          "Salle de réunion (de 5 à 60 personnes)",
          "Bloc-notes, stylos, flip-chart, rétroprojecteur, beamer",
          "WiFi, parking gratuit"
        ]
      }
    }
  },
  {
    "id": "hotel-du-pillon",
    "type": "hotel",
    "enabled": true,
    "title": "Swiss Historic Hotel du Pillon 3*",
    "content": "Le Swiss Historic Hotel du Pillon 3* est un boutique-hôtel de 14 chambres offrant une vue magnifique sur le glacier des Diablerets.\nIdéal pour de petits séminaires (jusqu''à 14 en simples, 28 en doubles). Salle de séminaire de 90 m² au dernier étage avec vue panoramique sur le glacier.\nPossibilité de louer l''ensemble de l''hôtel (CHF 2''200 à 2''600 selon saison).",
    "images": [],
    "metadata": {
      "hotelSlug": "hotel-du-pillon",
      "category": "3*",
      "conferenceRooms": [
        {"name": "Salle de séminaire", "m2": "90", "height": "-", "theatre": 20, "seminar": 20, "uShape": 20, "banquet": 0}
      ]
    }
  },
  {
    "id": "hotel-les-lilas",
    "type": "hotel",
    "enabled": true,
    "title": "Hôtel des Lilas 3*",
    "content": "L''Hôtel des Lilas offre une oasis de tranquillité dans un chalet construit en 1891, avec une superbe vue sur le massif des Diablerets.\n10 chambres traditionnelles rénovées, toutes dotées d''un design unique et authentique de style chalet, d''une salle de bain, TV et Wi-Fi gratuit. Sauna privatif.",
    "images": [],
    "metadata": {
      "hotelSlug": "les-lilas",
      "category": "3*"
    }
  },
  {
    "id": "activities-summer",
    "type": "activities-summer",
    "enabled": true,
    "title": "Activités et teambuildings été",
    "content": "La région de Villars-Gryon-Les Diablerets-Bex offre une large palette d''activités.\nVoici un aperçu de quelques activités pour groupes. De nombreuses autres activités sont possibles sur demande.\n\nLes prix indiqués sont susceptibles de varier.\nFrais de gestion et TVA 8,1% non compris.\nContactez Diablerets Expérience, notre partenaire exclusif pour les activités.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Les Olympiades des alpages", "description": "Traire une vache, jouer du cor des Alpes ou couper du bois : participez à ces jeux olympiques des alpages.", "price": "dès CHF 65.00 (€ 66) / pers."},
        {"name": "Chasse aux trésors", "description": "Explorez la région à l''aide d''indices et d''énigmes à travers villages et prairies alpines.", "price": "dès CHF 55.00 (€ 56) / pers."},
        {"name": "Yourte privée", "description": "Soirée relaxante en pleine nature dans une yourte à l''orée de la forêt avec produits locaux.", "price": "dès CHF 85.00 (€ 87) / pers."},
        {"name": "EscapeXperience", "description": "Escape games mobiles jouables en intérieur comme en extérieur.", "price": "dès CHF 85.00 (€ 87) / pers."}
      ]
    }
  },
  {
    "id": "activities-winter",
    "type": "activities-winter",
    "enabled": true,
    "title": "Activités et teambuildings hiver",
    "content": "La région offre une large palette d''activités hivernales.\nDe nombreuses autres activités sont possibles sur demande.\n\nTarifs à titre indicatif. Management fee et TVA 8.1% non inclus.\nContactez Diablerets Expérience pour les activités.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Challenges de glisse", "description": "Activités de glisse, d''agilité et de concentration en tournus.", "price": "dès CHF 65.00 (€ 66) / pers."},
        {"name": "Curling", "description": "Apprentissage des bases puis tournoi entre équipes.", "price": "dès CHF 75.00 (€ 77) / pers."},
        {"name": "Randonnée en raquettes", "description": "Découverte de sublimes panoramas au cœur de la montagne.", "price": "dès CHF 55.00 (€ 58) / pers."},
        {"name": "Initiation au biathlon", "description": "Tir à la carabine combiné à une course relai. Idéal pour la cohésion d''équipe.", "price": "dès CHF 85.00 (€ 87) / pers."},
        {"name": "Soirée refuge", "description": "Raclette au feu de bois dans un chalet privatisé pour 15 à 30 participants.", "price": "dès CHF 51.00 (€ 52) / pers."}
      ]
    }
  },
  {
    "id": "ski",
    "type": "ski",
    "enabled": true,
    "title": "Domaine skiable",
    "content": "132 km de pistes pour tous les niveaux, de 1''200 à 3''000 mètres d''altitude.\nAccès au Glacier 3000 possible. Tarifs de groupe sur demande.\n\nMoniteur de ski : journée CHF 525.00 (€ 561)\nGuide de montagne : journée CHF 670.00 (€ 717)",
    "images": [],
    "metadata": {
      "skiPrices": [
        {"period": "Dès 12h", "skipass": "CHF 54.00 (€ 58)", "rental": "CHF 68.00 (€ 73)"},
        {"period": "1 jour", "skipass": "CHF 74.00 (€ 79)", "rental": "CHF 83.00 (€ 89)"},
        {"period": "2 jours", "skipass": "CHF 134.00 (€ 143)", "rental": "CHF 147.00 (€ 157)"}
      ]
    }
  },
  {
    "id": "contacts",
    "type": "contacts",
    "enabled": true,
    "title": "Contacts",
    "content": "Une équipe de professionnels à votre service pour des solutions rapides et personnalisées.\n\nSEMINARS DEPARTMENT\nVillars - Les Diablerets\nseminaires@villars.ch\nwww.alpesvaudoises.ch",
    "images": [],
    "metadata": null
  }
]'::jsonb
WHERE destination = 'diablerets' AND lang = 'fr';

-- =============================================
-- DIABLERETS / EN
-- =============================================
UPDATE brochure_templates
SET sections = '[
  {
    "id": "welcome",
    "type": "welcome",
    "enabled": true,
    "title": "Welcome to Les Diablerets",
    "content": "In the heart of the Vaud Alps and amidst unspoiled nature, Les Diablerets is an authentic mountain village at the foot of an imposing massif crowned by one of the most beautiful glaciers in Switzerland.\nLocated at the eastern end of Lake Geneva at 1,200m altitude, in the French-speaking part of Switzerland, only 130 km from Geneva Airport.\nThe resort has a Congress Centre and conference rooms accommodating up to 350 people, with nearly 400 MICE hotel beds.\n\nACTIVITIES AND SERVICES FOR GROUPS\nDiablerets Experience is the official partner for all group activity and service requests.",
    "images": [],
    "metadata": null
  },
  {
    "id": "hotel-glacier",
    "type": "hotel",
    "enabled": true,
    "title": "The Glacier Hotel 4*+",
    "content": "Located in the heart of the village, run by the Wartner family for over 40 years. 4* Superior comfort with traditional restaurant, bar, pool, sauna and sanarium.\n110 spacious rooms including 25 Junior Suites, most with balcony and mountain views. Near ski slopes, cross-country skiing and ice rink.",
    "images": [],
    "metadata": {
      "hotelSlug": "glacier-hotel",
      "category": "4*+",
      "conferenceRooms": [
        {"name": "Salon Diablerets", "m2": "180", "height": "2m60", "theatre": 65, "seminar": 150, "uShape": 30, "banquet": 0},
        {"name": "Salon Isenau", "m2": "33", "height": "2m50", "theatre": 20, "seminar": 35, "uShape": 15, "banquet": 0},
        {"name": "Salon Meilleret", "m2": "22", "height": "2m50", "theatre": 10, "seminar": 20, "uShape": 10, "banquet": 0},
        {"name": "Salon Villars", "m2": "30", "height": "2m80", "theatre": 12, "seminar": 15, "uShape": 14, "banquet": 0},
        {"name": "Salon Isenau + Meilleret", "m2": "55", "height": "2m60", "theatre": 30, "seminar": 55, "uShape": 26, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Welcome drink, overnight stay, breakfast",
          "Light lunch, 4-course dinner",
          "2 coffee breaks, mineral water during conference",
          "Free use of room and hotel facilities",
          "Indoor pool, sauna, sanarium, Welcome Card (summer)",
          "Screens, beamer, overhead projector, flipchart, WiFi"
        ]
      }
    }
  },
  {
    "id": "hotel-les-sources",
    "type": "hotel",
    "enabled": true,
    "title": "Hotel Les Sources 3*",
    "content": "Pleasantly located near the village centre, facing the prestigious Diablerets massif. 100m from the Sports Park, 300m from the ski lifts and Congress Centre.\n48 non-smoking rooms, restaurant, bar, terrace, lounge with fireplace and mini-golf.",
    "images": [],
    "metadata": {
      "hotelSlug": "les-sources",
      "category": "3*",
      "conferenceRooms": [
        {"name": "Glacier", "m2": "110", "height": "3m", "theatre": 60, "seminar": 90, "uShape": 28, "banquet": 0},
        {"name": "Isenau", "m2": "45", "height": "3m", "theatre": 25, "seminar": 35, "uShape": 16, "banquet": 0},
        {"name": "Chaussy", "m2": "30", "height": "2m50", "theatre": 16, "seminar": 20, "uShape": 12, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": ["Accommodation", "Buffet breakfast", "1-2 coffee breaks, mineral water", "Meeting room (5-60 people)", "Notepads, pens, flipchart, beamer", "WiFi, free parking"]
      }
    }
  },
  {
    "id": "hotel-du-pillon",
    "type": "hotel",
    "enabled": true,
    "title": "Swiss Historic Hotel du Pillon 3*",
    "content": "A 14-room boutique hotel with magnificent views of the Diablerets glacier. 90m² seminar room on the top floor with panoramic glacier views. Entire hotel available for hire.",
    "images": [],
    "metadata": {
      "hotelSlug": "hotel-du-pillon",
      "category": "3*",
      "conferenceRooms": [
        {"name": "Seminar room", "m2": "90", "height": "-", "theatre": 20, "seminar": 20, "uShape": 20, "banquet": 0}
      ]
    }
  },
  {
    "id": "hotel-les-lilas",
    "type": "hotel",
    "enabled": true,
    "title": "Hotel des Lilas 3*",
    "content": "An oasis of tranquility in a chalet built in 1891, with superb views. 10 renovated rooms with unique chalet-style design, bathroom, TV and free Wi-Fi. Private sauna.",
    "images": [],
    "metadata": {"hotelSlug": "les-lilas", "category": "3*"}
  },
  {
    "id": "activities-summer",
    "type": "activities-summer",
    "enabled": true,
    "title": "Summer activities & team buildings",
    "content": "The region offers a wide range of group activities. Many other activities available on request.\nPrices may vary. Management fee and VAT 8.1% not included.\nContact Diablerets Experience, our exclusive partner for activities.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Alpine Olympics", "description": "Alpine-inspired Olympic games with traditional activities.", "price": "from CHF 65.00 (€ 66) / pers."},
        {"name": "Treasure Hunt", "description": "Explore the region with clues and riddles through Alpine villages.", "price": "from CHF 55.00 (€ 56) / pers."},
        {"name": "Private Yurt", "description": "Relaxing evening in nature tasting local products.", "price": "from CHF 85.00 (€ 87) / pers."},
        {"name": "EscapeXperience", "description": "Mobile escape games, playable indoors or outdoors.", "price": "from CHF 85.00 (€ 87) / pers."}
      ]
    }
  },
  {
    "id": "activities-winter",
    "type": "activities-winter",
    "enabled": true,
    "title": "Winter activities & team buildings",
    "content": "A wide range of winter activities available on request.\nPrices are indicative. Management fee and VAT not included.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Sliding Challenges", "description": "Fun sliding, agility and concentration activities.", "price": "from CHF 65.00 (€ 66) / pers."},
        {"name": "Curling", "description": "Learn the basics then compete in a tournament.", "price": "from CHF 75.00 (€ 77) / pers."},
        {"name": "Snowshoeing", "description": "Discover sublime mountain panoramas.", "price": "from CHF 55.00 (€ 58) / pers."},
        {"name": "Biathlon initiation", "description": "Rifle shooting combined with relay race. Great for team cohesion.", "price": "from CHF 85.00 (€ 87) / pers."},
        {"name": "Mountain refuge evening", "description": "Raclette evening in a privatised 1700s chalet.", "price": "from CHF 51.00 (€ 52) / pers."}
      ]
    }
  },
  {
    "id": "ski",
    "type": "ski",
    "enabled": true,
    "title": "Ski area",
    "content": "132 km of slopes for all levels, from 1,200 to 3,000m. Access to Glacier 3000 possible. Group rates on request.\n\nSki instructor: CHF 525.00 (€ 561) / day\nMountain guide: CHF 670.00 (€ 717) / day",
    "images": [],
    "metadata": {
      "skiPrices": [
        {"period": "From 12pm", "skipass": "CHF 54.00 (€ 58)", "rental": "CHF 68.00 (€ 73)"},
        {"period": "1 day", "skipass": "CHF 74.00 (€ 79)", "rental": "CHF 83.00 (€ 89)"},
        {"period": "2 days", "skipass": "CHF 134.00 (€ 143)", "rental": "CHF 147.00 (€ 157)"}
      ]
    }
  },
  {
    "id": "contacts",
    "type": "contacts",
    "enabled": true,
    "title": "Contacts",
    "content": "A team of professionals at your service.\n\nSEMINARS DEPARTMENT\nVillars - Les Diablerets\nseminaires@villars.ch\nwww.alpesvaudoises.ch",
    "images": [],
    "metadata": null
  }
]'::jsonb
WHERE destination = 'diablerets' AND lang = 'en';

-- =============================================
-- DIABLERETS / DE
-- =============================================
UPDATE brochure_templates
SET sections = '[
  {
    "id": "welcome",
    "type": "welcome",
    "enabled": true,
    "title": "Willkommen in Les Diablerets",
    "content": "Im Herzen der Waadtländer Alpen und inmitten unberührter Natur ist Les Diablerets ein authentisches Bergdorf am Fuss eines imposanten Massivs mit einem der schönsten Gletscher der Schweiz.\nAm östlichen Ende des Genfersees auf 1''200 m Höhe gelegen, nur 130 km vom Flughafen Genf entfernt.\nDer Ort verfügt über ein Kongresshaus und Konferenzräume für bis zu 350 Personen, mit rund 400 MICE-Hotelbetten.\n\nAKTIVITÄTEN UND DIENSTLEISTUNGEN FÜR GRUPPEN\nDiablerets Experience ist der offizielle Partner für alle Gruppenaktivitäten und Dienstleistungen.",
    "images": [],
    "metadata": null
  },
  {
    "id": "hotel-glacier",
    "type": "hotel",
    "enabled": true,
    "title": "The Glacier Hotel 4*+",
    "content": "Im Dorfzentrum gelegen, seit über 40 Jahren von der Familie Wartner geführt. 4* Superior Komfort mit Restaurant, Bar, Pool, Sauna und Sanarium.\n110 geräumige Zimmer, davon 25 Junior Suiten, die meisten mit Balkon und Bergblick. Nahe Skipisten und Eisbahn.",
    "images": [],
    "metadata": {
      "hotelSlug": "glacier-hotel",
      "category": "4*+",
      "conferenceRooms": [
        {"name": "Salon Diablerets", "m2": "180", "height": "2m60", "theatre": 65, "seminar": 150, "uShape": 30, "banquet": 0},
        {"name": "Salon Isenau", "m2": "33", "height": "2m50", "theatre": 20, "seminar": 35, "uShape": 15, "banquet": 0},
        {"name": "Salon Meilleret", "m2": "22", "height": "2m50", "theatre": 10, "seminar": 20, "uShape": 10, "banquet": 0},
        {"name": "Salon Villars", "m2": "30", "height": "2m80", "theatre": 12, "seminar": 15, "uShape": 14, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": [
          "Begrüssungsgetränk, Übernachtung, Frühstück",
          "Leichtes Mittagessen, 4-Gang-Abendessen",
          "2 Kaffeepausen, Mineralwasser während der Konferenz",
          "Freie Nutzung des Saals und der Hotelanlagen",
          "Hallenbad, Sauna, Sanarium",
          "Bildschirme, Beamer, Flipchart, WLAN"
        ]
      }
    }
  },
  {
    "id": "hotel-les-sources",
    "type": "hotel",
    "enabled": true,
    "title": "Hotel Les Sources 3*",
    "content": "Angenehm nahe dem Dorfzentrum gelegen, gegenüber dem Diablerets-Massiv. 100m vom Sportpark, 300m von den Bergbahnen und dem Kongresshaus.\n48 Nichtraucherzimmer, Restaurant, Bar, Terrasse, Kaminlounge und Minigolf.",
    "images": [],
    "metadata": {
      "hotelSlug": "les-sources",
      "category": "3*",
      "conferenceRooms": [
        {"name": "Glacier", "m2": "110", "height": "3m", "theatre": 60, "seminar": 90, "uShape": 28, "banquet": 0},
        {"name": "Isenau", "m2": "45", "height": "3m", "theatre": 25, "seminar": 35, "uShape": 16, "banquet": 0},
        {"name": "Chaussy", "m2": "30", "height": "2m50", "theatre": 16, "seminar": 20, "uShape": 12, "banquet": 0}
      ],
      "conferencePackage": {
        "includes": ["Übernachtung", "Frühstücksbuffet", "1-2 Kaffeepausen, Mineralwasser", "Tagungsraum (5-60 Pers.)", "Notizblöcke, Stifte, Flipchart, Beamer", "WLAN, Gratis-Parkplatz"]
      }
    }
  },
  {
    "id": "hotel-du-pillon",
    "type": "hotel",
    "enabled": true,
    "title": "Swiss Historic Hotel du Pillon 3*",
    "content": "Boutique-Hotel mit 14 Zimmern und herrlichem Gletscherblick. 90 m² Seminarraum im Dachgeschoss mit Panoramablick. Ganzes Hotel mietbar.",
    "images": [],
    "metadata": {
      "hotelSlug": "hotel-du-pillon",
      "category": "3*",
      "conferenceRooms": [
        {"name": "Seminarraum", "m2": "90", "height": "-", "theatre": 20, "seminar": 20, "uShape": 20, "banquet": 0}
      ]
    }
  },
  {
    "id": "hotel-les-lilas",
    "type": "hotel",
    "enabled": true,
    "title": "Hotel des Lilas 3*",
    "content": "Ruheoase in einem 1891 erbauten Chalet mit herrlichem Blick auf das Diablerets-Massiv. 10 renovierte Zimmer im authentischen Chalet-Stil. Privatsauna.",
    "images": [],
    "metadata": {"hotelSlug": "les-lilas", "category": "3*"}
  },
  {
    "id": "activities-summer",
    "type": "activities-summer",
    "enabled": true,
    "title": "Sommeraktivitäten & Teambuildings",
    "content": "Die Region bietet eine breite Palette an Gruppenaktivitäten. Viele weitere auf Anfrage.\nPreise können variieren. Managementgebühr und MwSt. nicht inbegriffen.\nKontaktieren Sie Diablerets Experience.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Alp-Olympiade", "description": "Alpenländische Olympia-Spiele mit traditionellen Aktivitäten.", "price": "ab CHF 65.00 (€ 66) / Pers."},
        {"name": "Schatzsuche", "description": "Erkunden Sie die Region mit Hinweisen und Rätseln.", "price": "ab CHF 55.00 (€ 56) / Pers."},
        {"name": "Private Jurte", "description": "Entspannter Abend in der Natur mit lokalen Produkten.", "price": "ab CHF 85.00 (€ 87) / Pers."},
        {"name": "EscapeXperience", "description": "Mobile Escape Games, drinnen oder draussen spielbar.", "price": "ab CHF 85.00 (€ 87) / Pers."}
      ]
    }
  },
  {
    "id": "activities-winter",
    "type": "activities-winter",
    "enabled": true,
    "title": "Winteraktivitäten & Teambuildings",
    "content": "Breite Palette an Winteraktivitäten. Weitere auf Anfrage.\nRichtpreise. Managementgebühr und MwSt. nicht inbegriffen.",
    "images": [],
    "metadata": {
      "activities": [
        {"name": "Rutsch-Challenges", "description": "Rutsch- und Geschicklichkeitsposten im Rotationsprinzip.", "price": "ab CHF 65.00 (€ 66) / Pers."},
        {"name": "Curling", "description": "Grundlagen lernen und dann im Turnier antreten.", "price": "ab CHF 75.00 (€ 77) / Pers."},
        {"name": "Schneeschuhwandern", "description": "Atemberaubende Bergpanoramen entdecken.", "price": "ab CHF 55.00 (€ 58) / Pers."},
        {"name": "Biathlon-Einführung", "description": "Gewehrschiessen und Staffellauf. Ideal für Teamzusammenhalt.", "price": "ab CHF 85.00 (€ 87) / Pers."},
        {"name": "Hüttenabend", "description": "Raclette am Holzfeuer in einem privatisierten Chalet.", "price": "ab CHF 51.00 (€ 52) / Pers."}
      ]
    }
  },
  {
    "id": "ski",
    "type": "ski",
    "enabled": true,
    "title": "Skigebiet",
    "content": "132 km Pisten für alle Niveaus, 1''200 bis 3''000 m. Zugang zum Glacier 3000 möglich. Gruppentarife auf Anfrage.\n\nSkilehrer: CHF 525.00 (€ 561) / Tag\nBergführer: CHF 670.00 (€ 717) / Tag",
    "images": [],
    "metadata": {
      "skiPrices": [
        {"period": "Ab 12 Uhr", "skipass": "CHF 54.00 (€ 58)", "rental": "CHF 68.00 (€ 73)"},
        {"period": "1 Tag", "skipass": "CHF 74.00 (€ 79)", "rental": "CHF 83.00 (€ 89)"},
        {"period": "2 Tage", "skipass": "CHF 134.00 (€ 143)", "rental": "CHF 147.00 (€ 157)"}
      ]
    }
  },
  {
    "id": "contacts",
    "type": "contacts",
    "enabled": true,
    "title": "Kontakte",
    "content": "Ein Fachteam steht Ihnen zur Verfügung.\n\nSEMINARS DEPARTMENT\nVillars - Les Diablerets\nseminaires@villars.ch\nwww.alpesvaudoises.ch",
    "images": [],
    "metadata": null
  }
]'::jsonb
WHERE destination = 'diablerets' AND lang = 'de';
