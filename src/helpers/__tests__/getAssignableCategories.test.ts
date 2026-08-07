import {describe, expect, it} from 'vitest';

import {Genders} from '@/enums';
import {getAssignableCategories} from '@/helpers';
import {Category} from '@/types';

const category = (overrides: Partial<Category> & {id: string; name: string}): Category =>
  ({
    age_group: null,
    created_at: null,
    description: null,
    gender: null,
    is_active: true,
    slug: null,
    sort_order: null,
    updated_at: null,
    ...overrides,
  }) as Category;

const men = category({id: 'men', name: 'Muži', gender: Genders.MALE});
const women = category({id: 'women', name: 'Ženy', gender: Genders.FEMALE});
const juniorGirls = category({id: 'junior-girls', name: 'Dorostenky', gender: Genders.FEMALE});
const kids = category({id: 'kids', name: 'Přípravka', gender: Genders.MIXED});
const unset = category({id: 'unset', name: 'Bez pohlaví', gender: null});
const archived = category({
  id: 'archived',
  name: 'Archivní',
  gender: Genders.MALE,
  is_active: false,
});

const all = [men, women, juniorGirls, kids, unset, archived];

const ids = (categories: Category[]) => categories.map((c) => c.id);

describe('getAssignableCategories', () => {
  it('offers a woman only female and mixed categories', () => {
    expect(ids(getAssignableCategories(all, Genders.FEMALE))).toEqual([
      'women',
      'junior-girls',
      'kids',
      'unset',
    ]);
  });

  it('offers a man only male and mixed categories', () => {
    expect(ids(getAssignableCategories(all, Genders.MALE))).toEqual(['men', 'kids', 'unset']);
  });

  it('lets a child in a mixed category move to a gendered one', () => {
    const assignable = getAssignableCategories(all, Genders.FEMALE, kids.id);

    expect(ids(assignable)).toContain('women');
    expect(ids(assignable)).toContain('kids');
    expect(ids(assignable)).not.toContain('men');
  });

  it('keeps the current category even when it breaks the rule or is archived', () => {
    expect(ids(getAssignableCategories(all, Genders.FEMALE, men.id))).toContain('men');
    expect(ids(getAssignableCategories(all, Genders.MALE, archived.id))).toContain('archived');
  });

  it('hides archived categories the member does not belong to', () => {
    expect(ids(getAssignableCategories(all, Genders.MALE))).not.toContain('archived');
  });

  it('treats a missing sex as eligible for mixed categories only', () => {
    expect(ids(getAssignableCategories(all, null))).toEqual(['kids', 'unset']);
  });
});
