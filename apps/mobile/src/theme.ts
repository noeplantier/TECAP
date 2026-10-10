export const colors = {
  canvas: '#05050B',
  surface: '#0D0C17',
  surfaceStrong: '#171329',
  surfaceSoft: '#24183C',
  text: '#FBF9FF',
  muted: '#A8A3B7',
  mutedStrong: '#E4DFEA',
  violet: '#B620FF',
  violetSoft: '#7424A5',
  pink: '#FF2EAD',
  pinkSoft: '#A91C73',
  gold: '#FFD36A',
  goldSoft: '#9E6D24',
  ivory: '#FFE08A',
  ivoryText: '#24150A',
  green: '#70D7A4',
  danger: '#F28A9F',
  line: '#3B294B',
  lineBright: '#FF5CC4',
};

export const spacing = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, xxl: 36 };
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

export const glow = {
  pink: {
    shadowColor: colors.pink,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  gold: {
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
};
