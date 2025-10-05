import {describe, it, expect} from 'vitest';

import {
  formatDate,
  formatDateTime,
  formatDateString,
  formatDateToWeekday,
  formatDateToDayAndMonth,
  formatDateWithWeekday,
} from '../formatDate';

describe('formatDate', () => {
  it('should format date in Czech locale', () => {
    const date = new Date('2024-03-15T10:30:00');
    const result = formatDate(date);
    expect(result).toMatch(/15\.\s*03\.\s*2024/);
  });

  it('should handle different dates correctly', () => {
    const date = new Date('2023-12-25T00:00:00');
    const result = formatDate(date);
    expect(result).toMatch(/25\.\s*12\.\s*2023/);
  });
});

describe('formatDateTime', () => {
  it('should format date and time in Czech locale', () => {
    const date = new Date('2024-03-15T14:30:00');
    const result = formatDateTime(date);
    expect(result).toMatch(/15\.\s*03\.\s*2024.*14:30/);
  });
});

describe('formatDateString', () => {
  it('should format valid date string', () => {
    const result = formatDateString('2024-03-15');
    expect(result).toMatch(/15\.\s*03\.\s*2024/);
  });

  it('should return original string for invalid date', () => {
    const invalidDate = 'not-a-date';
    const result = formatDateString(invalidDate);
    expect(result).toBe(invalidDate);
  });

  it('should handle empty string', () => {
    const result = formatDateString('');
    expect(result).toBe('');
  });
});

describe('formatDateToWeekday', () => {
  it('should format date to weekday in Czech', () => {
    // March 15, 2024 is a Friday
    const result = formatDateToWeekday('2024-03-15');
    expect(result.toLowerCase()).toContain('pátek');
  });

  it('should return original string for invalid date', () => {
    const invalidDate = 'invalid';
    const result = formatDateToWeekday(invalidDate);
    expect(result).toBe(invalidDate);
  });
});

describe('formatDateToDayAndMonth', () => {
  it('should format date to day and month', () => {
    const result = formatDateToDayAndMonth('2024-03-15');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/3/);
  });

  it('should return original string for invalid date', () => {
    const invalidDate = 'invalid';
    const result = formatDateToDayAndMonth(invalidDate);
    expect(result).toBe(invalidDate);
  });
});

describe('formatDateWithWeekday', () => {
  it('should format date with full weekday and date', () => {
    const result = formatDateWithWeekday('2024-03-15');
    expect(result.toLowerCase()).toContain('pátek');
    expect(result).toMatch(/15/);
    expect(result.toLowerCase()).toContain('břez');
    expect(result).toContain('2024');
  });

  it('should return original string for invalid date', () => {
    const invalidDate = 'invalid';
    const result = formatDateWithWeekday(invalidDate);
    expect(result).toBe(invalidDate);
  });
});
