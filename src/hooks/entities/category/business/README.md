# Category Business Logic Hooks

This folder contains hooks responsible for **business logic** and **domain-specific operations** related to categories.

## Purpose
These hooks implement complex business rules, calculations, and domain-specific logic that goes beyond simple data fetching.

## Hooks

### Business Logic
- **`useCategoryLineups`** - Manage lineups and team compositions for categories
- **`useCategoryPageData`** - Generate comprehensive page data for category pages

## Usage Pattern
```typescript
import { useCategoryLineups, useCategoryPageData } from '@/hooks';

// Manage category lineups
const {
  lineups,
  createLineup,
  updateLineup,
  deleteLineup,
  isLoading
} = useCategoryLineups(categoryId);

// Get comprehensive category page data
const {
  categoryData,
  matches,
  standings,
  players,
  isLoading: pageLoading
} = useCategoryPageData(categoryId, seasonId);
```

## Key Features
- ✅ Complex lineup management
- ✅ Business rule implementation
- ✅ Domain-specific logic
- ✅ Cross-entity operations
- ✅ Data aggregation
- ✅ Page data composition
