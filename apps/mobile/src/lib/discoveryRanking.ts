import type { DemoProfile } from './seedProfiles';

type DiscoveryContext = {
  city?: string;
  activityType?: string;
};

const activityKeywords: Record<string, string[]> = {
  bar: ['bar', 'verre', 'cocktail', 'vin', 'apéro', 'pub', 'terrasse'],
  club: ['club', 'dj', 'techno', 'house', 'électro', 'after'],
  concert: ['concert', 'live', 'musique', 'rock', 'jazz', 'guitare', 'festival'],
  restaurant: ['dîner', 'restaurant', 'food', 'pasta', 'ramen', 'repas', 'brunch'],
  match: ['match', 'foot', 'basket', 'sport', 'stade'],
  plage: ['plage', 'mer', 'surf', 'balade'],
  chill: ['chill', 'calme', 'cinéma', 'lecture', 'balade'],
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR');
}

function distanceInKilometers(distance: string) {
  const value = Number.parseFloat(distance.replace(',', '.'));
  if (!Number.isFinite(value)) return undefined;
  return /m\s*$/i.test(distance.trim()) ? value / 1000 : value;
}

function activityMatches(profile: DemoProfile, activityType?: string) {
  if (!activityType) return false;
  const keywords = activityKeywords[normalize(activityType)];
  if (!keywords) return false;
  const candidateText = normalize(
    [profile.status, profile.venue, ...profile.interests, ...profile.tags]
      .filter(Boolean)
      .join(' '),
  );
  return keywords.some((keyword) => candidateText.includes(normalize(keyword)));
}

export function discoveryScore(profile: DemoProfile, context: DiscoveryContext = {}) {
  let score = 0;
  if (context.city && normalize(profile.city) === normalize(context.city)) score += 60;
  if (profile.status) score += 36;
  if (profile.venue) score += 12;
  if (activityMatches(profile, context.activityType)) score += 24;

  const kilometers = distanceInKilometers(profile.distance);
  if (kilometers !== undefined) score += Math.max(0, 24 - kilometers * 2);
  return score;
}

export function rankDiscoveryProfiles(profiles: DemoProfile[], context: DiscoveryContext = {}) {
  return profiles
    .map((profile, originalIndex) => ({
      profile,
      originalIndex,
      score: discoveryScore(profile, context),
    }))
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
    .map(({ profile }) => profile);
}
