import { formatAttendeeCount, isAdult } from '@tecap/shared';

describe('shared domain rules', () => {
  it('accepts an adult and rejects a minor', () => {
    const now = new Date('2026-10-09T00:00:00.000Z');
    expect(isAdult('2000-01-01', now)).toBe(true);
    expect(isAdult('2010-01-01', now)).toBe(false);
  });

  it('formats attendees in French', () => {
    expect(formatAttendeeCount(1)).toBe('1 participant');
    expect(formatAttendeeCount(128)).toBe('128 participants');
  });
});
