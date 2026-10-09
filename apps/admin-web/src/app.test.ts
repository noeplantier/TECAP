import { describe, expect, it } from 'vitest';
import { formatAttendeeCount, statusLabel } from '@tecap/shared';

describe('admin dashboard domain wiring', () => {
  it('exposes the shared French labels used by the dashboard', () => {
    expect(statusLabel.concert).toBe('Concert');
    expect(formatAttendeeCount(128)).toBe('128 participants');
  });
});
