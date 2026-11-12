export const TECAP_TAB_ORDER = [
  { name: 'DiscoverTab', label: 'Découvrir' },
  { name: 'OutingsTab', label: 'Sorties' },
  { name: 'MessagesTab', label: 'Messages' },
  { name: 'ProfileTab', label: 'Profil' },
  { name: 'ShopTab', label: 'Boutique' },
] as const;

export type TecapTabName = (typeof TECAP_TAB_ORDER)[number]['name'];
