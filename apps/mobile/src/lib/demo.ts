export const demoPhotos = {
  lea: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
  manon:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
  night:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85',
  friends:
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85',
};

export const demoProfiles = [
  {
    id: 'lea',
    name: 'Léa',
    age: 24,
    city: 'Rennes',
    distance: '1 km',
    status: 'Sort ce soir — bar 🍸',
    venue: 'Centre · zone 1 km',
    bio: 'Un verre, un bon son, et on voit ?',
    photo: demoPhotos.lea,
    tags: ['Musique live', 'Voyages', 'Terrasses'],
  },
  {
    id: 'lucas',
    name: 'Lucas',
    age: 25,
    city: 'Rennes',
    distance: '2 km',
    status: 'Sort ce soir — bar 🍸',
    venue: 'Centre · zone 2 km',
    bio: 'Partant pour une terrasse et une bonne playlist.',
    photo: demoPhotos.friends,
    tags: ['Terrasses', 'Concerts'],
  },
];

export const demoMessages = [
  { id: '1', side: 'left' as const, text: 'Hey ! T’as prévu quoi ce soir ? 👀', time: '21:33' },
  {
    id: '2',
    side: 'right' as const,
    text: 'Un verre dans le centre avec des potes. Et toi ?',
    time: '21:34 · Lu',
  },
  {
    id: '3',
    side: 'left' as const,
    text: 'Aux Servan·es ? On se capte pour un verre ?',
    time: '21:35',
  },
  { id: '4', side: 'right' as const, text: 'Carrément, vers 22h ?', time: '21:36 · Envoyé' },
];

export const demoVenues = [
  { name: 'L’Apsara', count: 12, type: 'bar', emoji: '🍸' },
  { name: 'Le Tire-Bouchon', count: 8, type: 'bar', emoji: '🍷' },
  { name: 'Rue de la Soif', count: 18, type: 'quartier animé', emoji: '✨' },
];
