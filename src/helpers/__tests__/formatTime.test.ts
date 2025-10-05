import {describe, it, expect} from 'vitest';

import {formatTime} from '../formatTime';

describe('formatTime', () => {
  it('should format HH:MM:SS to HH:MM', () => {
    expect(formatTime('14:30:00')).toBe('14:30');
    expect(formatTime('09:15:45')).toBe('09:15');
    expect(formatTime('23:59:59')).toBe('23:59');
  });

  it('should return HH:MM format as is', () => {
    expect(formatTime('14:30')).toBe('14:30');
    expect(formatTime('09:15')).toBe('09:15');
  });

  it('should return empty string for empty input', () => {
    expect(formatTime('')).toBe('');
  });

  it('should return original string for invalid format', () => {
    expect(formatTime('invalid')).toBe('invalid');
    expect(formatTime('14:30:00:00')).toBe('14:30:00:00');
    expect(formatTime('14')).toBe('14');
  });
});
