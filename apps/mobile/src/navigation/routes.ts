export type NavigationProp = {
  navigate: (name: string, params?: unknown) => void;
  goBack?: () => void;
};

export const TAB_ROUTES = {
  discover: 'DiscoverTab',
  outings: 'OutingsTab',
  messages: 'MessagesTab',
  profile: 'ProfileTab',
  shop: 'ShopTab',
} as const;

export function navigateToTab(
  navigation: NavigationProp,
  tab: string,
  screen?: string,
  params?: Record<string, unknown>,
) {
  navigation.navigate('MainTabs', {
    screen: tab,
    ...(screen ? { params: { screen, ...(params ? { params } : {}) } } : {}),
  });
}

export function goToDiscover(
  navigation: NavigationProp,
  screen = 'DiscoverHome',
  params?: Record<string, unknown>,
) {
  navigateToTab(navigation, TAB_ROUTES.discover, screen, params);
}

export function goToOutings(
  navigation: NavigationProp,
  screen = 'OutingsHome',
  params?: Record<string, unknown>,
) {
  navigateToTab(navigation, TAB_ROUTES.outings, screen, params);
}

export function goToMessages(
  navigation: NavigationProp,
  screen = 'MessagesHome',
  params?: Record<string, unknown>,
) {
  navigateToTab(navigation, TAB_ROUTES.messages, screen, params);
}

export function goToShop(
  navigation: NavigationProp,
  screen = 'ShopHome',
  params?: Record<string, unknown>,
) {
  navigateToTab(navigation, TAB_ROUTES.shop, screen, params);
}
