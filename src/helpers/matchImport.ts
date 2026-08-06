/**
 * Shared name-matching logic for importing matches from Excel/CSV.
 *
 * Both the preview validation in ExcelImportModal and the actual insert in
 * useExcelImport must resolve the same spreadsheet cell to the same row,
 * otherwise a file can validate green and then import against a different
 * team. Keeping the lookup here is what guarantees they stay in sync.
 */

export interface ImportTeamCandidate {
  id: string;
  name: string;
  short_name?: string | null;
  category_id?: string | null;
  season_id?: string | null;
}

export interface ImportCategoryCandidate {
  id: string;
  name: string;
}

export interface ResolveResult<T> {
  match: T | null;
  error: string | null;
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Names in the DB always carry a team suffix ("TJ Sokol Kyšice A"), while
 * spreadsheets usually omit it. Substring matching bridges that gap, but only
 * after an exact match has been ruled out — otherwise "Svinov" could win over
 * a literal "Svinov" row.
 */
const fuzzyCandidates = <T extends {name: string; short_name?: string | null}>(
  items: T[],
  search: string
) =>
  items.filter((item) => {
    const name = normalize(item.name);
    const shortName = item.short_name ? normalize(item.short_name) : '';

    return (
      name.includes(search) ||
      search.includes(name) ||
      (!!shortName && (shortName.includes(search) || search.includes(shortName)))
    );
  });

export function resolveImportTeam<T extends ImportTeamCandidate>(
  teams: T[],
  options: {name: string; label: string; categoryId?: string; seasonId?: string}
): ResolveResult<T> {
  const {name, label, categoryId, seasonId} = options;
  const search = normalize(name);

  if (!search) {
    return {match: null, error: `Chybí ${label.toLowerCase()}`};
  }

  // A team id is only valid within its own category and season — matching
  // across the whole table would happily return last season's row.
  const scoped = teams.filter(
    (team) =>
      (!categoryId || team.category_id === categoryId) && (!seasonId || team.season_id === seasonId)
  );

  if (scoped.length === 0) {
    return {
      match: null,
      error: `${label} "${name}" nebyl nalezen – pro tuto kategorii a sezónu nejsou evidovány žádné týmy`,
    };
  }

  const exact = scoped.find(
    (team) =>
      normalize(team.name) === search || (team.short_name && normalize(team.short_name) === search)
  );

  if (exact) {
    return {match: exact, error: null};
  }

  const candidates = fuzzyCandidates(scoped, search);

  if (candidates.length === 1) {
    return {match: candidates[0], error: null};
  }

  if (candidates.length > 1) {
    return {
      match: null,
      error: `${label} "${name}" je nejednoznačný – odpovídá více týmům: ${candidates
        .map((team) => team.name)
        .join(', ')}. Uveďte název včetně označení týmu (např. "A", "B").`,
    };
  }

  return {
    match: null,
    error: `${label} "${name}" nebyl nalezen. Dostupné týmy: ${scoped
      .map((team) => team.name)
      .join(', ')}`,
  };
}

export function resolveImportCategory<T extends ImportCategoryCandidate>(
  categories: T[],
  name: string
): ResolveResult<T> {
  const search = normalize(name);

  if (!search) {
    return {match: null, error: 'Chybí kategorie'};
  }

  const exact = categories.find((category) => normalize(category.name) === search);

  if (exact) {
    return {match: exact, error: null};
  }

  const candidates = fuzzyCandidates(categories, search);

  if (candidates.length === 1) {
    return {match: candidates[0], error: null};
  }

  if (candidates.length > 1) {
    return {
      match: null,
      error: `Kategorie "${name}" je nejednoznačná – odpovídá: ${candidates
        .map((category) => category.name)
        .join(', ')}`,
    };
  }

  return {match: null, error: `Kategorie "${name}" nebyla nalezena`};
}
