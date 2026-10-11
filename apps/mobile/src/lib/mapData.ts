export type PoiCategory =
  'tecap_event' | 'bar' | 'restaurant' | 'club' | 'concert' | 'hotspot' | 'user_plan';

export type TecapPoi = {
  id: string;
  category: PoiCategory;
  name: string;
  subtitle: string;
  description: string;
  latitude: number;
  longitude: number;
  city: string;
  citySlug: string;
  participantCount: number;
  accent: 'pink' | 'gold' | 'magenta';
  icon: string;
  isPremium?: boolean;
  startsAt?: string;
  action: 'event' | 'outings' | 'invite' | 'profile';
};

export const SAINT_BRIEUC_CENTER = { latitude: 48.5142, longitude: -2.7658 } as const;

/** Coordonnées publiques approximatives, uniquement pour la démonstration de zones sociales. */
export const demoPois: TecapPoi[] = [
  {
    id: 'poi-velvet-bar',
    category: 'bar',
    name: 'Le Velvet Bar',
    subtitle: 'Bar · 7 plans partagés',
    description: 'Un point de rendez-vous démo pour partager un verre ce soir.',
    latitude: 48.5134,
    longitude: -2.7681,
    city: 'Saint-Brieuc',
    citySlug: 'saint-brieuc',
    participantCount: 7,
    accent: 'pink',
    icon: '🍸',
    action: 'outings',
  },
  {
    id: 'poi-verriere',
    category: 'restaurant',
    name: 'La Verrière',
    subtitle: 'Restaurant · 4 plans partagés',
    description: 'Adresse de démonstration pour dîner et prolonger la soirée.',
    latitude: 48.5119,
    longitude: -2.7645,
    city: 'Saint-Brieuc',
    citySlug: 'saint-brieuc',
    participantCount: 4,
    accent: 'pink',
    icon: '🍽',
    action: 'outings',
  },
  {
    id: 'poi-horizon',
    category: 'club',
    name: 'Club Horizon',
    subtitle: 'Club · 11 personnes ce soir',
    description: 'Hotspot nocturne démo avec ambiance club et DJ set.',
    latitude: 48.5181,
    longitude: -2.7594,
    city: 'Saint-Brieuc',
    citySlug: 'saint-brieuc',
    participantCount: 11,
    accent: 'magenta',
    icon: '✦',
    isPremium: true,
    action: 'outings',
  },
  {
    id: 'poi-concert-centre',
    category: 'concert',
    name: 'Concert en ville',
    subtitle: 'Concert · 8 personnes intéressées',
    description: 'Événement de démonstration en centre-ville.',
    latitude: 48.5163,
    longitude: -2.7627,
    city: 'Saint-Brieuc',
    citySlug: 'saint-brieuc',
    participantCount: 8,
    accent: 'pink',
    icon: '♫',
    action: 'event',
  },
  {
    id: 'poi-tecap-night',
    category: 'tecap_event',
    name: 'TÉCAP Night',
    subtitle: 'Événement TÉCAP · 26 participants',
    description: 'Événement de démonstration TÉCAP Night à Saint-Brieuc.',
    latitude: 48.5152,
    longitude: -2.7697,
    city: 'Saint-Brieuc',
    citySlug: 'saint-brieuc',
    participantCount: 26,
    accent: 'gold',
    icon: '♛',
    isPremium: true,
    startsAt: 'Ce soir · 21:00',
    action: 'event',
  },
  {
    id: 'poi-hotspot-centre',
    category: 'hotspot',
    name: 'Hotspot centre-ville',
    subtitle: '7 partants pour un verre',
    description: 'Zone agrégée : aucune position individuelle n’est affichée.',
    latitude: 48.5148,
    longitude: -2.7652,
    city: 'Saint-Brieuc',
    citySlug: 'saint-brieuc',
    participantCount: 7,
    accent: 'pink',
    icon: '◎',
    action: 'outings',
  },
  {
    id: 'poi-hotspot-night',
    category: 'hotspot',
    name: 'Hotspot nocturne',
    subtitle: '11 personnes en soirée',
    description: 'Zone agrégée autour d’une ambiance club / DJ set.',
    latitude: 48.5176,
    longitude: -2.7608,
    city: 'Saint-Brieuc',
    citySlug: 'saint-brieuc',
    participantCount: 11,
    accent: 'magenta',
    icon: '✧',
    action: 'outings',
  },
];

export const categoryLabels: Record<'all' | PoiCategory, string> = {
  all: 'Tout',
  tecap_event: 'TÉCAP Night',
  bar: 'Bars',
  restaurant: 'Restaurants',
  club: 'Clubs',
  concert: 'Concerts',
  hotspot: 'Ce soir',
  user_plan: 'Plans',
};
