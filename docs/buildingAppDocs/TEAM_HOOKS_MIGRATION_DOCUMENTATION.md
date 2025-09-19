# Team Hooks Migration Documentation

## Overview

This document describes the migration of team-related hooks during the removal of the `teams` table from the database. The hooks were initially removed as part of the cleanup process, but were later restored to maintain compatibility with existing code that depends on them.

## Background

As part of the database restructuring, the `teams` table was removed in favor of the more flexible `club_category_teams` structure. This change required updating all team-related functionality throughout the application.

## Hooks Affected

### 1. `useTeams.ts`

**Purpose**: Fetches and manages team data from the database.

**Original Implementation**: Used the old `teams` table with direct Supabase queries.

**New Implementation**: 
- Now uses `club_category_teams` table
- Maintains the same interface for backward compatibility
- Uses React Query for data fetching and caching
- Returns `teams`, `loading`, `error`, `refetch`, and `fetchTeams` (legacy compatibility)

**Files Using This Hook**:
- `src/app/admin/matches/page.tsx` - Uses `fetchTeams` for team data fetching
- `src/app/coaches/matches/page.tsx` - Uses `teams` array for match management
- `src/components/match/MatchRow.tsx` - Uses team data for display
- `src/hooks/useFilteredTeams.ts` - Depends on this hook for team filtering

**Why It Was Removed Initially**: 
- The hook was tightly coupled to the old `teams` table structure
- Direct database queries needed to be updated to use `club_category_teams`

**Why It Was Restored**:
- Multiple components depend on this hook's interface
- The `admin/matches` page specifically requires the `fetchTeams` function
- Maintaining backward compatibility was crucial for the migration

### 2. `useFilteredTeams.ts`

**Purpose**: Provides filtered team data based on category and season.

**Original Implementation**: Filtered teams from the `teams` table based on category and season.

**New Implementation**:
- Now works with `club_category_teams` structure
- Accepts both string parameters and options object for flexibility
- Returns filtered teams with legacy compatibility methods
- Includes `clearTeams` function for resetting team data

**Files Using This Hook**:
- `src/app/admin/matches/page.tsx` - Uses `filteredTeams`, `fetchFilteredTeams`, and `clearTeams`
- `src/app/coaches/matches/page.tsx` - Uses filtered team data for match management

**Why It Was Removed Initially**:
- Direct dependency on the old `teams` table structure
- Filtering logic needed to be updated for the new table structure

**Why It Was Restored**:
- Critical for the admin matches page functionality
- The `clearTeams` function is specifically required by the admin interface
- Maintains the same filtering interface that existing code expects

### 3. `useTeamDisplayLogic.ts`

**Purpose**: Provides utility functions for team display and manipulation.

**Original Implementation**: Utility functions for team display names, sorting, and grouping.

**New Implementation**:
- Updated to work with the new team structure
- Added legacy compatibility properties (`teamCounts`, `loading`, `fetchTeamCounts`)
- Accepts optional `selectedCategory` parameter for backward compatibility
- Updated Team interface to include `category_id` and `season_id` properties

**Files Using This Hook**:
- `src/app/admin/matches/page.tsx` - Uses `teamCounts`, `loading`, and `fetchTeamCounts`
- `src/components/match/MatchRow.tsx` - Uses team display functions
- `src/hooks/useFilteredTeams.ts` - Depends on team display utilities

**Why It Was Removed Initially**:
- Utility functions were designed for the old team structure
- Team interface needed to be updated for the new structure

**Why It Was Restored**:
- Essential for team display functionality throughout the application
- The admin matches page requires specific properties like `teamCounts`
- Utility functions are used by multiple components

### 4. `useTeamClub.ts`

**Purpose**: Manages team-club relationships and provides club information for teams.

**Original Implementation**: Fetched club information for a given team ID.

**New Implementation**:
- Updated to work with `club_category_teams` structure
- Simplified interface to accept `teamId` as a string parameter
- Returns `clubId`, `isOwnClub`, `teamClub`, `loading`, `error`, and `refetch`

**Files Using This Hook**:
- `src/app/admin/matches/page.tsx` - Uses `clubId` and `isOwnClub` for match management
- `src/components/match/EditMatchModal.tsx` - Uses team-club relationship data

**Why It Was Removed Initially**:
- Direct dependency on the old team structure
- Club relationship logic needed to be updated for the new structure

**Why It Was Restored**:
- Critical for match management functionality
- The `EditMatchModal` component specifically requires this hook
- Team-club relationships are essential for the application's core functionality

## Migration Strategy

### Phase 1: Initial Removal
1. **Database Migration**: Removed `teams` and `team_categories` tables
2. **Code Cleanup**: Removed admin pages and navigation items
3. **Hook Removal**: Deleted all team-related hook files
4. **Export Cleanup**: Removed hook exports from `src/hooks/index.ts`

### Phase 2: Restoration and Adaptation
1. **Hook Recreation**: Recreated all team-related hooks with new implementations
2. **Interface Updates**: Updated hooks to work with `club_category_teams` structure
3. **Legacy Compatibility**: Added backward compatibility methods and properties
4. **Export Restoration**: Re-added hook exports to `src/hooks/index.ts`

### Phase 3: Compatibility Fixes
1. **Parameter Updates**: Updated hook signatures to accept expected parameters
2. **Property Additions**: Added missing properties required by existing code
3. **Type Fixes**: Updated TypeScript interfaces to match expected types
4. **Build Verification**: Ensured all hooks work correctly with existing code

## Key Changes Made

### Database Structure
- **Old**: `teams` table with direct team records
- **New**: `club_category_teams` table with team-club-category relationships

### Hook Interfaces
- **Maintained**: All existing hook interfaces for backward compatibility
- **Added**: Legacy compatibility methods and properties
- **Updated**: Internal implementations to use new database structure

### Type Definitions
- **Updated**: Team interface to include new properties
- **Added**: Optional properties for backward compatibility
- **Maintained**: Existing type contracts for dependent code

## Benefits of This Approach

1. **Zero Breaking Changes**: Existing code continues to work without modification
2. **Gradual Migration**: Components can be updated individually over time
3. **Backward Compatibility**: Legacy methods are preserved for existing functionality
4. **Modern Architecture**: New implementations use React Query and modern patterns
5. **Maintainability**: Clean separation between old and new functionality

## Future Considerations

1. **Gradual Refactoring**: Components can be updated to use new hook interfaces over time
2. **Legacy Method Removal**: Old compatibility methods can be removed in future versions
3. **Performance Optimization**: New implementations can be optimized without breaking existing code
4. **Type Safety**: TypeScript interfaces can be gradually updated to be more strict

## Conclusion

The team hooks migration successfully maintained backward compatibility while updating the underlying implementation to use the new `club_category_teams` structure. This approach ensured a smooth transition without breaking existing functionality, while providing a foundation for future improvements and optimizations.

The restoration of these hooks was necessary because:
- Multiple components depend on their specific interfaces
- The admin matches page requires specific methods and properties
- Team-club relationships are essential for core functionality
- Maintaining backward compatibility was crucial for the migration success

This migration strategy demonstrates how to handle complex database restructuring while maintaining application stability and user experience.
