# Phase 5: Code Organization Refactoring Plan

**Target File:** `src/app/admin/matches/page.tsx`
**Scope:** Extract handlers, validation, and typed query builders
**Business Logic:** NO changes - pure structural refactoring

---

## Table of Contents

1. [Overview](#1-overview)
2. [Step 1: Extract Handlers into Custom Hooks](#2-step-1-extract-handlers-into-custom-hooks)
3. [Step 2: Move Validation Logic to Utilities](#3-step-2-move-validation-logic-to-utilities)
4. [Step 3: Create Typed Supabase Query Builders](#4-step-3-create-typed-supabase-query-builders)
5. [New Files Summary](#5-new-files-summary)
6. [Migration Checklist](#6-migration-checklist)

---

## 1. Overview

### Current State

The `admin/matches/page.tsx` contains:
- 18 state variables
- 6 direct Supabase write operations
- 4 indirect write operations via utilities
- Inline validation logic
- Raw Supabase queries with `any` types

### Target State

```
src/
├── hooks/
│   └── entities/
│       └── match/
│           └── state/
│               └── useMatchMutations.ts     ← NEW: CRUD operations hook
├── queries/
│   └── matches/
│       ├── constants.ts                      ← NEW: DB_TABLE, ENTITY
│       ├── mutations.ts                      ← NEW: Typed mutation functions
│       ├── queries.ts                        ← NEW: Typed query functions
│       ├── index.ts                          ← NEW: Exports
│       └── types.ts                          ← NEW: Insert/Update types
├── utils/
│   └── validation/
│       └── matchValidation.ts               ← NEW: Validation utilities
└── app/
    └── admin/
        └── matches/
            └── page.tsx                      ← SIMPLIFIED: Uses hooks
```

---

## 2. Step 1: Extract Handlers into Custom Hooks

### 2.1 Create `useMatchMutations` Hook

**Target File:** `src/hooks/entities/match/state/useMatchMutations.ts`

#### Functions to Extract

| Function in page.tsx | Lines | New Method Name |
|---------------------|-------|-----------------|
| `handleAddMatch` | 317-394 | `createMatch` |
| `handleUpdateResult` | 396-468 | `updateMatchResult` |
| `handleDeleteMatch` | 470-503 | `deleteMatch` |
| `handleDeleteAllMatches` | 505-532 | `deleteAllMatchesBySeason` |
| `handleUpdateMatch` | 562-715 | `updateMatch` |
| `handleBulkUpdateMatchweek` | 717-801 | `bulkUpdateMatchweek` |

#### New Interface

```typescript
// src/hooks/entities/match/state/useMatchMutations.ts

'use client';

import {useCallback, useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';

import {showToast} from '@/components';
import {translations} from '@/lib';
import {
  createMatch as createMatchMutation,
  updateMatch as updateMatchMutation,
  deleteMatch as deleteMatchMutation,
  bulkUpdateMatchweek as bulkUpdateMutation,
} from '@/queries/matches';
import {
  MatchInsertData,
  MatchUpdateData,
  MatchResultData,
  BulkMatchweekUpdateData,
} from '@/queries/matches/types';
import {Match} from '@/types';
import {createClient} from '@/utils/supabase/client';
import {refreshMaterializedViewWithCallback} from '@/utils/refreshMaterializedView';
import {autoRecalculateStandings} from '@/utils/autoStandingsRecalculation';

const t = translations.matches;

export interface UseMatchMutationsOptions {
  selectedCategory: string;
  selectedSeason: string;
  onStandingsRefresh?: () => Promise<void>;
}

export interface UseMatchMutationsResult {
  loading: boolean;
  error: string | null;
  createMatch: (data: MatchInsertData) => Promise<boolean>;
  updateMatch: (matchId: string, data: MatchUpdateData, originalMatch: Match) => Promise<boolean>;
  updateMatchResult: (matchId: string, data: MatchResultData) => Promise<boolean>;
  deleteMatch: (matchId: string) => Promise<boolean>;
  deleteAllMatchesBySeason: (seasonId: string) => Promise<boolean>;
  bulkUpdateMatchweek: (data: BulkMatchweekUpdateData, matches: Match[]) => Promise<boolean>;
  clearError: () => void;
}

export function useMatchMutations(options: UseMatchMutationsOptions): UseMatchMutationsResult {
  const {selectedCategory, selectedSeason, onStandingsRefresh} = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const invalidateMatchQueries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['matches', 'seasonal', selectedCategory, selectedSeason],
    });
    await queryClient.invalidateQueries({
      queryKey: ['matches'],
    });
  }, [queryClient, selectedCategory, selectedSeason]);

  const createMatch = useCallback(async (data: MatchInsertData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const {error: insertError} = await supabase.from('matches').insert(data);

      if (insertError) throw insertError;

      await refreshMaterializedViewWithCallback('admin match insert');
      await invalidateMatchQueries();

      return true;
    } catch (err: any) {
      setError(err.message || 'Chyba při přidávání zápasu');
      console.error('Error adding match:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase, invalidateMatchQueries]);

  const updateMatch = useCallback(async (
    matchId: string,
    data: MatchUpdateData,
    originalMatch: Match
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const {error: updateError} = await supabase
        .from('matches')
        .update(data)
        .eq('id', matchId);

      if (updateError) throw updateError;

      await refreshMaterializedViewWithCallback('admin match update');

      // Check if scores were updated
      const scoresWereUpdated =
        data.home_score !== originalMatch.home_score ||
        data.away_score !== originalMatch.away_score ||
        data.home_score_halftime !== originalMatch.home_score_halftime ||
        data.away_score_halftime !== originalMatch.away_score_halftime;

      if (scoresWereUpdated) {
        const standingsResult = await autoRecalculateStandings(matchId);

        if (standingsResult.success && standingsResult.recalculated) {
          await onStandingsRefresh?.();
          showToast.success(t.toasts.matchSavedWithUpdateStandingTable);
        } else if (standingsResult.success && !standingsResult.recalculated) {
          showToast.success(t.toasts.matchSavedSuccessfully);
        } else {
          showToast.warning(t.toasts.matchSavedWithoutUpdateStandingTable);
        }
      } else {
        showToast.warning(t.toasts.matchSavedWithoutUpdatedScore);
      }

      await invalidateMatchQueries();
      return true;
    } catch (err: any) {
      setError(err.message || 'Chyba při aktualizaci zápasu');
      console.error('Error updating match:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase, invalidateMatchQueries, onStandingsRefresh]);

  const updateMatchResult = useCallback(async (
    matchId: string,
    data: MatchResultData
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const {error: updateError} = await supabase
        .from('matches')
        .update({
          home_score: data.home_score,
          away_score: data.away_score,
          home_score_halftime: data.home_score_halftime,
          away_score_halftime: data.away_score_halftime,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (updateError) throw updateError;

      await refreshMaterializedViewWithCallback('admin result update');

      const standingsResult = await autoRecalculateStandings(matchId);

      if (standingsResult.success && standingsResult.recalculated) {
        await onStandingsRefresh?.();
        showToast.success(t.toasts.matchWithResultWasSaved);
      } else if (standingsResult.success && !standingsResult.recalculated) {
        showToast.success(t.toasts.matchResultWasSaved);
      } else {
        showToast.warning(t.toasts.matchResultSavedWithoutUpdateStandingTable);
      }

      await invalidateMatchQueries();
      return true;
    } catch (err: any) {
      setError(err.message || 'Chyba při aktualizaci výsledku');
      console.error('Error updating result:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase, invalidateMatchQueries, onStandingsRefresh]);

  const deleteMatch = useCallback(async (matchId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const {error: deleteError} = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (deleteError) throw deleteError;

      await refreshMaterializedViewWithCallback('admin match delete');
      await invalidateMatchQueries();

      return true;
    } catch (err: any) {
      setError(err.message || 'Chyba při mazání zápasu');
      console.error('Error deleting match:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase, invalidateMatchQueries]);

  const deleteAllMatchesBySeason = useCallback(async (seasonId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const {error: deleteError} = await supabase
        .from('matches')
        .delete()
        .eq('season_id', seasonId);

      if (deleteError) throw deleteError;

      await invalidateMatchQueries();
      return true;
    } catch (err: any) {
      setError(err.message || 'Chyba při mazání všech zápasů');
      console.error('Error deleting all matches:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase, invalidateMatchQueries]);

  const bulkUpdateMatchweek = useCallback(async (
    data: BulkMatchweekUpdateData,
    matches: Match[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      let matchesToUpdate: Match[];
      let updateData: {matchweek: number | null};

      if (data.action === 'set') {
        matchesToUpdate = matches.filter(
          (match) => match.category_id === data.categoryId && !match.matchweek
        );

        if (matchesToUpdate.length === 0) {
          setError('Nebyly nalezeny žádné zápasy bez kola pro vybranou kategorii');
          return false;
        }

        updateData = {matchweek: parseInt(data.matchweek)};
      } else {
        matchesToUpdate = matches.filter(
          (match) =>
            match.category_id === data.categoryId &&
            match.matchweek !== null &&
            match.matchweek !== undefined
        );

        if (matchesToUpdate.length === 0) {
          setError('Nebyly nalezeny žádné zápasy s kolem pro vybranou kategorii');
          return false;
        }

        updateData = {matchweek: null};
      }

      const {error: updateError} = await supabase
        .from('matches')
        .update(updateData)
        .in('id', matchesToUpdate.map((match) => match.id));

      if (updateError) throw updateError;

      await refreshMaterializedViewWithCallback('admin bulk update');
      await invalidateMatchQueries();

      return true;
    } catch (err: any) {
      setError(err.message || 'Chyba při hromadné aktualizaci');
      console.error('Error bulk updating:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase, invalidateMatchQueries]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createMatch,
    updateMatch,
    updateMatchResult,
    deleteMatch,
    deleteAllMatchesBySeason,
    bulkUpdateMatchweek,
    clearError,
  };
}
```

#### Before/After in page.tsx

**BEFORE (lines 317-394):**
```typescript
const handleAddMatch = async () => {
  if (isSeasonClosed()) {
    setError('Nelze přidat zápas do uzavřené sezóny');
    return;
  }

  try {
    if (!formData.date || !formData.time || ...) {
      setError('Prosím vyplňte všechna povinná pole');
      return;
    }

    const insertData: any = { ... };
    const {error} = await supabase.from('matches').insert(insertData);
    // ... 70+ lines of logic
  } catch (error) {
    setError('Chyba při přidávání zápasu');
  }
};
```

**AFTER:**
```typescript
const {
  loading: mutationLoading,
  error: mutationError,
  createMatch,
  updateMatch,
  updateMatchResult,
  deleteMatch,
  deleteAllMatchesBySeason,
  bulkUpdateMatchweek,
  clearError,
} = useMatchMutations({
  selectedCategory,
  selectedSeason,
  onStandingsRefresh: () => fetchStandings(selectedCategory, selectedSeason),
});

const handleAddMatch = async () => {
  if (isSeasonClosed()) {
    setError('Nelze přidat zápas do uzavřené sezóny');
    return;
  }

  const validation = validateAddMatchForm(formData);
  if (!validation.valid) {
    setError(validation.error!);
    return;
  }

  const insertData = buildMatchInsertData(formData, selectedCategory, selectedSeason, categories);
  const success = await createMatch(insertData);

  if (success) {
    modal.addMatch.onClose();
    resetAddMatchForm();
  }
};
```

---

## 3. Step 2: Move Validation Logic to Utilities

### 3.1 Create Match Validation Utilities

**Target File:** `src/utils/validation/matchValidation.ts`

#### Functions to Extract

| Validation in page.tsx | Lines | New Function |
|-----------------------|-------|--------------|
| Add match validation | 324-333 | `validateAddMatchForm` |
| Edit match validation | 576-594 | `validateEditMatchForm` |
| Result data validation | 406-414 | `validateResultData` |
| Bulk update validation | 719-727 | `validateBulkUpdateData` |

#### New File

```typescript
// src/utils/validation/matchValidation.ts

import {AddMatchFormData, EditMatchFormData} from '@/types';
import {translations} from '@/lib';

const t = translations.matches.toasts;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}

/**
 * Validates the add match form data
 */
export function validateAddMatchForm(formData: AddMatchFormData): ValidationResult {
  if (!formData.date) {
    return {valid: false, error: 'Prosím vyplňte datum', field: 'date'};
  }

  if (!formData.time) {
    return {valid: false, error: 'Prosím vyplňte čas', field: 'time'};
  }

  if (!formData.home_team_id) {
    return {valid: false, error: 'Prosím vyberte domácí tým', field: 'home_team_id'};
  }

  if (!formData.away_team_id) {
    return {valid: false, error: 'Prosím vyberte hostující tým', field: 'away_team_id'};
  }

  if (!formData.venue) {
    return {valid: false, error: 'Prosím vyplňte místo konání', field: 'venue'};
  }

  if (formData.home_team_id === formData.away_team_id) {
    return {valid: false, error: 'Domácí a hostující tým nemohou být stejné', field: 'away_team_id'};
  }

  return {valid: true};
}

/**
 * Validates the edit match form data
 */
export function validateEditMatchForm(formData: EditMatchFormData): ValidationResult {
  if (!formData.date) {
    return {valid: false, error: t.mandatoryFieldsMissing, field: 'date'};
  }

  if (!formData.time) {
    return {valid: false, error: t.mandatoryFieldsMissing, field: 'time'};
  }

  if (!formData.venue) {
    return {valid: false, error: t.mandatoryFieldsMissing, field: 'venue'};
  }

  if (!formData.home_team_id || !formData.away_team_id) {
    return {valid: false, error: t.selectBothTeams, field: 'teams'};
  }

  if (formData.home_team_id === formData.away_team_id) {
    return {valid: false, error: t.selectDifferentTeams, field: 'away_team_id'};
  }

  return {valid: true};
}

/**
 * Validates match result data
 */
export interface MatchResultData {
  home_score: number;
  away_score: number;
  home_score_halftime: number;
  away_score_halftime: number;
}

export function validateResultData(data: MatchResultData): ValidationResult {
  if (data.home_score === null || data.home_score === undefined) {
    return {valid: false, error: 'Prosím vyplňte domácí skóre', field: 'home_score'};
  }

  if (data.away_score === null || data.away_score === undefined) {
    return {valid: false, error: 'Prosím vyplňte hostující skóre', field: 'away_score'};
  }

  if (data.home_score < 0 || data.away_score < 0) {
    return {valid: false, error: 'Skóre nemůže být záporné', field: 'score'};
  }

  return {valid: true};
}

/**
 * Validates bulk update data
 */
export interface BulkUpdateValidationData {
  categoryId: string;
  matchweek: string;
  action: 'set' | 'remove';
}

export function validateBulkUpdateData(data: BulkUpdateValidationData): ValidationResult {
  if (!data.categoryId) {
    return {valid: false, error: 'Prosím vyberte kategorii', field: 'categoryId'};
  }

  if (data.action === 'set' && !data.matchweek) {
    return {valid: false, error: 'Prosím vyberte kolo pro nastavení', field: 'matchweek'};
  }

  return {valid: true};
}

/**
 * Validates season is not closed
 */
export function validateSeasonNotClosed(isClosed: boolean, action: string): ValidationResult {
  if (isClosed) {
    return {
      valid: false,
      error: `Nelze ${action} v uzavřené sezóně`,
    };
  }
  return {valid: true};
}
```

### 3.2 Create Data Builder Utilities

**Target File:** `src/utils/builders/matchDataBuilder.ts`

```typescript
// src/utils/builders/matchDataBuilder.ts

import {AddMatchFormData, EditMatchFormData, Category} from '@/types';
import {MatchInsertData, MatchUpdateData} from '@/queries/matches/types';
import {getCategoryInfo} from '@/helpers/getCategoryInfo';
import {matchStatusesKeys} from '@/constants';

/**
 * Builds insert data from add match form
 */
export function buildMatchInsertData(
  formData: AddMatchFormData,
  categoryId: string,
  seasonId: string,
  categories: Category[]
): MatchInsertData {
  const insertData: MatchInsertData = {
    category_id: categoryId,
    season_id: seasonId,
    date: formData.date,
    time: formData.time,
    home_team_id: formData.home_team_id,
    away_team_id: formData.away_team_id,
    venue: formData.venue || '',
    competition: getCategoryInfo(categoryId, categories).competition,
    is_home: true,
    status: matchStatusesKeys[0],
    matchweek: null,
    match_number: null,
  };

  // Handle matchweek
  if (formData.matchweek && formData.matchweek !== 0) {
    insertData.matchweek = formData.matchweek;
  }

  // Handle match_number
  if (formData.match_number && formData.match_number > 0) {
    insertData.match_number = formData.match_number;
  }

  return insertData;
}

/**
 * Builds update data from edit match form
 */
export function buildMatchUpdateData(formData: EditMatchFormData): MatchUpdateData {
  const updateData: MatchUpdateData = {
    date: formData.date,
    time: formData.time,
    home_team_id: formData.home_team_id,
    away_team_id: formData.away_team_id,
    venue: formData.venue,
    status: formData.status,
    matchweek: null,
    match_number: 0,
  };

  // Handle matchweek
  if (formData.matchweek === '') {
    updateData.matchweek = null;
  } else if (formData.matchweek) {
    updateData.matchweek = parseInt(formData.matchweek.toString());
  }

  // Handle match_number
  if (formData.match_number && formData.match_number > 0) {
    updateData.match_number = formData.match_number;
  }

  // Handle scores (only if provided)
  if (formData.home_score !== null && formData.home_score !== undefined &&
      formData.away_score !== null && formData.away_score !== undefined) {
    updateData.home_score = formData.home_score;
    updateData.away_score = formData.away_score;
  }

  if (formData.home_score_halftime !== null && formData.home_score_halftime !== undefined &&
      formData.away_score_halftime !== null && formData.away_score_halftime !== undefined) {
    updateData.home_score_halftime = formData.home_score_halftime;
    updateData.away_score_halftime = formData.away_score_halftime;
  }

  // Handle video_ids (currently missing in original code!)
  if (formData.video_ids) {
    updateData.video_ids = formData.video_ids;
  }

  return updateData;
}
```

---

## 4. Step 3: Create Typed Supabase Query Builders

### 4.1 Create Matches Query Module

**Target Folder:** `src/queries/matches/`

#### 4.1.1 Constants

**File:** `src/queries/matches/constants.ts`

```typescript
// src/queries/matches/constants.ts

export const DB_TABLE = 'matches';

export const ENTITY = {
  plural: 'Matches',
  singular: 'Match',
};
```

#### 4.1.2 Types

**File:** `src/queries/matches/types.ts`

```typescript
// src/queries/matches/types.ts

import {MatchStatus} from '@/enums';

/**
 * Data required to insert a new match
 */
export interface MatchInsertData {
  category_id: string;
  season_id: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  venue: string;
  competition: string;
  is_home: boolean;
  status: MatchStatus;
  matchweek: number | null;
  match_number: number | null;
  video_ids?: string[];
}

/**
 * Data for updating an existing match
 */
export interface MatchUpdateData {
  date?: string;
  time?: string;
  home_team_id?: string;
  away_team_id?: string;
  venue?: string;
  status?: MatchStatus;
  matchweek?: number | null;
  match_number?: number | null;
  home_score?: number;
  away_score?: number;
  home_score_halftime?: number;
  away_score_halftime?: number;
  video_ids?: string[];
  updated_at?: string;
}

/**
 * Data for updating match result only
 */
export interface MatchResultData {
  home_score: number;
  away_score: number;
  home_score_halftime: number;
  away_score_halftime: number;
}

/**
 * Data for bulk matchweek update
 */
export interface BulkMatchweekUpdateData {
  categoryId: string;
  matchweek: string;
  action: 'set' | 'remove';
}
```

#### 4.1.3 Mutations

**File:** `src/queries/matches/mutations.ts`

```typescript
// src/queries/matches/mutations.ts

import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from './constants';
import {MatchInsertData, MatchUpdateData} from './types';
import {Match} from '@/types';

/**
 * CRUD mutations for matches
 * Uses memoized createMutationHelpers factory
 */

let helpers: ReturnType<typeof createMutationHelpers<Match, MatchInsertData>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Match, MatchInsertData>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createMatch = (ctx: QueryContext, data: MatchInsertData) =>
  getHelpers().create(ctx, data);

export const updateMatch = (ctx: QueryContext, id: string, data: Partial<MatchUpdateData>) =>
  getHelpers().update(ctx, id, data);

export const deleteMatch = (ctx: QueryContext, id: string) =>
  getHelpers().delete(ctx, id);

/**
 * Bulk update matchweek for multiple matches
 */
export async function bulkUpdateMatchweek(
  ctx: QueryContext,
  matchIds: string[],
  matchweek: number | null
) {
  try {
    const {error} = await ctx.supabase
      .from(DB_TABLE)
      .update({matchweek})
      .in('id', matchIds);

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: {success: true, count: matchIds.length}, error: null};
  } catch (err: any) {
    console.error('Exception in bulkUpdateMatchweek:', err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 * Delete all matches for a season
 */
export async function deleteMatchesBySeason(ctx: QueryContext, seasonId: string) {
  try {
    const {error} = await ctx.supabase
      .from(DB_TABLE)
      .delete()
      .eq('season_id', seasonId);

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: {success: true}, error: null};
  } catch (err: any) {
    console.error('Exception in deleteMatchesBySeason:', err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 * Update match result
 */
export async function updateMatchResult(
  ctx: QueryContext,
  matchId: string,
  data: {
    home_score: number;
    away_score: number;
    home_score_halftime: number;
    away_score_halftime: number;
  }
) {
  try {
    const {data: match, error} = await ctx.supabase
      .from(DB_TABLE)
      .update({
        ...data,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: match as Match, error: null};
  } catch (err: any) {
    console.error('Exception in updateMatchResult:', err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}
```

#### 4.1.4 Index

**File:** `src/queries/matches/index.ts`

```typescript
// src/queries/matches/index.ts

export {
  createMatch,
  updateMatch,
  deleteMatch,
  bulkUpdateMatchweek,
  deleteMatchesBySeason,
  updateMatchResult,
} from './mutations';

export {DB_TABLE, ENTITY} from './constants';

export type {
  MatchInsertData,
  MatchUpdateData,
  MatchResultData,
  BulkMatchweekUpdateData,
} from './types';
```

---

## 5. New Files Summary

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `src/hooks/entities/match/state/useMatchMutations.ts` | CRUD operations hook | ~250 |
| `src/utils/validation/matchValidation.ts` | Validation utilities | ~100 |
| `src/utils/builders/matchDataBuilder.ts` | Data transformation | ~80 |
| `src/queries/matches/constants.ts` | DB constants | ~10 |
| `src/queries/matches/types.ts` | TypeScript interfaces | ~50 |
| `src/queries/matches/mutations.ts` | Typed mutations | ~120 |
| `src/queries/matches/index.ts` | Exports | ~20 |

**Total new code:** ~630 lines

**Removed from page.tsx:** ~400 lines

**Net reduction:** ~230 lines from main page + massive improvement in organization

---

## 6. Migration Checklist

### Phase 5.1: Create Query Module
- [X] Create `src/queries/matches/constants.ts`
- [X] Create `src/queries/matches/types.ts`
- [X] Create `src/queries/matches/mutations.ts`
- [x] Create `src/queries/matches/index.ts`
- [x] Add export to `src/queries/index.ts`
- [ ] Test mutations in isolation

### Phase 5.2: Create Validation Utilities
- [x] Create `src/utils/validation/matchValidation.ts`
- [x] Create `src/utils/builders/matchDataBuilder.ts`
- [x] Add exports to `src/utils/index.ts`
- [x] Write unit tests for validation functions

### Phase 5.3: Create Mutations Hook
- [x] Create `src/hooks/entities/match/state/useMatchMutations.ts`
- [x] Add export to `src/hooks/index.ts`
- [x] Test hook in isolation

### Phase 5.4: Refactor Page
- [ ] Import new hook and utilities
- [ ] Replace inline handlers with hook methods
- [ ] Replace inline validation with utility functions
- [ ] Replace inline data building with builder functions
- [ ] Remove unused imports
- [ ] Test all match operations

### Phase 5.5: Cleanup
- [ ] Remove old commented code
- [ ] Update documentation
- [ ] Run full test suite
- [ ] Code review

---

## 7. Testing Strategy

> **Note:** This project uses **Vitest** for testing (not Jest).

### Unit Tests

```typescript
// src/utils/validation/__tests__/matchValidation.test.ts

import {describe, it, expect} from 'vitest';

import {validateAddMatchForm, validateEditMatchForm} from '../matchValidation';

describe('validateAddMatchForm', () => {
  it('should return error when date is missing', () => {
    const result = validateAddMatchForm({
      date: '',
      time: '15:00',
      home_team_id: '1',
      away_team_id: '2',
      venue: 'Stadium',
      category_id: '',
      season_id: '',
    });

    expect(result.valid).toBe(false);
    expect(result.field).toBe('date');
  });

  it('should return error when teams are the same', () => {
    const result = validateAddMatchForm({
      date: '2024-01-01',
      time: '15:00',
      home_team_id: '1',
      away_team_id: '1',
      venue: 'Stadium',
      category_id: '',
      season_id: '',
    });

    expect(result.valid).toBe(false);
    expect(result.field).toBe('away_team_id');
  });

  it('should pass valid form data', () => {
    const result = validateAddMatchForm({
      date: '2024-01-01',
      time: '15:00',
      home_team_id: '1',
      away_team_id: '2',
      venue: 'Stadium',
      category_id: '',
      season_id: '',
    });

    expect(result.valid).toBe(true);
  });
});
```

### Integration Tests

```typescript
// src/hooks/entities/match/state/__tests__/useMatchMutations.test.ts

import {act} from 'react';

import {renderHook, waitFor} from '@testing-library/react';
import {beforeEach, afterEach, describe, it, expect, vi} from 'vitest';

import {useMatchMutations} from '../useMatchMutations';

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({error: null}),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({error: null}),
  }),
}));

// Mock refreshMaterializedViewWithCallback
vi.mock('@/utils/refreshMaterializedView', () => ({
  refreshMaterializedViewWithCallback: vi.fn().mockResolvedValue(undefined),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('useMatchMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create match successfully', async () => {
    const {result} = renderHook(() =>
      useMatchMutations({
        selectedCategory: 'cat-1',
        selectedSeason: 'season-1',
      })
    );

    await act(async () => {
      const success = await result.current.createMatch({
        category_id: 'cat-1',
        season_id: 'season-1',
        date: '2024-01-01',
        time: '15:00',
        home_team_id: '1',
        away_team_id: '2',
        venue: 'Stadium',
        competition: 'League',
        is_home: true,
        status: 'upcoming',
        matchweek: null,
        match_number: null,
      });

      expect(success).toBe(true);
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    // Override mock for this test
    vi.mocked(vi.importActual('@/utils/supabase/client')).createClient = vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({error: {message: 'Database error'}}),
    }));

    const {result} = renderHook(() =>
      useMatchMutations({
        selectedCategory: 'cat-1',
        selectedSeason: 'season-1',
      })
    );

    await act(async () => {
      const success = await result.current.createMatch({
        category_id: 'cat-1',
        season_id: 'season-1',
        date: '2024-01-01',
        time: '15:00',
        home_team_id: '1',
        away_team_id: '2',
        venue: 'Stadium',
        competition: 'League',
        is_home: true,
        status: 'upcoming',
        matchweek: null,
        match_number: null,
      });

      expect(success).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});
```

---

## 8. Rollback Plan

If issues arise during migration:

1. **Revert commits** - Each phase should be a separate commit
2. **Feature flag** - Consider using a feature flag for gradual rollout
3. **Parallel implementation** - Keep old code commented until new code is verified

```typescript
// Optional feature flag approach
const USE_NEW_MUTATIONS = process.env.NEXT_PUBLIC_USE_NEW_MUTATIONS === 'true';

const handleAddMatch = USE_NEW_MUTATIONS
  ? handleAddMatchNew  // Uses useMatchMutations
  : handleAddMatchLegacy;  // Original inline code
```
