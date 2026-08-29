import {describe, it, expect} from 'vitest';

import {normalizeMatchTime} from '../normalizeTime';

describe('normalizeMatchTime', () => {
  it('should return HH:MM from full time string', () => {
    expect(normalizeMatchTime('15:30:00')).toBe('15:30');
  });

  it('should pass through HH:MM unchanged', () => {
    expect(normalizeMatchTime('09:00')).toBe('09:00');
  });

  it('should default to 00:00 for undefined', () => {
    expect(normalizeMatchTime(undefined)).toBe('00:00');
  });

  it('should default to 00:00 for null', () => {
    expect(normalizeMatchTime(null)).toBe('00:00');
  });

  it('should default to 00:00 for empty string', () => {
    expect(normalizeMatchTime('')).toBe('00:00');
  });

  it('should handle hours-only input', () => {
    expect(normalizeMatchTime('14')).toBe('14:00');
  });
});
