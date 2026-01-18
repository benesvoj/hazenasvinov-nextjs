# TypeScript Error Fix: VideoWithMatch Type

## Problem Summary

**File:** `src/app/coaches/matches/components/CompactVideoList.tsx`

**Errors:** 12 TypeScript errors (TS2339) - Property 'match' does not exist on type 'VideoSchema'

### Root Cause
The component `CompactVideoList` expects videos with match data, but receives `VideoSchema[]` type which doesn't include the `match` property. The `match` property is dynamically added in `useStrategyPreparation` hook (lines 234-271), but there's no TypeScript type representing this enhanced structure.

## Current State

### Data Flow
1. **Hook:** `useStrategyPreparation` fetches videos with related match data via Supabase join
2. **Processing:** Videos are mapped to include a `match` object (lines 236-269)
3. **Component:** `CompactVideoList` tries to access `video.match.*` properties
4. **Type Issue:** Component receives `VideoSchema[]` type, but actual data has `match` property

### Relevant Files
- `src/types/entities/video/schema/videosSchema.ts` - Base VideoSchema (no match)
- `src/types/entities/video/data/video.ts` - Video type with relations (has `match_ids` array, not full match)
- `src/types/entities/match/data/match.ts` - Match type definition
- `src/hooks/coach/useStrategyPreparation.ts` - Adds match property dynamically
- `src/app/coaches/matches/components/CompactVideoList.tsx` - Consumes videos with match

## Solution Plan

### Step 1: Create VideoWithMatch Type
**File:** `src/types/entities/video/data/video.ts`

Add a new type that extends `VideoSchema` with an optional `match` property:

```typescript
import {Match} from '@/types';

/**
 * Video with associated match information
 * Used when displaying videos in match preparation contexts
 */
export interface VideoWithMatch extends VideoSchema {
  match?: {
    id: string;
    date: string;
    status: 'upcoming' | 'completed';
    home_team: {
      id: string;
      name: string;
      short_name: string;
    };
    away_team: {
      id: string;
      name: string;
      short_name: string;
    };
    home_score?: number | null;
    away_score?: number | null;
    home_score_halftime?: number | null;
    away_score_halftime?: number | null;
  };
}
```

**Rationale:** This type represents the exact structure created in `useStrategyPreparation` (lines 243-267).

### Step 2: Update CompactVideoList Component
**File:** `src/app/coaches/matches/components/CompactVideoList.tsx`

Change the prop type from `VideoSchema[]` to `VideoWithMatch[]`:

```typescript
import {VideoSchema, VideoWithMatch} from '@/types';

interface CompactVideoListProps {
  videos: VideoWithMatch[];  // Changed from VideoSchema[]
  loading: boolean;
  title: string;
  emptyMessage?: string;
}
```

**Impact:** This will make the TypeScript errors disappear and provide proper type checking.

### Step 3: Update StrategyTabWithVideos Component
**File:** `src/app/coaches/matches/components/StrategyTabWithVideos.tsx`

Update the prop type:

```typescript
import {Team, VideoWithMatch} from '@/types';

interface TabWithVideosProps {
  videosError: string | null;
  videosLoading: boolean;
  filteredOpponentVideos: VideoWithMatch[];  // Changed from VideoSchema[]
  opponentTeam: Team | null;
}
```

### Step 4: Update useStrategyPreparation Hook
**File:** `src/hooks/coach/useStrategyPreparation.ts`

Add proper type annotations:

```typescript
import {VideoWithMatch} from '@/types';

// Update processedVideos type
const processedVideos = useMemo<VideoWithMatch[]>(() => {
  return opponentVideos.map((video): VideoWithMatch => {
    // ... existing logic
  });
}, [opponentVideos]);

// Update filteredOpponentVideos type
const filteredOpponentVideos = useMemo<VideoWithMatch[]>(() => {
  // ... existing logic
}, [processedVideos, opponentTeam?.name, opponentClubId]);

// Update return type in function signature or interface
return {
  // ... other returns
  filteredOpponentVideos,  // Now properly typed as VideoWithMatch[]
  // ...
};
```

### Step 5: Export the New Type
**File:** `src/types/entities/video/index.ts`

Add the export:

```typescript
export * from './data/video';
export type {VideoWithMatch} from './data/video';
```

**File:** `src/types/index.ts`

Ensure it's re-exported from the main types index:

```typescript
export type {VideoWithMatch} from './entities/video';
```

## Benefits

1. **Type Safety:** Proper TypeScript checking for videos with match data
2. **Self-Documenting:** Clear type name indicates when match data is available
3. **Reusability:** Can be used in other components that display videos with matches
4. **Maintainability:** Changes to match structure are centralized in one type
5. **Error Prevention:** Prevents accessing match properties on videos that don't have them

## Testing Checklist

After implementing the fix:

- [ ] TypeScript compilation succeeds (`npm run tsc`)
- [ ] No TS2339 errors in CompactVideoList.tsx
- [ ] CompactVideoList renders correctly with match data
- [ ] CompactVideoList renders correctly without match data (optional match property)
- [ ] Strategy preparation zone displays videos correctly
- [ ] Match information appears in video cards when available

## Alternative Solutions Considered

### Alternative 1: Use Type Assertion
```typescript
// Not recommended - loses type safety
videos={filteredOpponentVideos as any}
```
**Rejected:** Loses all type safety and doesn't solve the underlying issue.

### Alternative 2: Extend Video Type
```typescript
// Add to existing Video interface
export interface Video extends VideoSchema {
  match?: MatchData;
}
```
**Rejected:** Video type is for general video data with relations. VideoWithMatch is specifically for match preparation contexts.

### Alternative 3: Use Intersection Type
```typescript
videos: (VideoSchema & {match?: MatchData})[]
```
**Rejected:** Less readable and harder to reuse. Named types are clearer.

## Implementation Order

1. Create `VideoWithMatch` type in `video.ts`
2. Export type from `video/index.ts` and main `types/index.ts`
3. Update `CompactVideoList.tsx` prop type
4. Update `StrategyTabWithVideos.tsx` prop type
5. Update `useStrategyPreparation.ts` type annotations
6. Run `npm run tsc` to verify
7. Test in browser

## Estimated Time

- Type creation and exports: 5 minutes
- Component updates: 5 minutes
- Hook type annotations: 5 minutes
- Testing and verification: 10 minutes
- **Total: ~25 minutes**

## Related Issues

- Consider creating similar types for other enhanced video contexts (e.g., `VideoWithMetadata`, `VideoWithAnalytics`)
- May want to standardize pattern for types with optional joined data across the codebase
