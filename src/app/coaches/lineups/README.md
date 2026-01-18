# Coaches Lineups Page

Team roster management for coaches - create lineups and manage team members.

## Overview

This page allows coaches to:
- Create and manage lineups (team rosters) for their categories
- Add/remove members to/from lineups
- Assign positions (goalkeeper/field player)
- Set jersey numbers
- Designate captains and vice-captains

## Status

⚠️ **Currently Under Refactoring**

- **Critical Bugs:** 3 (see [REFACTORING_ANALYSIS.md](./REFACTORING_ANALYSIS.md))
- **Lines of Code:** 512 (Target: <250)
- **TypeScript Errors:** 3

## Quick Links

- 📋 **[Full Analysis & Refactoring Plan](./REFACTORING_ANALYSIS.md)** - Detailed issues and solutions
- 🐛 **[Critical Bugs](./REFACTORING_ANALYSIS.md#-critical-bugs-must-fix-immediately)** - Must fix before release
- 🏗️ **[Architecture Issues](./REFACTORING_ANALYSIS.md#-architectural-issues)** - Code organization improvements
- 📝 **[Implementation Checklist](./REFACTORING_ANALYSIS.md#-implementation-checklist)** - Step-by-step tasks

## Structure

```
src/app/coaches/lineups/
├── page.tsx.backup                           # Main page component (512 lines)
├── components/
│   ├── AddMemberModal.tsx            # Modal for adding members to lineup
│   ├── CreateMemberModal.tsx         # Modal for creating new members
│   ├── LineupModal.tsx               # Modal for creating/editing lineups
│   └── index.ts                      # Component exports
├── helpers/
│   └── helpers.ts                    # Position color/text helpers
├── REFACTORING_ANALYSIS.md           # Detailed refactoring plan
└── README.md                         # This file
```

## Key Features

### Lineup Management
- Create new lineups with name and description
- Edit existing lineup details
- Delete lineups
- Filter by category and season

### Member Management
- Add existing members to lineups
- Create new members on-the-fly
- Set position (goalkeeper/field player)
- Assign jersey numbers (1-99)
- Mark as captain or vice-captain
- Remove members from lineups

## Data Flow

```
User Action
    ↓
Handler Function (page.tsx.backup)
    ↓
Hook (useCategoryLineups, useCategoryLineupMember)
    ↓
API Route (/api/categories/[id]/lineups/...)
    ↓
Supabase Database (category_lineups, category_lineup_members)
    ↓
Response & UI Update
```

## Current Hooks Used

### Data Layer (Fetching)
- `useFetchCategories()` - Get all categories
- `useFetchCategoryLineups(categoryId, seasonId)` - Get lineups for category/season
- `useFetchCategoryLineupMembers(categoryId, lineupId)` - Get members in a lineup
- `useFetchMembers()` - Get all members (used in AddMemberModal)

### State Layer (Form Management)
- `useCategoryLineupForm()` - Manage lineup form state and validation

### Business Layer (CRUD Operations)
- `useCategoryLineups()` - Create/update/delete lineups
- `useCategoryLineupMember()` - Create/update members in lineups

### Other
- `useSeasons()` - Get seasons list
- `useUserRoles()` - Get user's assigned categories

## Known Issues

### 🔴 Critical (Blocks Functionality)
1. **Edit lineup broken** - `setLineupFormData` not defined (line 148)
2. **Remove member broken** - `removeMemberFromLineup` not defined (line 173)
3. **TypeScript errors** - 2 `any` types, missing function definitions

### 🟡 Important (Needs Attention)
1. **Mixed hook architecture** - Using old and new patterns inconsistently
2. **Component too large** - 512 lines, should be <250
3. **Missing edit member UI** - Function exists but no modal wired up
4. **useEffect dependency warnings** - May cause re-render issues

### 🟢 Nice to Have
1. **Better error handling** - Add error boundaries and user feedback
2. **Optimistic updates** - Update UI before server response
3. **Component extraction** - Split into smaller, reusable components

## API Endpoints

### Lineups
- `GET /api/categories/[id]/lineups` - List lineups
- `POST /api/categories/[id]/lineups` - Create lineup
- `GET /api/categories/[id]/lineups/[lineupId]` - Get lineup
- `PATCH /api/categories/[id]/lineups/[lineupId]` - Update lineup
- `DELETE /api/categories/[id]/lineups/[lineupId]` - Delete lineup

### Lineup Members
- `GET /api/categories/[id]/lineups/[lineupId]/members` - List members
- `POST /api/categories/[id]/lineups/[lineupId]/members` - Add member
- `PATCH /api/categories/[id]/lineups/[lineupId]/members/[memberId]` - Update member
- `DELETE /api/categories/[id]/lineups/[lineupId]/members/[memberId]` - Remove member

## Before Making Changes

1. **Read the refactoring analysis** - [REFACTORING_ANALYSIS.md](./REFACTORING_ANALYSIS.md)
2. **Check for critical bugs** - Fix these first before adding features
3. **Follow hook architecture** - Use data → business → state → UI layers
4. **Test thoroughly** - All CRUD operations for lineups and members

## Testing Checklist

- [ ] Create a new lineup
- [ ] Edit an existing lineup
- [ ] Delete a lineup
- [ ] Add a member to lineup
- [ ] Edit a member in lineup (currently not working)
- [ ] Remove a member from lineup (currently broken)
- [ ] Assign jersey number
- [ ] Mark member as captain/vice-captain
- [ ] Switch between categories
- [ ] Switch between seasons

## Performance Considerations

- Lineups and members are fetched separately (may cause loading states)
- Member list is filtered client-side in AddMemberModal
- No virtualization for large member lists (may be slow with 100+ members)

## Accessibility

- All modals have proper ARIA labels
- Buttons have descriptive text or aria-label
- Table has proper semantic structure
- Responsive design works on mobile

## Related Pages

- `/coaches/attendance` - Similar structure, shares patterns
- `/coaches/matches` - Uses lineup data for match day

## Contributing

When working on this page:
1. Fix critical bugs first (see analysis doc)
2. Follow the refactoring roadmap phases
3. Extract components as you go
4. Add TypeScript types (no `any`)
5. Write tests for new code
6. Update this README

---

**Last Updated:** 2025-11-06
**Maintainer:** TBD
**Status:** 🔴 Needs immediate attention
