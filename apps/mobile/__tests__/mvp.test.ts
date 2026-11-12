import { demoProfiles } from '../src/lib/demo';
import { goToDiscover } from '../src/navigation/routes';
import { FREE_LIKE_LIMIT, useAppStore } from '../src/state/useAppStore';
import { simulatedSaintBrieucLocation } from '../src/lib/geolocation';
import { demoPortraitsByGender } from '../src/lib/seedProfiles';
import { rankDiscoveryProfiles } from '../src/lib/discoveryRanking';
import { TECAP_TAB_ORDER } from '../src/navigation/tabConfig';
import { brand, colors } from '../src/theme';

describe('TECAP local MVP', () => {
  beforeEach(() => useAppStore.getState().resetDemo());

  it('exposes exactly the five requested tabs in their required order', () => {
    expect(TECAP_TAB_ORDER).toEqual([
      { name: 'DiscoverTab', label: 'Découvrir' },
      { name: 'OutingsTab', label: 'Sorties' },
      { name: 'MessagesTab', label: 'Messages' },
      { name: 'ProfileTab', label: 'Profil' },
      { name: 'ShopTab', label: 'Boutique' },
    ]);
    expect(TECAP_TAB_ORDER).toHaveLength(5);
  });

  it('uses the exact TÉCAP pink and gold brand colors', () => {
    expect(brand.pink).toBe('#F81795');
    expect(brand.gold).toBe('#FED176');
    expect(colors.pink).toBe(brand.pink);
    expect(colors.gold).toBe(brand.gold);
  });

  it('contains 30 adult demo profiles with match scenarios', () => {
    expect(demoProfiles).toHaveLength(30);
    expect(demoProfiles.every((profile) => profile.age >= 18)).toBe(true);
    expect(demoProfiles.filter((profile) => profile.willMatchOnLike).length).toBeGreaterThan(5);
  });

  it('assigns female and male demo profiles portraits from the matching photo sets', () => {
    const femalePortraits = new Set<string>(demoPortraitsByGender.femme);
    const malePortraits = new Set<string>(demoPortraitsByGender.homme);

    expect(
      demoProfiles
        .filter((profile) => profile.gender === 'femme')
        .every((profile) => femalePortraits.has(profile.photo)),
    ).toBe(true);
    expect(
      demoProfiles
        .filter((profile) => profile.gender === 'homme')
        .every((profile) => malePortraits.has(profile.photo)),
    ).toBe(true);
    expect(demoProfiles.find((profile) => profile.id === 'paul')?.gender).toBe('homme');
  });

  it('ranks profiles by chosen city and compatible active-evening vibe', () => {
    const lea = demoProfiles.find((profile) => profile.id === 'lea')!;
    const mathis = demoProfiles.find((profile) => profile.id === 'mathis')!;
    const ranked = rankDiscoveryProfiles(
      [
        { ...mathis, city: 'Lamballe', distance: '1 km', status: 'Concert puis bar' },
        { ...lea, distance: '3 km' },
      ],
      { city: 'Saint-Brieuc', activityType: 'bar' },
    );

    expect(ranked.map((profile) => profile.id)).toEqual(['lea', 'mathis']);
  });

  it('enforces 25 free likes in a rolling 24-hour window', () => {
    for (let index = 0; index < FREE_LIKE_LIMIT; index += 1) {
      expect(useAppStore.getState().likeProfile(`profile-${index}`, false).allowed).toBe(true);
    }
    expect(useAppStore.getState().likesRemaining()).toBe(0);
    expect(useAppStore.getState().likeProfile('profile-26', false).allowed).toBe(false);
  });

  it('builds an explicit nested route to the Discover tab', () => {
    const calls: Array<[string, unknown]> = [];
    goToDiscover({ navigate: (name, params) => calls.push([name, params]) });
    expect(calls).toEqual([
      ['MainTabs', { screen: 'DiscoverTab', params: { screen: 'DiscoverHome' } }],
    ]);
  });

  it('keeps the development location approximate and user-controlled', () => {
    const simulated = simulatedSaintBrieucLocation();
    expect(simulated.accuracyM).toBeGreaterThanOrEqual(1000);
    useAppStore.getState().setLocationConsent('granted');
    useAppStore.getState().setApproximateLocation({ ...simulated, updatedAt: Date.now() });
    expect(useAppStore.getState().locationConsent).toBe('granted');
    expect(useAppStore.getState().approximateLocation?.accuracyM).toBeGreaterThanOrEqual(1000);
  });
});
