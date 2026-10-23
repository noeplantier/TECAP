export const background = {
  base: '#050505',
  night: '#090909',
  elevated: '#111111',
  card: '#171717',
  glass: 'rgba(27,27,29,0.96)',
  overlay: 'rgba(0,0,0,0.82)',
} as const;

export const text = {
  primary: '#FFFFFF',
  secondary: 'rgba(255,255,255,0.82)',
  muted: 'rgba(255,255,255,0.58)',
} as const;

/** TÉCAP uses pink for action and gold only for Premium and the shop. */
export const brand = {
  pink: '#F81795',
  hotPink: '#F81795',
  pinkElectric: '#F81795',
  pinkLight: '#F81795',
  magenta: '#F81795',
  magentaDeep: '#F81795',
  gold: '#FED176',
  goldHot: '#FED176',
  goldLight: '#FED176',
  goldWhite: '#FED176',
  goldDeep: '#FED176',
  violetDeep: '#5B3A78',
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
  pinkSoft: 'rgba(248,23,149,0.22)',
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
  goldSoft: 'rgba(254,209,118,0.24)',
  violetDeep: brand.violetDeep,
  ivory: '#FFFFFF',
  ivoryText: '#050505',
  green: status.success,
  danger: status.danger,
  line: 'rgba(255,255,255,0.16)',
  lineBright: 'rgba(255,255,255,0.20)',
  overlay: background.overlay,
  pinkWash: 'rgba(248,23,149,0.08)',
  pinkGlow: 'rgba(248,23,149,0.16)',
  goldWash: 'rgba(254,209,118,0.07)',
  goldGlow: 'rgba(254,209,118,0.14)',
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
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  gold: {
    shadowColor: brand.gold,
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;

export const gradients = {
  primaryCta: ['rgba(248,23,149,0.94)', brand.pink, brand.pink],
  premiumCta: ['rgba(254,209,118,0.94)', brand.gold, brand.gold],
  matchHalo: ['rgba(248,23,149,0.30)', 'rgba(248,23,149,0.10)', background.base],
  cardOverlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.88)'],
} as const;
