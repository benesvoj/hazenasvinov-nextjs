import {describe, expect, it} from 'vitest';

import {normalizeSearchTerm} from '../normalizeSearchTerm';

describe('normalizeSearchTerm', () => {
  it('strips Czech diacritics', () => {
    expect(normalizeSearchTerm('Černý')).toBe('cerny');
    expect(normalizeSearchTerm('Dvořák')).toBe('dvorak');
    expect(normalizeSearchTerm('Ťapka Ňuf Ěško')).toBe('tapka nuf esko');
  });

  it('lower-cases and trims', () => {
    expect(normalizeSearchTerm('  NOVÁK  ')).toBe('novak');
  });

  it('makes an accented query match its unaccented form and vice versa', () => {
    expect(normalizeSearchTerm('Černý')).toBe(normalizeSearchTerm('cerny'));
    expect(normalizeSearchTerm('CERNY')).toBe(normalizeSearchTerm('černý'));
  });

  it('leaves plain text and registration numbers untouched', () => {
    expect(normalizeSearchTerm('REG-2024-0001')).toBe('reg-2024-0001');
    expect(normalizeSearchTerm('')).toBe('');
  });
});
