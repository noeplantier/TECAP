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

export function navigateToTab(navigation: NavigationProp, tab: string, screen?: string) {
  navigation.navigate('MainTabs', {
    screen: tab,
    ...(screen ? { params: { screen } } : {}),
  });
}

export function goToDiscover(navigation: NavigationProp, screen = 'DiscoverHome') {
  navigateToTab(navigation, TAB_ROUTES.discover, screen);
}

export function goToOutings(navigation: NavigationProp, screen = 'OutingsHome') {
  navigateToTab(navigation, TAB_ROUTES.outings, screen);
}

export function goToMessages(navigation: NavigationProp, screen = 'MessagesHome') {
  navigateToTab(navigation, TAB_ROUTES.messages, screen);
}

export function goToShop(navigation: NavigationProp, screen = 'ShopHome') {
  navigateToTab(navigation, TAB_ROUTES.shop, screen);
}
