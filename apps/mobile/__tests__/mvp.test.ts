import { demoProfiles } from '../src/lib/demo';
import { goToDiscover } from '../src/navigation/routes';
import { FREE_LIKE_LIMIT, useAppStore } from '../src/state/useAppStore';

describe('TECAP local MVP', () => {
  beforeEach(() => useAppStore.getState().resetDemo());

  it('contains 30 adult demo profiles with match scenarios', () => {
    expect(demoProfiles).toHaveLength(30);
    expect(demoProfiles.every((profile) => profile.age >= 18)).toBe(true);
    expect(demoProfiles.filter((profile) => profile.willMatchOnLike).length).toBeGreaterThan(5);
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
});
