# Match Business Logic Hooks

This folder contains hooks responsible for **business logic** and **domain-specific operations** related to matches.

## Purpose
These hooks implement complex business rules, calculations, and domain-specific logic that goes beyond simple data fetching.

## Hooks

### Business Logic
- **`useHeadToHeadMatches`** - Calculate and fetch head-to-head match statistics between teams
- **`useMatchMetadata`** - Generate metadata and statistics for matches

## Usage Pattern
```typescript
import { useHeadToHeadMatches, useMatchMetadata } from '@/hooks';

// Head-to-head analysis
const { data: headToHead, isLoading } = useHeadToHeadMatches({
  categoryId: 'category-123',
  opponentTeamId: 'team-456',
  ownClubTeamId: 'team-789',
  limit: 10
});

// Match metadata and statistics
const { data: metadata } = useMatchMetadata(matchId);
```

## Key Features
- ✅ Complex calculations
- ✅ Business rule implementation
- ✅ Domain-specific logic
- ✅ Statistical analysis
- ✅ Data transformation
- ✅ Cross-entity relationships
