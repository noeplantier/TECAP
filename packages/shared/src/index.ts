export const EVENING_STATUS_TYPES = [
  'bar',
  'club',
  'restaurant',
  'concert',
  'match',
  'beach',
  'chill',
  'other',
] as const;

export type EveningStatusType = (typeof EVENING_STATUS_TYPES)[number];
export type UserRole = 'user' | 'admin' | 'partner' | 'staff';
export type LeadStatus =
  'PREINSCRIT' | 'COMPTE_CRÉÉ' | 'INSCRIT TÉCAP NIGHT' | 'PASS GÉNÉRÉ' | 'PASS UTILISÉ';
export type BraceletChoice = 'I OPEN' | 'I ON VERRA' | 'I EN COUPLE' | 'I PAS DE BRACELET';

export type Profile = {
  id: string;
  firstName: string;
  city: string;
  birthDate: string;
  bio: string;
  avatarUrl?: string;
  role: UserRole;
};

export type EveningStatus = {
  id: string;
  userId: string;
  city: string;
  type: EveningStatusType;
  venue?: string;
  expiresAt: string;
};

export type TecapEvent = {
  id: string;
  name: string;
  city: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  attendeeCount: number;
  coverUrl?: string;
};

export type PassState = 'generated' | 'used' | 'invalid';

export const statusLabel: Record<EveningStatusType, string> = {
  bar: 'Bar',
  club: 'Boîte',
  restaurant: 'Resto',
  concert: 'Concert',
  match: 'Match',
  beach: 'Plage',
  chill: 'Chill',
  other: 'Autre',
};

export const formatAttendeeCount = (count: number) => `${count} participant${count > 1 ? 's' : ''}`;

export const isAdult = (birthDate: string, now = new Date()) => {
  const birth = new Date(birthDate);
  const adultDate = new Date(now);
  adultDate.setFullYear(adultDate.getFullYear() - 18);
  return birth <= adultDate;
};
