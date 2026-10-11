export const background = {
  base: '#050308',
  elevated: '#0D0812',
  card: '#160C1B',
  overlay: 'rgba(5,3,8,0.82)',
} as const;

export const text = {
  primary: '#FFF9FE',
  secondary: '#F5EAF4',
  muted: '#B7A9B7',
} as const;

export const brand = {
  pink: '#FF25B8',
  hotPink: '#FF5AD1',
  pinkElectric: '#FF0FAF',
  pinkLight: '#FF9CE4',
  magenta: '#E000AA',
  magentaDeep: '#9D0879',
  gold: '#FFC84D',
  goldHot: '#FFD76A',
  goldLight: '#FFE7A3',
  goldWhite: '#FFF3C7',
} as const;

export const status = {
  success: '#70D7A4',
  danger: '#FF547F',
} as const;

/** Legacy aliases keep existing screens source-compatible while using the central tokens above. */
export const colors = {
  canvas: background.base,
  surface: background.elevated,
  surfaceStrong: background.card,
  surfaceSoft: '#35102C',
  text: text.primary,
  muted: text.muted,
  mutedStrong: text.secondary,
  pink: brand.pink,
  pinkSoft: '#D91B91',
  pinkElectric: brand.pinkElectric,
  pinkLight: brand.pinkLight,
  magenta: brand.magenta,
  magentaDeep: brand.magentaDeep,
  hotPink: brand.hotPink,
  gold: brand.gold,
  goldHot: brand.goldHot,
  goldLight: brand.goldLight,
  goldWhite: brand.goldWhite,
  goldSoft: '#AD7420',
  ivory: brand.goldLight,
  ivoryText: '#261405',
  green: status.success,
  danger: status.danger,
  line: '#572044',
  lineBright: brand.hotPink,
  overlay: background.overlay,
  pinkWash: 'rgba(255,37,184,0.20)',
  pinkGlow: 'rgba(255,37,184,0.34)',
  goldWash: 'rgba(255,200,77,0.18)',
  goldGlow: 'rgba(255,200,77,0.28)',
} as const;

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
    shadowColor: brand.pinkElectric,
    shadowOpacity: 0.78,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  gold: {
    shadowColor: brand.goldHot,
    shadowOpacity: 0.62,
    shadowRadius: 23,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
} as const;
