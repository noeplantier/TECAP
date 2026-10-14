export const background = {
  base: '#050505',
  night: '#090909',
  elevated: '#111111',
  card: '#171717',
  glass: 'rgba(17,17,17,0.90)',
  overlay: 'rgba(0,0,0,0.82)',
} as const;

export const text = {
  primary: '#FFFFFF',
  secondary: 'rgba(255,255,255,0.82)',
  muted: 'rgba(255,255,255,0.58)',
} as const;

/** TÉCAP chromatic identity: one exact pink and one exact gold. */
export const brand = {
  pink: '#F81795',
  hotPink: '#F81795',
  pinkElectric: '#F81795',
  pinkLight: '#F81795',
  magenta: '#F81795',
  magentaDeep: '#F81795',
  gold: '#FFD700',
  goldHot: '#FFD700',
  goldLight: '#FFD700',
  goldWhite: '#FFD700',
  goldDeep: '#FFD700',
} as const;

export const status = {
  success: '#70D7A4',
  danger: '#FF547F',
} as const;

/** Legacy aliases keep existing screens source-compatible using only brand tokens and neutral tints. */
export const colors = {
  canvas: background.base,
  surface: background.elevated,
  surfaceStrong: background.card,
  surfaceSoft: '#202020',
  text: text.primary,
  muted: text.muted,
  mutedStrong: text.secondary,
  pink: brand.pink,
  pinkSoft: 'rgba(248,23,149,0.55)',
  pinkElectric: brand.pink,
  pinkLight: brand.pink,
  magenta: brand.pink,
  magentaDeep: brand.pink,
  hotPink: brand.pink,
  gold: brand.gold,
  goldHot: brand.gold,
  goldLight: brand.gold,
  goldWhite: brand.gold,
  goldDeep: brand.gold,
  goldSoft: 'rgba(255,215,0,0.55)',
  ivory: '#FFFFFF',
  ivoryText: '#050505',
  green: status.success,
  danger: status.danger,
  line: 'rgba(255,255,255,0.16)',
  lineBright: 'rgba(248,23,149,0.72)',
  overlay: background.overlay,
  pinkWash: 'rgba(248,23,149,0.12)',
  pinkGlow: 'rgba(248,23,149,0.42)',
  goldWash: 'rgba(255,215,0,0.10)',
  goldGlow: 'rgba(255,215,0,0.36)',
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
    shadowOpacity: 0.68,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  gold: {
    shadowColor: brand.gold,
    shadowOpacity: 0.56,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
} as const;

export const gradients = {
  primaryCta: ['rgba(248,23,149,0.78)', brand.pink, brand.pink],
  premiumCta: ['rgba(255,215,0,0.78)', brand.gold, brand.gold],
  matchHalo: ['rgba(248,23,149,0.72)', 'rgba(248,23,149,0.24)', background.base],
  cardOverlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.88)'],
} as const;
