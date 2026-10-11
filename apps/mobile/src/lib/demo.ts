import { demoProfiles } from './seedProfiles';

export { demoProfiles } from './seedProfiles';
export type { DemoProfile } from './seedProfiles';

export const demoPhotos = {
  lea: demoProfiles[0]!.photo,
  manon:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
  night:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85',
  friends:
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85',
  alex: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
};

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

export const premiumFeatures = [
  {
    icon: '∞',
    title: 'Likes illimités',
    body: 'Découvre sans limite et multiplie tes opportunités.',
  },
  {
    icon: '◉',
    title: 'Voir qui sort ce soir',
    body: 'Repère les membres actifs et les établissements partagés.',
  },
  {
    icon: '⌖',
    title: 'Filtres avancés',
    body: 'Ville, âge, centres d’intérêt, lieux et ambiance.',
  },
  {
    icon: '♢',
    title: 'Passe en premier',
    body: 'Ton profil remonte dans les suggestions pertinentes.',
  },
];

export const boostFeatures = [
  {
    icon: '↯',
    title: 'Ton profil en avant',
    body: 'Plus visible dans les swipes, les sorties et les lieux partagés.',
  },
  {
    icon: '▮',
    title: 'Plus de vues et de likes',
    body: 'Augmente ta visibilité auprès des membres actifs.',
  },
  {
    icon: '♧',
    title: 'Apparition multi-espaces',
    body: 'Découvrir, Qui sort ce soir ? et les établissements.',
  },
  {
    icon: '◎',
    title: 'Idéal avant une soirée',
    body: 'Active-le avant un verre, un concert ou un week-end.',
  },
];

export const inviteFeatures = [
  {
    icon: '✦',
    title: 'Une invitation unique',
    body: 'Montre que tu as envie d’un vrai coup de cœur.',
  },
  {
    icon: '➤',
    title: 'Ultra efficace',
    body: 'Ta demande arrive en priorité et attire son attention.',
  },
  {
    icon: '♡',
    title: 'Tu montres ton intention',
    body: 'Une manière directe de dire : on se capte ce soir ?',
  },
];
