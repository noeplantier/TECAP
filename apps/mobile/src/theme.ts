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
  overlay: 'rgba(5,5,11,.72)',
  pinkWash: 'rgba(255,46,173,.12)',
  goldWash: 'rgba(255,211,106,.11)',
};

export const spacing = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, xxl: 36 };
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };
export const typography = {
  display: { fontSize: 32, lineHeight: 36, fontWeight: '900' as const },
  title: { fontSize: 20, lineHeight: 24, fontWeight: '800' as const },
  body: { fontSize: 13, lineHeight: 19 },
  caption: { fontSize: 10, lineHeight: 14 },
};

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
