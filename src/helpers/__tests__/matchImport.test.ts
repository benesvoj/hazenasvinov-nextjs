import {describe, it, expect} from 'vitest';

import {
  ImportTeamCandidate,
  parseImportMatchweek,
  resolveImportCategory,
  resolveImportTeam,
} from '../matchImport';

const MEN = 'category-men';
const JUNIORS = 'category-juniors';
const SEASON = 'season-2025';
const PREVIOUS_SEASON = 'season-2024';

const team = (overrides: Partial<ImportTeamCandidate> & {id: string; name: string}) => ({
  short_name: null,
  category_id: MEN,
  season_id: SEASON,
  ...overrides,
});

const resolveHomeTeam = (teams: ImportTeamCandidate[], name: string) =>
  resolveImportTeam(teams, {name, label: 'Domácí tým', categoryId: MEN, seasonId: SEASON});

describe('resolveImportTeam', () => {
  it('should match a name exactly', () => {
    const svinov = team({id: 'a', name: 'TJ Sokol Svinov A'});
    const result = resolveHomeTeam(
      [svinov, team({id: 'b', name: 'TJ Sokol Poruba A'})],
      'TJ Sokol Svinov A'
    );

    expect(result.match).toBe(svinov);
    expect(result.error).toBeNull();
  });

  it('should match a short name exactly', () => {
    const svinov = team({id: 'a', name: 'TJ Sokol Svinov A', short_name: 'Svinov A'});
    const result = resolveHomeTeam([svinov], 'Svinov A');

    expect(result.match).toBe(svinov);
  });

  it('should ignore case and surrounding whitespace', () => {
    const svinov = team({id: 'a', name: 'TJ Sokol Svinov A'});

    expect(resolveHomeTeam([svinov], '  tj sokol SVINOV a ').match).toBe(svinov);
  });

  it('should collapse repeated whitespace inside the name', () => {
    const svinov = team({id: 'a', name: 'TJ Sokol Svinov A'});

    expect(resolveHomeTeam([svinov], 'TJ  Sokol   Svinov A').match).toBe(svinov);
  });

  it('should match a spreadsheet name that omits the team suffix', () => {
    // Files list "TJ Sokol Kyšice", the DB always carries a suffix
    const kysice = team({id: 'a', name: 'TJ Sokol Kyšice A'});
    const result = resolveHomeTeam(
      [kysice, team({id: 'b', name: 'TJ Příchovice A'})],
      'TJ Sokol Kyšice'
    );

    expect(result.match).toBe(kysice);
    expect(result.error).toBeNull();
  });

  it('should prefer an exact match over a substring one', () => {
    const withoutSuffix = team({id: 'exact', name: 'Svinov'});
    const withSuffix = team({id: 'fuzzy', name: 'Svinov A'});

    // Both would pass substring matching, so order must not decide the winner
    expect(resolveHomeTeam([withSuffix, withoutSuffix], 'Svinov').match).toBe(withoutSuffix);
  });

  it('should report ambiguity instead of picking the first substring match', () => {
    const teams = [
      team({id: 'a', name: 'TJ Sokol Svinov A'}),
      team({id: 'b', name: 'TJ Sokol Svinov B'}),
    ];

    const result = resolveHomeTeam(teams, 'TJ Sokol Svinov');

    expect(result.match).toBeNull();
    expect(result.error).toContain('nejednoznačný');
    expect(result.error).toContain('TJ Sokol Svinov A');
    expect(result.error).toContain('TJ Sokol Svinov B');
  });

  it('should not resolve a team from another category', () => {
    const men = team({id: 'men', name: 'TJ Sokol Svinov A', category_id: MEN});
    const juniors = team({id: 'juniors', name: 'TJ Sokol Svinov A', category_id: JUNIORS});

    expect(resolveHomeTeam([juniors, men], 'TJ Sokol Svinov A').match).toBe(men);
  });

  it('should not resolve a team from another season', () => {
    const current = team({id: 'current', name: 'TJ Sokol Svinov A', season_id: SEASON});
    const previous = team({id: 'previous', name: 'TJ Sokol Svinov A', season_id: PREVIOUS_SEASON});

    expect(resolveHomeTeam([previous, current], 'TJ Sokol Svinov A').match).toBe(current);
  });

  it('should search all teams when no scope is given', () => {
    const juniors = team({id: 'juniors', name: 'TJ Sokol Svinov A', category_id: JUNIORS});

    const result = resolveImportTeam([juniors], {name: 'TJ Sokol Svinov A', label: 'Domácí tým'});

    expect(result.match).toBe(juniors);
  });

  it('should report an empty name as missing', () => {
    const result = resolveHomeTeam([team({id: 'a', name: 'TJ Sokol Svinov A'})], '   ');

    expect(result.match).toBeNull();
    expect(result.error).toBe('Chybí domácí tým');
  });

  it('should explain when the category and season hold no teams at all', () => {
    const result = resolveHomeTeam(
      [team({id: 'a', name: 'TJ Sokol Svinov A', season_id: PREVIOUS_SEASON})],
      'TJ Sokol Svinov A'
    );

    expect(result.match).toBeNull();
    expect(result.error).toContain('nejsou evidovány žádné týmy');
  });

  it('should list the available teams when nothing matches', () => {
    const result = resolveHomeTeam([team({id: 'a', name: 'TJ Sokol Poruba A'})], 'HC Zubří');

    expect(result.match).toBeNull();
    expect(result.error).toContain('nebyl nalezen');
    expect(result.error).toContain('TJ Sokol Poruba A');
  });

  it('should use the given label in error messages', () => {
    const result = resolveImportTeam([], {name: 'HC Zubří', label: 'Hostující tým'});

    expect(result.error).toContain('Hostující tým');
  });
});

describe('resolveImportCategory', () => {
  const categories = [
    {id: MEN, name: 'Muži'},
    {id: JUNIORS, name: 'Dorost'},
  ];

  it('should match a name exactly', () => {
    expect(resolveImportCategory(categories, 'Muži').match).toEqual(categories[0]);
  });

  it('should ignore case and whitespace', () => {
    expect(resolveImportCategory(categories, '  muži ').match).toEqual(categories[0]);
  });

  it('should match a single substring candidate', () => {
    expect(resolveImportCategory([{id: MEN, name: 'Muži A'}], 'Muži').match?.id).toBe(MEN);
  });

  it('should report ambiguity when several categories match', () => {
    const result = resolveImportCategory(
      [
        {id: 'a', name: 'Muži A'},
        {id: 'b', name: 'Muži B'},
      ],
      'Muži'
    );

    expect(result.match).toBeNull();
    expect(result.error).toContain('nejednoznačná');
  });

  it('should report an unknown category', () => {
    const result = resolveImportCategory(categories, 'Přípravka');

    expect(result.match).toBeNull();
    expect(result.error).toBe('Kategorie "Přípravka" nebyla nalezena');
  });

  it('should report an empty category as missing', () => {
    expect(resolveImportCategory(categories, '').error).toBe('Chybí kategorie');
  });
});

describe('parseImportMatchweek', () => {
  it('should treat a missing column as "derive from date"', () => {
    expect(parseImportMatchweek(undefined)).toEqual({match: null, error: null});
  });

  it.each(['', '   '])('should treat %p as "derive from date"', (value) => {
    expect(parseImportMatchweek(value)).toEqual({match: null, error: null});
  });

  it('should parse a positive integer', () => {
    expect(parseImportMatchweek('3').match).toBe(3);
  });

  it('should tolerate surrounding whitespace', () => {
    expect(parseImportMatchweek(' 12 ').match).toBe(12);
  });

  it.each(['0', '-1', '3.5', '3,5', 'abc', '1a'])('should reject %p', (value) => {
    const result = parseImportMatchweek(value);

    expect(result.match).toBeNull();
    expect(result.error).toContain('Neplatné kolo');
  });
});
