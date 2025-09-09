# useFetchMatches Hook Usage Examples

This document shows how to use the refactored `useFetchMatches` hook for different use cases.

## Basic Usage

### 1. Public Page (Own Club Matches Only)

```tsx
// Show only matches where your club is playing
// Uses active season by default
const { matches, loading, error } = useFetchMatches('men');

// This is equivalent to:
const { matches, loading, error } = useFetchMatches('men', undefined, { ownClubOnly: true });
```

### 2. Admin Page (All Matches)

```tsx
// Show all matches for a specific season
const { matches, loading, error } = useFetchMatches(
  'men', 
  selectedSeasonId, 
  { ownClubOnly: false }
);
```

### 3. Custom Season with Own Club Filter

```tsx
// Show own club matches for a specific season
const { matches, loading, error } = useFetchMatches(
  'women', 
  'season-uuid-here', 
  { ownClubOnly: true }
);
```

## Complete Examples

### Public Matches Page

```tsx
import { useFetchMatches } from '@/hooks/useFetchMatches';

export default function MatchesPage() {
  const [selectedCategory, setSelectedCategory] = useState('men');
  
  // Public use: own club matches only, active season
  const { matches, loading, error } = useFetchMatches(selectedCategory);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Our Club Matches</h1>
      {/* Display matches */}
    </div>
  );
}
```

### Admin Matches Page

```tsx
import { useFetchMatches } from '@/hooks/useFetchMatches';

export default function AdminMatchesPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  
  // Admin use: all matches, specific season
  const { matches, loading, error } = useFetchMatches(
    selectedCategory, 
    selectedSeason, 
    { ownClubOnly: false }
  );
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>All Matches (Admin)</h1>
      {/* Display all matches for management */}
    </div>
  );
}
```

### Category Page with Custom Options

```tsx
import { useFetchMatches } from '@/hooks/useFetchMatches';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: categorySlug } = await params;
  
  // Custom use: own club matches, active season, with team details
  const { matches, loading, error } = useFetchMatches(
    categorySlug,
    undefined, // Use active season
    { 
      ownClubOnly: true,
      includeTeamDetails: true 
    }
  );
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Category: {categorySlug}</h1>
      {/* Display matches */}
    </div>
  );
}
```

## Options Reference

### `ownClubOnly`
- **Default**: `true`
- **Purpose**: Filter matches to show only those where your club is playing
- **Use Cases**:
  - `true`: Public pages, user dashboard
  - `false`: Admin pages, management interfaces

### `includeTeamDetails`
- **Default**: `true`
- **Purpose**: Include detailed team information (names, logos, club info)
- **Use Cases**:
  - `true`: Full match display, team information
  - `false`: Basic match list, performance optimization

### `seasonId`
- **Default**: `undefined` (uses active season)
- **Purpose**: Specify which season to fetch matches for
- **Use Cases**:
  - `undefined`: Public pages, current season
  - `'uuid'`: Admin pages, historical data, specific seasons

## Migration Guide

### From Old Hook Usage

**Before:**
```tsx
// Old way - always own club only, always active season
const { matches, loading, error } = useFetchMatches('men');
```

**After:**
```tsx
// New way - same behavior (backward compatible)
const { matches, loading, error } = useFetchMatches('men');

// Or explicit for clarity
const { matches, loading, error } = useFetchMatches('men', undefined, { ownClubOnly: true });
```

### Adding Admin Functionality

**Before:**
```tsx
// No way to show all matches
const { matches, loading, error } = useFetchMatches('men');
```

**After:**
```tsx
// Show all matches for admin
const { matches, loading, error } = useFetchMatches(
  'men', 
  selectedSeasonId, 
  { ownClubOnly: false }
);
```

## Performance Considerations

1. **Own Club Filtering**: When `ownClubOnly: true`, the hook fetches all matches and filters client-side. For large datasets, consider server-side filtering.

2. **Season Selection**: Always pass `seasonId` when you know it to avoid the extra query for active season.

3. **Team Details**: Set `includeTeamDetails: false` for basic lists to reduce data transfer.

## Error Handling

The hook provides comprehensive error information:

```tsx
const { matches, loading, error, debugInfo } = useFetchMatches('men');

if (error) {
  console.error('Match fetch error:', error.message);
  console.log('Debug info:', debugInfo);
  
  // Handle specific error types
  if (error.message.includes('Category not found')) {
    // Handle missing category
  } else if (error.message.includes('Season not found')) {
    // Handle missing season
  }
}
```
