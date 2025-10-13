# Betting System - Adult Category Filter Fix

## Problem

The betting system was showing **all matches** (adults, juniors, youth, kids) instead of only adult category matches, despite having a filter in place.

## Root Cause

**Supabase PostgREST nested relation filtering doesn't work as expected.**

The original code used:
```typescript
.eq('category.age_group', 'adults')
```

This filter **appeared to work** but actually:
- Returned ALL matches regardless of age_group
- Set `category` data to `null` for non-adult matches
- Did NOT exclude non-adult matches from results

This is a known limitation of PostgREST - you cannot filter on nested relation fields directly.

## The Fix

**Use a two-step approach:**

### Step 1: Get adult category IDs
```typescript
const {data: adultCategories} = await supabase
  .from('categories')
  .select('id')
  .eq('age_group', AgeGroups.ADULTS);

const adultCategoryIds = adultCategories?.map((cat: {id: string}) => cat.id) || [];
```

### Step 2: Filter matches by category_id
```typescript
.in('category_id', adultCategoryIds)
```

Instead of filtering on nested `category.age_group`, we:
1. First query the `categories` table to get IDs of adult categories
2. Then filter matches using `.in('category_id', [array of IDs])`

## Implementation

### Updated Files:

**`src/services/features/betting/matchService.ts`**

#### `getUpcomingBettingMatches()` function:
```typescript
// First, get adult category IDs
const {data: adultCategories} = await supabase
  .from('categories')
  .select('id')
  .eq('age_group', AgeGroups.ADULTS);

const adultCategoryIds = adultCategories?.map((cat: {id: string}) => cat.id) || [];

// If no adult categories found, return empty result
if (adultCategoryIds.length === 0) {
  return {matches: [], error: null};
}

// Build query with category_id filter
let query = supabase
  .from('matches')
  .select(/* ... */)
  .eq('status', 'upcoming')
  .gte('date', todayStr)
  .lte('date', futureDateStr)
  .in('category_id', adultCategoryIds) // ✓ WORKS
  .order('date', {ascending: true});
```

#### `getBettingMatchById()` function:
Same two-step approach applied.

## Testing

### Before Fix:
```bash
node scripts/debug_betting_query.js
```
**Result:** 20 matches returned (youth, juniors, adults mixed)

### After Fix:
```bash
node scripts/debug_betting_query_v2.js
```
**Result:** 20 matches returned (ALL adults only) ✅

### Test Results:
```
Adult categories found: 2 (Muži, Ženy)
Adult matches returned: 20
Non-adult matches: 0
Filter status: ✅ WORKING
```

## Performance Impact

**Minimal overhead:**
- Adds one extra query to fetch category IDs
- Category query is very fast (indexed table, few rows)
- Results are cached by React Query for 5 minutes
- Alternative approaches (SQL functions, views) would be more complex

**Optimization (future):**
If performance becomes an issue, consider:
1. Cache adult category IDs in Redis/memory
2. Create a database view pre-filtered for adult matches
3. Use Supabase RPC function with SQL JOIN

## Why Not Use SQL Views?

We considered creating a database view:
```sql
CREATE VIEW betting_adult_matches AS
SELECT m.*
FROM matches m
INNER JOIN categories c ON m.category_id = c.id
WHERE c.age_group = 'adults';
```

**Reasons against:**
- Adds database complexity
- Less flexible for future filtering needs
- Current solution is simple and works well
- React Query caching makes performance acceptable

## SQL Alternative (for reference)

You can run this SQL in Supabase to see adult matches:
```sql
-- Get adult category IDs
WITH adult_categories AS (
  SELECT id FROM categories WHERE age_group = 'adults'
)

-- Get matches
SELECT m.*
FROM matches m
WHERE m.status = 'upcoming'
  AND m.date >= CURRENT_DATE
  AND m.category_id IN (SELECT id FROM adult_categories)
ORDER BY m.date ASC, m.time ASC
LIMIT 20;
```

## Key Takeaways

### ❌ This DOESN'T work with Supabase:
```typescript
.eq('category.age_group', 'adults')  // Nested relation filter
```

### ✅ This DOES work:
```typescript
// Step 1: Get category IDs
const {data: cats} = await supabase
  .from('categories')
  .select('id')
  .eq('age_group', 'adults');

// Step 2: Filter by IDs
.in('category_id', cats.map(c => c.id))
```

## Verification

To verify the fix is working in your app:

1. **Visit** `/betting` page
2. **Check** that only adult matches (Muži, Ženy) appear
3. **No youth/junior matches** should be visible
4. **Console** should show no errors

You can also run the debug scripts:
```bash
# Original (broken) approach
node scripts/debug_betting_query.js

# Fixed approach
node scripts/debug_betting_query_v2.js
```

## Documentation Updated

- ✅ `src/services/features/betting/matchService.ts` - Fixed filtering logic
- ✅ `docs/BETTING_ADULT_FILTER_FIX.md` - This document
- ✅ Debug scripts created for testing

## Related Files

- `/Users/vojtechbenes/.../src/services/features/betting/matchService.ts` - Main fix
- `/Users/vojtechbenes/.../scripts/debug_betting_query.js` - Original (broken) test
- `/Users/vojtechbenes/.../scripts/debug_betting_query_v2.js` - New (working) test
- `/Users/vojtechbenes/.../scripts/debug_betting_matches_query.sql` - SQL debugging

## Status

✅ **FIXED and TESTED**

The betting system now correctly shows only matches from adult categories (Muži and Ženy).
