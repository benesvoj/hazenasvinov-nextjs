import {describe, it, expect} from 'vitest';

import {WEEKDAY_MAP, generateSessionDates} from '../dateRangeGenerator';

describe('WEEKDAY_MAP', () => {
  it('should map all 7 days to correct Date.getDay() values', () => {
    expect(WEEKDAY_MAP.monday).toBe(1);
    expect(WEEKDAY_MAP.tuesday).toBe(2);
    expect(WEEKDAY_MAP.wednesday).toBe(3);
    expect(WEEKDAY_MAP.thursday).toBe(4);
    expect(WEEKDAY_MAP.friday).toBe(5);
    expect(WEEKDAY_MAP.saturday).toBe(6);
    expect(WEEKDAY_MAP.sunday).toBe(0);
  });

  it('should have exactly 7 entries', () => {
    expect(Object.keys(WEEKDAY_MAP)).toHaveLength(7);
  });
});

describe('generateSessionDates', () => {
  it('should return dates matching selected weekdays within range', () => {
    // 2024-03-04 is Monday, 2024-03-10 is Sunday — full week
    const start = new Date('2024-03-04');
    const end = new Date('2024-03-10');

    const result = generateSessionDates(start, end, ['monday', 'wednesday', 'friday']);

    expect(result).toEqual(['2024-03-04', '2024-03-06', '2024-03-08']);
  });

  it('should return empty array when no days are selected', () => {
    const start = new Date('2024-03-04');
    const end = new Date('2024-03-10');

    const result = generateSessionDates(start, end, []);

    expect(result).toEqual([]);
  });

  it('should return empty array when range is empty (start > end)', () => {
    const start = new Date('2024-03-10');
    const end = new Date('2024-03-04');

    const result = generateSessionDates(start, end, ['monday']);

    expect(result).toEqual([]);
  });

  it('should include start date if it matches selected day', () => {
    // 2024-03-04 is Monday
    const start = new Date('2024-03-04');
    const end = new Date('2024-03-04');

    const result = generateSessionDates(start, end, ['monday']);

    expect(result).toEqual(['2024-03-04']);
  });

  it('should include end date if it matches selected day', () => {
    // 2024-03-10 is Sunday
    const start = new Date('2024-03-10');
    const end = new Date('2024-03-10');

    const result = generateSessionDates(start, end, ['sunday']);

    expect(result).toEqual(['2024-03-10']);
  });

  it('should handle multi-week ranges correctly', () => {
    // 2024-03-04 (Mon) to 2024-03-17 (Sun) — 2 full weeks
    const start = new Date('2024-03-04');
    const end = new Date('2024-03-17');

    const result = generateSessionDates(start, end, ['tuesday']);

    expect(result).toEqual(['2024-03-05', '2024-03-12']);
  });

  it('should handle all days selected', () => {
    const start = new Date('2024-03-04');
    const end = new Date('2024-03-06');
    const allDays = Object.keys(WEEKDAY_MAP);

    const result = generateSessionDates(start, end, allDays);

    expect(result).toEqual(['2024-03-04', '2024-03-05', '2024-03-06']);
  });

  it('should return empty array when selected day does not fall in range', () => {
    // 2024-03-04 (Mon) to 2024-03-05 (Tue) — no Saturday in range
    const start = new Date('2024-03-04');
    const end = new Date('2024-03-05');

    const result = generateSessionDates(start, end, ['saturday']);

    expect(result).toEqual([]);
  });

  it('should not mutate the input start date', () => {
    const start = new Date('2024-03-04');
    const originalTime = start.getTime();
    const end = new Date('2024-03-10');

    generateSessionDates(start, end, ['monday']);

    expect(start.getTime()).toBe(originalTime);
  });
});
