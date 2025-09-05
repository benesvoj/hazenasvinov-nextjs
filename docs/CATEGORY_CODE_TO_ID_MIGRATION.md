# Category Code to ID Migration Plan

This document outlines the comprehensive plan to migrate from using `category.code` as the unique identifier to using `category.id` throughout the application.

## Current State Analysis

### Database Schema
- **Categories table** has both `id` (UUID) and `code` (VARCHAR) fields
- **Current usage**: `code` is used as the primary identifier in URLs, filtering, and component logic
- **Target state**: Use `id` as the primary identifier while maintaining `code` for display purposes

### Current Category Codes
The following category codes are currently used in the system:
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

## Migration Strategy

### Phase 1: Database Preparation
1. **Add slug field to categories table** for URL-friendly identifiers
2. **Create mapping table** for code-to-id migration
3. **Update foreign key references** to use category_id consistently

### Phase 2: Backend API Updates
1. **Update all database queries** to use category_id instead of code
2. **Modify hooks and utilities** to work with IDs
3. **Update data transformation functions**

### Phase 3: Frontend Component Updates
1. **Update URL routing** to use category IDs or slugs
2. **Modify component props and state management**
3. **Update filtering and selection logic**

### Phase 4: Testing and Cleanup
1. **Comprehensive testing** of all category-related functionality
2. **Remove deprecated code references**
3. **Update documentation**

## Detailed Migration Steps

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

### Step 2: Update Database Queries and Hooks

#### 2.1 Update useCategories hook
**File**: `src/hooks/useCategories.ts`
- Remove `code` from SELECT queries
- Update to use `id` and `slug` instead
- Maintain backward compatibility during transition

#### 2.2 Update useFetchMatches hook
**File**: `src/hooks/useFetchMatches.ts`
- Change parameter from `categorySlug` to `categoryId`
- Update database queries to use `category_id` directly
- Remove code-to-id lookup logic

#### 2.3 Update useFetchMatch hook
**File**: `src/hooks/useFetchMatch.ts`
- Remove category code references
- Use category_id directly in queries

### Step 3: Update Component Logic

#### 3.1 Category Page Routing
**File**: `src/app/(main)/categories/[slug]/page.tsx`
- Change from slug-based to ID-based routing
- Update category lookup logic
- Modify URL structure if needed

#### 3.2 Matches Page Filtering
**File**: `src/app/(main)/matches/page.tsx`
- Update category selection logic
- Change URL parameter handling
- Modify filtering functions

#### 3.3 Club Selector Component
**File**: `src/app/(main)/matches/components/ClubSelector.tsx`
- Update category filtering logic
- Change from code-based to ID-based filtering

#### 3.4 Member Management Components
**Files**: 
- `src/app/admin/members/components/MembersListTab.tsx`
- `src/app/admin/members/components/MemberFormModal.tsx`
- `src/app/admin/members/components/BulkEditModal.tsx`
- `src/app/admin/members/helpers/memberHelpers.ts`

- Update category selection and filtering
- Change from code-based to ID-based logic

### Step 4: Update Utility Functions

#### 4.1 Member Helpers
**File**: `src/app/admin/members/helpers/memberHelpers.ts`
- Update `getCategoryBadgeColor` function
- Modify `convertCategoriesToRecord` function
- Update `createCategoryNameToCodeMap` function

#### 4.2 Category Info Helper
**File**: `src/helpers/getCategoryInfo.ts`
- Update to work with category IDs
- Modify function signature and logic

### Step 5: Update Type Definitions

#### 5.1 Category Interface
**File**: `src/types/category.ts`
- Keep `code` field for display purposes
- Add `slug` field for URL routing
- Update documentation

#### 5.2 Update Related Types
- Update any interfaces that reference category codes
- Ensure type safety throughout migration

### Step 6: URL Structure Updates

#### 6.1 Route Definitions
**File**: `src/routes/routes.ts`
- Update hardcoded category routes
- Change from code-based to ID-based URLs

#### 6.2 Dynamic Routes
**File**: `src/routes/dynamicRoutes.ts`
- Update dynamic route generation
- Modify category-based navigation

### Step 7: Admin Interface Updates

#### 7.1 Category Management
**File**: `src/app/admin/categories/page.tsx`
- Update category display logic
- Modify form handling
- Update table columns

#### 7.2 User Roles
**File**: `src/app/admin/user-roles/page.tsx`
- Update category assignment logic
- Modify display of category information

## Implementation Order

### Phase 1: Foundation (Week 1)
1. Database schema updates
2. Create migration scripts
3. Update core hooks and utilities

### Phase 2: Core Components (Week 2)
1. Update category page routing
2. Modify matches page filtering
3. Update club selector component

### Phase 3: Admin Interface (Week 3)
1. Update member management components
2. Modify category management interface
3. Update user roles interface

### Phase 4: Testing & Cleanup (Week 4)
1. Comprehensive testing
2. Performance optimization
3. Documentation updates
4. Remove deprecated code

## Risk Mitigation

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

## Testing Strategy

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

## Rollback Plan

### Immediate Rollback
- Revert database changes using migration scripts
- Restore previous code version
- Clear any cached data

### Data Recovery
- Restore from database backup
- Re-run data migration scripts
- Verify data integrity

## Success Criteria

### Functional Requirements
- All category-related functionality works with IDs
- URL routing functions correctly
- Admin interface operates properly
- No data loss during migration

### Performance Requirements
- Page load times remain consistent
- Database queries are optimized
- No memory leaks or performance degradation

### User Experience
- Seamless transition for end users
- No broken links or navigation issues
- Consistent behavior across all pages

## Post-Migration Tasks

### Cleanup
- Remove deprecated code references
- Clean up unused database fields
- Update documentation

### Monitoring
- Monitor system performance
- Track any issues or errors
- Collect user feedback

### Optimization
- Optimize database queries
- Improve caching strategies
- Enhance error handling

## Timeline

- **Week 1**: Database and core infrastructure updates
- **Week 2**: Frontend component migration
- **Week 3**: Admin interface updates
- **Week 4**: Testing, cleanup, and deployment

## Resources Required

### Development
- 1 Senior Developer (full-time)
- 1 QA Engineer (part-time)
- 1 DevOps Engineer (as needed)

### Infrastructure
- Staging environment for testing
- Database backup and recovery tools
- Performance monitoring tools

## Conclusion

This migration will modernize the category system by using proper UUID identifiers instead of string codes, improving data integrity, performance, and maintainability. The phased approach ensures minimal disruption to users while providing a clear path to completion.

The migration should be executed carefully with proper testing at each phase to ensure a smooth transition and maintain system stability.
