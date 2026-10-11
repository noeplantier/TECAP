export const background = {
  base: '#07050B',
  elevated: '#101016',
  card: '#13121A',
  overlay: 'rgba(7,5,11,0.76)',
} as const;

export const text = {
  primary: '#FFF9FC',
  secondary: '#E5DDE5',
  muted: '#AAA2AE',
} as const;

export const brand = {
  pink: '#FF2BAA',
  hotPink: '#FF46C8',
  magenta: '#D900B8',
  gold: '#F6BD4B',
  goldLight: '#FFD978',
} as const;

export const status = {
  success: '#70D7A4',
  danger: '#E84A72',
} as const;

/** Legacy aliases keep existing screens source-compatible while using the central tokens above. */
export const colors = {
  canvas: background.base,
  surface: background.elevated,
  surfaceStrong: background.card,
  surfaceSoft: '#2A101F',
  text: text.primary,
  muted: text.muted,
  mutedStrong: text.secondary,
  pink: brand.pink,
  pinkSoft: '#951968',
  magenta: brand.magenta,
  hotPink: brand.hotPink,
  gold: brand.gold,
  goldLight: brand.goldLight,
  goldSoft: '#9A6A24',
  ivory: brand.goldLight,
  ivoryText: '#24150A',
  green: status.success,
  danger: status.danger,
  line: '#3A182D',
  lineBright: brand.hotPink,
  overlay: background.overlay,
  pinkWash: 'rgba(255,43,170,0.12)',
  goldWash: 'rgba(246,189,75,0.12)',
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
    shadowColor: brand.pink,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  gold: {
    shadowColor: brand.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
};
