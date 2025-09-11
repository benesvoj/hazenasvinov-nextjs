# Current Database Schema Analysis

**Generated:** 2025-09-10T22:48:26.222Z  
**Source:** TypeScript type analysis from codebase

## Migration Status: ⚠️ PARTIAL MIGRATION IN PROGRESS

The database is currently in a **partial migration state** from legacy `category`/`code` VARCHAR fields to modern `category_id` UUID fields.

## Key Findings

### ✅ Tables Using Modern `category_id` System:
- **`blog_posts`** - `category_id: string (optional)`
- **`matches`** - `category_id: string (required)`
- **`members`** - `category_id: string (optional)`
- **`standings`** - `category_id: string (required)`
- **`category_lineups`** - `category_id: string (required)`
- **`club_categories`** - `category_id: string (required)`
- **`club_teams`** - `category_id: string (required)`

### ❌ Tables Still Using Legacy `category`/`code` System:
- **`training_sessions`** - `category: string (required)`
- **`category_lineup_members`** - `category: string (required)`

### 🔄 Category Types Analysis:

#### Legacy Category Interface:
```typescript
interface Category {
  id: string;
  code: string;           // ❌ Legacy VARCHAR field
  name: string;
  // ... other fields
}
```

#### Modern Category Interface:
```typescript
interface CategoryNew {
  id: string;
  code?: string;          // ⚠️ Optional - migration in progress
  name: string;
  slug: string;           // ✅ New URL-friendly field
  // ... other fields
}
```

## Critical Dependencies Blocking `code` Field Removal:

### 1. Training Sessions System
- **Table:** `training_sessions`
- **Field:** `category: string (required)`
- **Impact:** All coaching/attendance features depend on this
- **Functions:** `get_training_sessions(p_category VARCHAR(50), ...)`

### 2. Category Lineup Members
- **Table:** `category_lineup_members` 
- **Field:** `category: string (required)`
- **Impact:** Lineup management system

### 3. Database Functions
- All RPC functions expect `VARCHAR(50)` category codes
- Functions like `get_training_sessions` use legacy field

## Migration Strategy Required:

### Phase 1: Complete Database Migration
```sql
-- Add category_id to remaining tables
ALTER TABLE training_sessions ADD COLUMN category_id UUID REFERENCES categories(id);
ALTER TABLE category_lineup_members ADD COLUMN category_id UUID REFERENCES categories(id);

-- Migrate data
UPDATE training_sessions SET category_id = (SELECT id FROM categories WHERE code = training_sessions.category);
UPDATE category_lineup_members SET category_id = (SELECT id FROM categories WHERE code = category_lineup_members.category);
```

### Phase 2: Update Database Functions
```sql
-- Update all RPC functions to use category_id
CREATE OR REPLACE FUNCTION get_training_sessions(
    p_category_id UUID,
    p_season_id UUID,
    p_user_id UUID
) RETURNS TABLE (...) AS $$
    WHERE ts.category_id = p_category_id
$$;
```

### Phase 3: Update Application Code
- Migrate `TrainingSession` interface to use `category_id`
- Update all attendance/coaching features
- Update lineup management system

### Phase 4: Remove Legacy Fields
```sql
-- Only after all code is migrated
ALTER TABLE training_sessions DROP COLUMN category;
ALTER TABLE category_lineup_members DROP COLUMN category;
ALTER TABLE categories DROP COLUMN code;
```

## Current Schema Files Created:

1. **`scripts/get_current_schema.sql`** - SQL script to extract current schema from database
2. **`scripts/analyze_schema_from_types.ts`** - TypeScript analysis script
3. **`src/app/api/extract-schema/route.ts`** - API endpoint for schema extraction

## Recommendation:

**❌ CANNOT REMOVE `categories.code` YET**

**Blockers:**
1. Training sessions system still uses `category` VARCHAR field
2. Category lineup members still uses `category` VARCHAR field  
3. All database functions expect VARCHAR category codes
4. Critical coaching/attendance features depend on legacy system

**Next Steps:**
1. Complete migration of `training_sessions` table
2. Complete migration of `category_lineup_members` table
3. Update all database functions to use `category_id`
4. Update application code for attendance/coaching features
5. Then safely remove the `code` field

**Estimated Effort:** 2-3 days of focused migration work

## Schema Extraction Commands:

```bash
# Extract current schema from database (run in Supabase SQL Editor)
# Use: scripts/get_current_schema.sql

# Analyze schema from TypeScript types
npx tsx scripts/analyze_schema_from_types.ts

# Extract schema via API (if available)
curl http://localhost:3000/api/extract-schema
```
