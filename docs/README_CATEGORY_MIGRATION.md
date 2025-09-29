# Category Code to ID Migration Guide

This document provides a comprehensive analysis and step-by-step migration plan to eliminate the use of `category.code` as a unique identifier and migrate to using `category.id` throughout the application.

## 🔍 Current State Analysis

### Database Schema
- **Categories table** contains both `id` (UUID) and `code` (VARCHAR) fields
- **Current usage**: `code` is used as the primary identifier in URLs, filtering, and component logic
- **Target state**: Use `id` as the primary identifier while maintaining `code` for display purposes

### Current Category Codes
The following category codes are currently used throughout the system:
- `men` - Muži
- `women` - Ženy  
- `juniorBoys` - Dorostenci
- `juniorGirls` - Dorostenky
- `olderBoys` - Starší žáci
- `olderGirls` - Starší žákyně
- `youngerBoys` - Mladší žáci
- `youngerGirls` - Mladší žákyně
- `prepKids` - Přípravka
- `youngestKids` - Nejmladší děti

## 📊 Impact Analysis

### Files Requiring Updates (15 files)

#### 1. **URL Routing & Navigation**
- `src/app/(main)/categories/[slug]/page.tsx` - Category page routing
- `src/routes/routes.ts` - Hardcoded category routes
- `src/utils/categoryPageData.ts` - Server-side category data fetching

#### 2. **Component Logic**
- `src/components/match/MatchSchedule.tsx` - Match filtering
- `src/app/(main)/matches/page.tsx` - Category selection
- `src/app/(main)/matches/components/ClubSelector.tsx` - Club filtering
- `src/app/(main)/matches/[id]/page.tsx` - Match detail URLs

#### 3. **Admin Interface**
- `src/app/admin/members/components/MembersListTab.tsx` - Member filtering
- `src/app/admin/members/components/MemberFormModal.tsx` - Member forms
- `src/app/admin/members/components/BulkEditModal.tsx` - Bulk operations
- `src/app/admin/members/components/MembersStatisticTab.tsx` - Statistics
- `src/app/admin/user-roles/page.tsx` - Role assignments
- `src/app/admin/categories/page.tsx` - Category management

#### 4. **Hooks & Utilities**
- `src/hooks/useFetchMatches.ts` - Match fetching logic
- `src/hooks/useFetchMatch.ts` - Single match fetching
- `src/app/admin/members/helpers/memberHelpers.ts` - Member utilities

## 🚀 Migration Strategy

### Phase 1: Database Preparation
1. Add slug field to categories table for URL-friendly identifiers
2. Create mapping table for code-to-id migration
3. Update foreign key references to use category_id consistently

### Phase 2: Backend API Updates
1. Update all database queries to use category_id instead of code
2. Modify hooks and utilities to work with IDs
3. Update data transformation functions

### Phase 3: Frontend Component Updates
1. Update URL routing to use category IDs or slugs
2. Modify component props and state management
3. Update filtering and selection logic

### Phase 4: Testing and Cleanup
1. Comprehensive testing of all category-related functionality
2. Remove deprecated code references
3. Update documentation

## 📋 Detailed Migration Steps

### Step 1: Database Schema Updates

#### 1.1 Add slug field to categories table
```sql
-- Add slug field for URL-friendly identifiers
ALTER TABLE categories 
ADD COLUMN slug VARCHAR(50) UNIQUE;

-- Populate slug field with existing codes
UPDATE categories SET slug = code WHERE slug IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
```

#### 1.2 Create category mapping table for migration
```sql
-- Create mapping table for code-to-id migration
CREATE TABLE category_migration_map (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    old_code VARCHAR(50) NOT NULL,
    new_id UUID NOT NULL REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate mapping table
INSERT INTO category_migration_map (old_code, new_id)
SELECT code, id FROM categories;
```

### Step 2: Update Core Hooks and Utilities

#### 2.1 Update useCategories hook
**File**: `src/hooks/useCategories.ts`
```typescript
// BEFORE
.select('id, code, name')

// AFTER
.select('id, slug, name')
```

#### 2.2 Update useFetchMatches hook
**File**: `src/hooks/useFetchMatches.ts`
```typescript
// BEFORE
export function useFetchMatches(categorySlug: string, ...)

// AFTER
export function useFetchMatches(categoryId: string, ...)

// Update database query
.eq('code', categorySlug)
// TO
.eq('id', categoryId)
```

#### 2.3 Update useFetchMatch hook
**File**: `src/hooks/useFetchMatch.ts`
```typescript
// Remove category code lookup logic
// Use category_id directly in queries
```

### Step 3: Update Component Logic

#### 3.1 Category Page Routing
**File**: `src/app/(main)/categories/[slug]/page.tsx`
```typescript
// BEFORE
const currentCategory = categories?.find(cat => 
  cat.code === categorySlug
);

// AFTER
const currentCategory = categories?.find(cat => 
  cat.slug === categorySlug
);
```

#### 3.2 Matches Page Filtering
**File**: `src/app/(main)/matches/page.tsx`
```typescript
// BEFORE
<SelectItem key={category.code}>

// AFTER
<SelectItem key={category.id}>
```

#### 3.3 Club Selector Component
**File**: `src/app/(main)/matches/components/ClubSelector.tsx`
```typescript
// BEFORE
const selectedCategoryData = categories.find(cat => cat.code === selectedCategory);

// AFTER
const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
```

#### 3.4 Member Management Components
**Files**: All member management components
```typescript
// BEFORE
acc[category.code] = category.name;

// AFTER
acc[category.id] = category.name;
```

### Step 4: Update Utility Functions

#### 4.1 Member Helpers
**File**: `src/app/admin/members/helpers/memberHelpers.ts`
```typescript
// BEFORE
export const getCategoryBadgeColor = (category: string, categoriesData: Category[] | null) => {
  const categoryData = categoriesData.find(cat => cat.code === category);
  // ...
};

// AFTER
export const getCategoryBadgeColor = (categoryId: string, categoriesData: Category[] | null) => {
  const categoryData = categoriesData.find(cat => cat.id === categoryId);
  // ...
};
```

#### 4.2 Category Page Data
**File**: `src/utils/categoryPageData.ts`
```typescript
// BEFORE
.eq('code', categorySlug)

// AFTER
.eq('slug', categorySlug)
```

### Step 5: Update Type Definitions

#### 5.1 Category Interface
**File**: `src/types/category.ts`
```typescript
export interface Category {
    id: string;
    code: string; // Keep for display purposes
    slug: string; // Add for URL routing
    name: string;
    // ... rest of fields
}
```

### Step 6: URL Structure Updates

#### 6.1 Route Definitions
**File**: `src/routes/routes.ts`
```typescript
// BEFORE
youngestKids: '/category/youngest-kids',
prepKids: '/category/prep-kids',
// ...

// AFTER - Use dynamic routing or update to use IDs
// Consider using /category/[id] pattern
```

## 🔧 Implementation Order

### Week 1: Foundation
1. ✅ Database schema updates
2. ✅ Create migration scripts
3. ✅ Update core hooks and utilities

### Week 2: Core Components
1. ✅ Update category page routing
2. ✅ Modify matches page filtering
3. ✅ Update club selector component

### Week 3: Admin Interface
1. ✅ Update member management components
2. ✅ Modify category management interface
3. ✅ Update user roles interface

### Week 4: Testing & Cleanup
1. ✅ Comprehensive testing
2. ✅ Performance optimization
3. ✅ Documentation updates
4. ✅ Remove deprecated code

## ⚠️ Risk Mitigation

### Backward Compatibility
- Maintain `code` field in database during transition
- Create mapping functions for gradual migration
- Implement feature flags for new vs old logic

### Data Integrity
- Create comprehensive backup before migration
- Implement rollback procedures
- Test migration scripts on staging environment

### Performance Considerations
- Add proper database indexes
- Optimize queries for ID-based lookups
- Monitor performance during migration

## 🧪 Testing Strategy

### Unit Tests
- Test all updated hooks and utilities
- Verify category lookup functions
- Test data transformation logic

### Integration Tests
- Test category page routing
- Verify matches filtering functionality
- Test admin interface updates

### End-to-End Tests
- Test complete user workflows
- Verify URL handling and navigation
- Test data consistency across components

## 📈 Success Criteria

### Functional Requirements
- ✅ All category-related functionality works with IDs
- ✅ URL routing functions correctly
- ✅ Admin interface operates properly
- ✅ No data loss during migration

### Performance Requirements
- ✅ Page load times remain consistent
- ✅ Database queries are optimized
- ✅ No memory leaks or performance degradation

### User Experience
- ✅ Seamless transition for end users
- ✅ No broken links or navigation issues
- ✅ Consistent behavior across all pages

## 🗂️ File-by-File Migration Checklist

### High Priority Files
- [ ] `src/app/(main)/categories/[slug]/page.tsx`
- [ ] `src/hooks/useFetchMatches.ts`
- [ ] `src/utils/categoryPageData.ts`
- [ ] `src/app/(main)/matches/page.tsx`

### Medium Priority Files
- [ ] `src/app/(main)/matches/components/ClubSelector.tsx`
- [ ] `src/components/match/MatchSchedule.tsx`
- [ ] `src/app/admin/members/helpers/memberHelpers.ts`

### Low Priority Files
- [ ] `src/app/admin/members/components/MembersListTab.tsx`
- [ ] `src/app/admin/members/components/MemberFormModal.tsx`
- [ ] `src/app/admin/members/components/BulkEditModal.tsx`
- [ ] `src/app/admin/members/components/MembersStatisticTab.tsx`
- [ ] `src/app/admin/user-roles/page.tsx`
- [ ] `src/app/admin/categories/page.tsx`
- [ ] `src/app/(main)/matches/[id]/page.tsx`
- [ ] `src/hooks/useFetchMatch.ts`

## 🎯 Quick Start Commands

### 1. Database Migration
```sql
-- Run in Supabase SQL Editor
ALTER TABLE categories ADD COLUMN slug VARCHAR(50) UNIQUE;
UPDATE categories SET slug = code WHERE slug IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
```

### 2. Test Migration
```bash
# Run tests to verify migration
npm run test
npm run build
```

### 3. Deploy Changes
```bash
# Deploy to staging first
npm run deploy:staging

# After testing, deploy to production
npm run deploy:production
```

## 📚 Additional Resources

- [Database Schema Documentation](docs/buildingAppDocs/DATABASE_TABLES_OVERVIEW.md)
- [Category System Troubleshooting](docs/buildingAppDocs/CATEGORY_SYSTEM_TROUBLESHOOTING.md)
- [Generic Category System](docs/buildingAppDocs/GENERIC_CATEGORY_SYSTEM.md)

## 🤝 Support

If you encounter issues during migration:
1. Check the troubleshooting guide
2. Review the database schema documentation
3. Test changes in staging environment first
4. Create backup before making changes

---

**Note**: This migration will modernize the category system by using proper UUID identifiers instead of string codes, improving data integrity, performance, and maintainability. The phased approach ensures minimal disruption to users while providing a clear path to completion.
