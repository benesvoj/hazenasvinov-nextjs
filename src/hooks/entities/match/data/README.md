# Match Data Hooks

This folder contains hooks responsible for **data fetching** from the database or API.

## Purpose
These hooks handle the direct communication with data sources (Supabase, APIs) to retrieve match-related information.

## Hooks

### Core Data Fetching
- **`useFetchMatches`** - Fetch multiple matches with filtering options
- **`useFetchMatch`** - Fetch a single match by ID
- **`useAllCategoriesMatches`** - Fetch matches across all categories
- **`useAllCategoriesOwnClubMatches`** - Fetch own club matches across all categories

### Specialized Data Fetching
- **`useOwnClubMatches`** - Fetch matches where our club is playing
- **`usePublicMatches`** - Fetch public-facing matches
- **`useFetchMatchPosts`** - Fetch blog posts related to matches
- **`useFetchMatchVideos`** - Fetch videos related to matches
- **`useFetchVideoMatch`** - Fetch match data for video pages

## Usage Pattern
```typescript
import { useFetchMatches, useOwnClubMatches } from '@/hooks';

// Basic usage
const { data: matches, loading, error } = useFetchMatches({
  categoryId: 'category-123',
  seasonId: 'season-456',
  ownClubOnly: true
});

// Own club matches
const { data: ownMatches } = useOwnClubMatches('category-123', 'season-456');
```

## Key Features
- ✅ Direct database queries
- ✅ Filtering and pagination support
- ✅ Error handling
- ✅ Loading states
- ✅ TypeScript support
