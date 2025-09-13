# Team Suffix Logic Documentation

This document explains how the team suffix system works in the application, including when and how suffixes are displayed for team names.

## 🎯 Overview

The team suffix system displays suffixes (like "A", "B", "C") for teams only when a club has **multiple teams in the same category**. This prevents confusion when clubs have only one team in a category while still providing clarity when they have multiple teams.

## 🔧 How It Works

### Core Logic
```typescript
// Only show suffix if club has more than 1 team in the category
const shouldShowSuffix = teamCount > 1;

// Display logic
if (shouldShowSuffix && teamSuffix) {
  return `${clubName} ${teamSuffix}`;  // "TJ Sokol Svinov A"
} else {
  return clubName;  // "TJ Sokol Svinov"
}
```

### Example Scenarios

| Club | Teams in Category | Team Suffix | Display Name |
|------|------------------|-------------|--------------|
| TJ Sokol Svinov | 1 | "A" | "TJ Sokol Svinov" |
| TJ Sokol Svinov | 2 | "A" | "TJ Sokol Svinov A" |
| TJ Sokol Svinov | 2 | "B" | "TJ Sokol Svinov B" |
| SK Studénka | 1 | "A" | "SK Studénka" |
| SK Studénka | 3 | "A" | "SK Studénka A" |
| SK Studénka | 3 | "B" | "SK Studénka B" |
| SK Studénka | 3 | "C" | "SK Studénka C" |

## 🏗️ Implementation Details

### 1. Core Functions (`src/utils/teamDisplay.ts`)

#### `getTeamSuffixLogic(teamCount: number)`
```typescript
export function getTeamSuffixLogic(teamCount: number): TeamDisplayInfo {
  const shouldShowSuffix = teamCount > 1;
  return {
    shouldShowSuffix,
    teamCount,
  };
}
```

#### `getTeamDisplayName(clubName, teamSuffix, teamCount)`
```typescript
export function getTeamDisplayName(
  clubName: string,
  teamSuffix: string,
  teamCount: number
): string {
  const {shouldShowSuffix} = getTeamSuffixLogic(teamCount);
  
  if (shouldShowSuffix && teamSuffix) {
    return `${clubName} ${teamSuffix}`;
  }
  
  return clubName;
}
```

#### `getTeamDisplayNameSafe(clubName?, teamSuffix?, teamCount, fallbackName)`
```typescript
export function getTeamDisplayNameSafe(
  clubName?: string,
  teamSuffix?: string,
  teamCount: number = 1,
  fallbackName: string = 'Neznámý tým'
): string {
  if (!clubName) {
    return fallbackName;
  }
  
  const {shouldShowSuffix} = getTeamSuffixLogic(teamCount);
  
  if (shouldShowSuffix && teamSuffix) {
    return `${clubName} ${teamSuffix}`;
  }
  
  return clubName;
}
```

### 2. Team Counting (`src/services/optimizedMatchQueries.ts`)

#### `getClubTeamCounts(categoryId, seasonId)`
```typescript
export async function getClubTeamCounts(
  categoryId: string, 
  seasonId: string
): Promise<Map<string, number>> {
  // Queries club_category_teams to count teams per club in a category/season
  // Returns Map<clubId, teamCount>
}
```

### 3. Data Transformation (`src/utils/teamDisplay.ts`)

#### `transformMatchWithTeamNames(match, allMatches, options)`
```typescript
export function transformMatchWithTeamNames(
  match: any,
  allMatches: any[] = [],
  options: {
    useTeamMap?: boolean;
    teamMap?: Map<string, any>;
    teamDetails?: any[];
    clubTeamCounts?: Map<string, number>; // Key for suffix logic
  } = {}
): any {
  // Uses clubTeamCounts to determine team display names
  const homeTeamName = getTeamDisplayNameSafe(
    homeTeamDetails?.club_category?.club?.name,
    homeTeamDetails?.team_suffix || 'A',
    finalClubTeamCounts.get(homeClubId || '') || 1,
    'Home team'
  );
}
```

## 🔄 Integration Points

### 1. Query Builder (`src/utils/matchQueryBuilder.ts`)
```typescript
// In execute() method
if (this.options.includeTeamDetails) {
  let clubTeamCounts = new Map<string, number>();
  if (this.options.categoryId && this.options.seasonId) {
    clubTeamCounts = await getClubTeamCounts(
      this.options.categoryId,
      this.options.seasonId
    );
  }
  
  matches = matches.map((match: any) =>
    transformMatchWithTeamNames(match, matches, {
      clubTeamCounts: clubTeamCounts, // Pass team counts
    })
  );
}
```

### 2. Optimized Queries (`src/services/optimizedMatchQueries.ts`)
```typescript
// In getMatchesWithTeamsOptimized
let clubTeamCounts = new Map<string, number>();
if (options.categoryId && options.seasonId) {
  clubTeamCounts = await getClubTeamCounts(options.categoryId, options.seasonId);
}

const transformedMatches = matches.map((match: any) => 
  transformMatchWithTeamNames(match, matches, {
    clubTeamCounts: clubTeamCounts
  })
);
```

### 3. React Hooks
```typescript
// usePublicMatches, useOwnClubMatches, etc.
const query = createMatchQuery({
  categoryId: categoryId,
  seasonId: seasonId, // Required for suffix logic!
  includeTeamDetails: true,
});
```

## ⚠️ Common Issues

### 1. Missing `seasonId`
**Problem**: Suffixes not showing because `seasonId` is not provided to the query builder.

**Solution**: Always pass both `categoryId` and `seasonId` when using `includeTeamDetails: true`.

```typescript
// ❌ Wrong - no seasonId
const query = createMatchQuery({
  categoryId: 'cat-123',
  includeTeamDetails: true,
});

// ✅ Correct - with seasonId
const query = createMatchQuery({
  categoryId: 'cat-123',
  seasonId: 'season-456',
  includeTeamDetails: true,
});
```

### 2. Missing `clubTeamCounts`
**Problem**: Team counts not being calculated or passed to transformation.

**Solution**: Ensure `getClubTeamCounts()` is called and passed to `transformMatchWithTeamNames()`.

### 3. Incorrect Team Count Calculation
**Problem**: Team counts are calculated incorrectly, leading to wrong suffix display.

**Solution**: Verify that team counting logic uses the correct category and season filters.

## 🧪 Testing the Suffix Logic

### 1. Test Data Setup
Create test data with:
- Club A: 1 team in Category X
- Club B: 2 teams in Category X  
- Club C: 3 teams in Category X

### 2. Expected Results
- Club A: "Club A" (no suffix)
- Club B: "Club B A", "Club B B" (with suffixes)
- Club C: "Club C A", "Club C B", "Club C C" (with suffixes)

### 3. Debug Information
```typescript
// Add debug logging to see team counts
console.log('Club team counts:', Object.fromEntries(clubTeamCounts));
console.log('Team details:', teamDetails);
```

## 📋 Usage Checklist

### For New Components
- [ ] Pass both `categoryId` and `seasonId` to query
- [ ] Set `includeTeamDetails: true`
- [ ] Use `transformMatchWithTeamNames()` for data transformation
- [ ] Pass `clubTeamCounts` to transformation function

### For Existing Components
- [ ] Verify `seasonId` is being passed to queries
- [ ] Check that `getClubTeamCounts()` is being called
- [ ] Ensure `clubTeamCounts` is passed to transformation
- [ ] Test with clubs that have multiple teams

### For Database Queries
- [ ] Include `team_suffix` in team data
- [ ] Include club information in team data
- [ ] Ensure category and season filters are applied
- [ ] Test with materialized views if using optimized queries

## 🔍 Debugging

### 1. Check Team Counts
```typescript
console.log('Club team counts:', Object.fromEntries(clubTeamCounts));
```

### 2. Check Team Details
```typescript
console.log('Team details:', teamDetails);
console.log('Match data:', match);
```

### 3. Check Transformation
```typescript
console.log('Before transformation:', match.home_team);
console.log('After transformation:', transformedMatch.home_team);
```

### 4. Verify Query Parameters
```typescript
console.log('Query options:', {
  categoryId: this.options.categoryId,
  seasonId: this.options.seasonId,
  includeTeamDetails: this.options.includeTeamDetails
});
```

## 🎯 Best Practices

### 1. Always Provide Required Parameters
```typescript
// Always include both categoryId and seasonId for suffix logic
const query = createMatchQuery({
  categoryId: categoryId,
  seasonId: seasonId,
  includeTeamDetails: true,
});
```

### 2. Use Centralized Functions
```typescript
// Use the centralized transformation function
const transformedMatch = transformMatchWithTeamNames(match, allMatches, {
  clubTeamCounts: clubTeamCounts
});
```

### 3. Handle Edge Cases
```typescript
// Provide fallbacks for missing data
const teamName = getTeamDisplayNameSafe(
  team?.club_category?.club?.name,
  team?.team_suffix || 'A',
  clubTeamCounts.get(team?.club_category?.club?.id) || 1,
  'Neznámý tým'
);
```

### 4. Test Thoroughly
- Test with single-team clubs
- Test with multi-team clubs
- Test with missing data
- Test with different categories and seasons

## 📈 Performance Considerations

### 1. Cache Team Counts
```typescript
// Team counts are cached for 5 minutes
const clubTeamCounts = await getClubTeamCounts(categoryId, seasonId);
```

### 2. Batch Queries
```typescript
// Use batch queries when possible
const results = await getMatchesBatchOptimized([
  { type: 'seasonal', options: { categoryId, seasonId } },
  { type: 'ownClub', options: { categoryId, seasonId } }
]);
```

### 3. Use Optimized Queries
```typescript
// Use optimized queries for better performance
const matches = await getMatchesWithTeamsOptimized({
  categoryId,
  seasonId,
  includeTeamDetails: true
});
```

---

This documentation provides a complete guide to understanding and implementing the team suffix logic system. For specific implementation details, refer to the source files mentioned in each section.
