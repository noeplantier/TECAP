export const matchKeys = [
  'lea',
  'ines',
  'camille',
  'manon',
  'arthur',
  'lucas',
  'enzo',
  'romane',
  'maxime',
  'tom',
  'romain',
  'baptiste',
  'yanis',
  'paul',
  'adrien',
  'jade',
];

export const passedKeys = ['mathis', 'hugo', 'theo', 'zoe'];

export const eventFixtures = [
  {
    key: 'night-upcoming',
    name: 'TÉCAP Night — Saint-Brieuc',
    city: 'Saint-Brieuc',
    venue: 'V&B Langueux',
    published: true,
    upcoming: true,
  },
  {
    key: 'night-past',
    name: 'TÉCAP Night — Première édition',
    city: 'Saint-Brieuc',
    venue: 'V&B Langueux',
    published: true,
    upcoming: false,
  },
];

export const messageFixtures = [
  {
    matchKey: 'lea',
    messages: [
      ['alex', 'Salut Léa, ton plan bar à vin me tente bien.'],
      ['lea', 'Bonne intuition, je pensais passer vers 21h30. Tu connais un bon endroit ?'],
      ['alex', 'Le Velvet Bar devrait être calme pour commencer.'],
    ],
  },
  {
    matchKey: 'camille',
    messages: [
      ['alex', 'Tu as finalement trouvé ton programme de ce soir ?'],
      ['camille', 'Pas encore, mais une proposition simple me va très bien.'],
    ],
  },
  {
    matchKey: 'ines',
    messages: [
      ['alex', 'J’ai repéré une bonne adresse près du centre.'],
      ['ines', 'Je suis partante, on se dit 20h30 ?'],
    ],
  },
  {
    matchKey: 'manon',
    messages: [
      ['alex', 'Un verre près de la mer me tente toujours.'],
      ['manon', 'On garde ça pour une soirée avec un peu moins de vent.'],
    ],
  },
  {
    matchKey: 'arthur',
    messages: [
      ['arthur', 'Question décisive : tu triches au pub quiz ?'],
      ['alex', 'Seulement quand la question porte sur les séries.'],
    ],
  },
  {
    matchKey: 'tom',
    messages: [
      ['tom', 'Je termine après 23h, mais je peux encore prendre un cocktail.'],
      ['alex', 'On peut garder cette option ouverte.'],
    ],
  },
  {
    matchKey: 'jade',
    messages: [
      ['alex', 'Un verre ce soir te dirait ?'],
      ['jade', 'Je ne peux pas me libérer ce soir, mais je te souhaite une belle soirée.'],
    ],
  },
  {
    matchKey: 'maxime',
    messages: [
      ['alex', 'On peut se capter autour d’un café ?'],
      ['maxime', 'Je ne peux pas ce soir, mais un café demain en fin d’après-midi ?'],
    ],
  },
  {
    matchKey: 'romane',
    messages: [
      ['alex', 'Tu connais un bon bar intimiste à Lamballe ?'],
      ['romane', 'J’ai deux idées, je te les envoie tout à l’heure.'],
    ],
  },
  {
    matchKey: 'baptiste',
    messages: [
      ['baptiste', 'La projection de ce soir vaut le détour.'],
      ['alex', 'Je note, merci pour la recommandation.'],
    ],
  },
  {
    matchKey: 'yanis',
    messages: [
      ['alex', 'Tu joues où ce soir ?'],
      ['yanis', 'Une petite jam session, ambiance ouverte.'],
    ],
  },
  {
    matchKey: 'paul',
    messages: [
      ['alex', 'Je te laisse choisir le café.'],
      ['paul', 'Parfait, je connais un endroit calme près du centre.'],
    ],
  },
  {
    matchKey: 'adrien',
    messages: [
      ['alex', 'Séance tardive et ramen ensuite ?'],
      ['adrien', 'Ça me semble être un excellent scénario.'],
    ],
  },
  {
    matchKey: 'lucas',
    messages: [
      ['alex', 'Le restaurant asiatique est toujours une valeur sûre.'],
      ['lucas', 'Je valide, surtout si on termine par une balade.'],
    ],
  },
  {
    matchKey: 'enzo',
    messages: [
      ['enzo', 'Tu connais le nouveau set du Club Horizon ?'],
      ['alex', 'Pas encore, mais je suis curieux.'],
    ],
  },
  {
    matchKey: 'romain',
    messages: [
      ['romain', 'Je ramène une recette maison si tu ramènes l’humour.'],
      ['alex', 'Marché conclu.'],
    ],
  },
];

export const requestFixtures = [
  {
    key: 'lea-pending',
    sender: 'alex',
    receiver: 'lea',
    intent: 'verre',
    venue: 'Le Velvet Bar',
    time: 'vers 21 h 30',
    status: 'accepted',
    message: 'Un verre et une bonne conversation pour commencer ?',
    response: 'Bonne intuition, je pensais passer vers 21h30.',
  },
  {
    key: 'jade-declined',
    sender: 'alex',
    receiver: 'jade',
    intent: 'verre',
    venue: 'La Verrière',
    time: 'vers 20 h 30',
    status: 'declined',
    message: 'Un verre ce soir te dirait ?',
    response: 'Je ne peux pas me libérer ce soir, mais je te souhaite une belle soirée.',
  },
  {
    key: 'tom-alternative',
    sender: 'tom',
    receiver: 'alex',
    intent: 'verre',
    venue: 'Le Velvet Bar',
    time: 'après 23 h',
    status: 'alternative',
    message: 'Je peux prendre un cocktail après mon service.',
    response: 'Après 23 h serait plus simple pour moi.',
  },
  {
    key: 'maxime-alternative',
    sender: 'alex',
    receiver: 'maxime',
    intent: 'improviser',
    venue: 'Café-bar TÉCAP',
    time: 'demain en fin d’après-midi',
    status: 'alternative',
    message: 'Un café demain te conviendrait ?',
    response: 'Je ne peux pas ce soir, mais un café demain en fin d’après-midi ?',
  },
  {
    key: 'expired-demo',
    sender: 'alex',
    receiver: 'camille',
    intent: 'verre',
    venue: 'La Verrière',
    time: 'hier soir',
    status: 'expired',
    message: 'Une demande de démonstration expirée.',
    response: null,
  },
  {
    key: 'pending-demo',
    sender: 'alex',
    receiver: 'ines',
    intent: 'verre',
    venue: 'La Verrière',
    time: 'vers 20 h 30',
    status: 'pending',
    message: 'On se capte ce soir autour d’un verre ?',
    response: null,
  },
];

export const notificationFixtures = [
  {
    key: 'match-lea',
    type: 'match',
    title: 'Nouveau match avec Léa',
    body: 'Une nouvelle rencontre commence ce soir.',
    read: true,
    target: 'lea',
  },
  {
    key: 'match-ines',
    type: 'match',
    title: 'Nouveau match avec Inès',
    body: 'Inès et toi vous vous êtes likés.',
    read: true,
    target: 'ines',
  },
  {
    key: 'message-ines',
    type: 'message',
    title: 'Nouveau message d’Inès',
    body: 'Je suis partante, on se dit 20h30 ?',
    read: false,
    target: 'ines',
  },
  {
    key: 'request-lea',
    type: 'catch',
    title: 'Léa a accepté ta demande',
    body: 'Votre proposition de verre est acceptée.',
    read: false,
    target: 'lea',
  },
  {
    key: 'request-jade',
    type: 'catch',
    title: 'Réponse de Jade',
    body: 'Jade ne peut pas se libérer ce soir, mais elle te souhaite une belle soirée.',
    read: false,
    target: 'jade',
  },
  {
    key: 'request-maxime',
    type: 'catch',
    title: 'Proposition de Maxime',
    body: 'Maxime propose un café demain en fin d’après-midi.',
    read: false,
    target: 'maxime',
  },
  {
    key: 'request-tom',
    type: 'catch',
    title: 'Demande reçue de Tom',
    body: 'Tom est disponible après son service.',
    read: false,
    target: 'tom',
  },
  {
    key: 'status-expiring',
    type: 'system',
    title: 'Ton statut expire bientôt',
    body: 'Pense à le modifier si ta soirée continue.',
    read: true,
    target: 'alex',
  },
  {
    key: 'boost-active',
    type: 'system',
    title: 'Boost activé',
    body: 'Ton profil est mis en avant pendant une heure.',
    read: true,
    target: 'alex',
  },
  {
    key: 'likes-limit',
    type: 'system',
    title: 'Limite de likes atteinte',
    body: 'Le compte de test quota peut maintenant voir le paywall.',
    read: true,
    target: 'limit',
  },
];
