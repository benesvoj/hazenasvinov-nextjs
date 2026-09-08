import {describe, expect, it} from 'vitest';

import {Genders} from '@/enums';
import {getCallUpCategories} from '@/helpers';
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

// The production category list, which is what this has to behave sensibly on.
const men = category({id: 'men', name: 'Muži', gender: Genders.MALE});
const juniorBoys = category({id: 'junior-boys', name: 'Dorostenci', gender: Genders.MALE});
const olderBoys = category({id: 'older-boys', name: 'Starší žáci', gender: Genders.MALE});
const women = category({id: 'women', name: 'Ženy', gender: Genders.FEMALE, is_active: false});
const juniorGirls = category({id: 'junior-girls', name: 'Dorostenky', gender: Genders.FEMALE});
const olderGirls = category({id: 'older-girls', name: 'Starší žačky', gender: Genders.FEMALE});
const kids = category({id: 'kids', name: 'Přípravka', gender: Genders.MIXED, is_active: false});
const noGender = category({id: 'no-gender', name: 'Bez pohlaví'});

const ALL = [men, juniorBoys, olderBoys, women, juniorGirls, olderGirls, kids, noGender];

const ids = (categories: Category[]) => categories.map((c) => c.id);

describe('getCallUpCategories', () => {
  it('ženská kategorie vidí jen ženské kategorie', () => {
    expect(ids(getCallUpCategories(ALL, juniorGirls.id))).toEqual([
      'women',
      'junior-girls',
      'older-girls',
    ]);
  });

  it('mužská kategorie vidí jen mužské kategorie', () => {
    expect(ids(getCallUpCategories(ALL, juniorBoys.id))).toEqual([
      'men',
      'junior-boys',
      'older-boys',
    ]);
  });

  it('vlastní kategorie je v seznamu vždy', () => {
    expect(ids(getCallUpCategories(ALL, olderGirls.id))).toContain('older-girls');
  });

  // Ženy jsou vedené jako neaktivní, ale mají patnáct aktivních hráček.
  it('neaktivní kategorie se nevyhazují — hráčky v nich jsou aktivní', () => {
    expect(ids(getCallUpCategories(ALL, juniorGirls.id))).toContain('women');
  });

  it('smíšená kategorie vidí všechny', () => {
    expect(getCallUpCategories(ALL, kids.id)).toHaveLength(ALL.length);
  });

  it('kategorie bez vyplněného pohlaví se chová jako smíšená', () => {
    expect(getCallUpCategories(ALL, noGender.id)).toHaveLength(ALL.length);
  });

  it('neznámá kategorie nevrací nic — volající zůstane u své kategorie', () => {
    expect(getCallUpCategories(ALL, 'neexistuje')).toEqual([]);
    expect(getCallUpCategories(ALL, undefined)).toEqual([]);
  });
});
