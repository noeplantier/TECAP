import { categoryLabels, demoPois } from '../src/lib/mapData';

describe('TÉCAP map data', () => {
  it('contains the wireframe venue categories and an anonymized hotspot layer', () => {
    expect(demoPois).toHaveLength(7);
    expect(demoPois.map((poi) => poi.category)).toEqual(
      expect.arrayContaining(['bar', 'restaurant', 'club', 'concert', 'tecap_event', 'hotspot']),
    );
    expect(demoPois.filter((poi) => poi.category === 'hotspot')).toHaveLength(2);
    expect(demoPois.every((poi) => poi.citySlug === 'saint-brieuc')).toBe(true);
  });

  it('keeps every map category label explicit for filter UI', () => {
    expect(categoryLabels.tecap_event).toBe('TÉCAP Night');
    expect(categoryLabels.hotspot).toBe('Ce soir');
  });
});
