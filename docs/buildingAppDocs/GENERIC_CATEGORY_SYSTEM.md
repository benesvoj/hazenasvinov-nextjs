# Generic Category System

This document describes the new generic, dynamic category page system that automatically adapts to different categories and shows seasonal matches.

## Overview

The new system replaces the static category pages with a dynamic, database-driven approach that:

- ✅ **Automatically adapts** to any category in the system
- ✅ **Shows standings table** for the active season
- ✅ **Displays seasonal matches** in Autumn/Spring tabs
- ✅ **Handles missing data gracefully** with helpful fallback messages
- ✅ **Uses consistent layout** across all categories

## How It Works

### 1. Dynamic Routing
- **URL Pattern**: `/categories/[slug]` (e.g., `/categories/men`, `/categories/women`)
- **Automatic Detection**: Category is identified by slug from the database
- **Fallback Support**: Shows helpful messages if category doesn't exist

### 2. Standings Table
- **Active Season**: Automatically shows data for the current active season
- **Real-time Data**: Updates automatically when matches are played
- **Graceful Fallback**: Shows helpful message if standings table doesn't exist yet

### 3. Seasonal Matches
- **Autumn Tab (Podzim)**: Shows matches from September-February
- **Spring Tab (Jaro)**: Shows matches from March-May
- **Smart Grouping**: Automatically categorizes matches by date
- **Status Indicators**: Shows match status (completed, upcoming, cancelled)

## Database Requirements

### Required Tables

#### `categories`
```sql
- id (UUID)
- code (VARCHAR) - e.g., 'men', 'women', 'junior-boys'
- name (VARCHAR) - e.g., 'Muži', 'Ženy', 'Dorostenci'
- description (TEXT)
- age_group (VARCHAR)
- gender (VARCHAR)
- route (VARCHAR) - e.g., '/categories/men'
- is_active (BOOLEAN)
```

#### `seasons`
```sql
- id (UUID)
- name (VARCHAR) - e.g., '2024/2025'
- valid_from (TIMESTAMP)
- valid_to (TIMESTAMP)
- is_active (BOOLEAN)
```

#### `matches`
```sql
- id (UUID)
- match_date (TIMESTAMP)
- home_team (VARCHAR)
- away_team (VARCHAR)
- home_score (INTEGER)
- away_score (INTEGER)
- status (VARCHAR) - 'upcoming', 'completed', 'cancelled'
- competition (VARCHAR)
- season (UUID) - references seasons.id
- category_id (UUID) - references categories.id
```

#### `team_standings` (Optional)
```sql
- id (UUID)
- team_name (VARCHAR)
- matches_played (INTEGER)
- wins (INTEGER)
- draws (INTEGER)
- losses (INTEGER)
- goals_for (INTEGER)
- goals_against (INTEGER)
- points (INTEGER)
- position (INTEGER)
- category_id (UUID) - references categories.id
- season_id (UUID) - references seasons.id
```

## Usage

### 1. Create Categories
Add categories through the admin interface:
- Admin → Kategorie → Přidat kategorii
- Set the `code` field (e.g., 'men', 'women')
- Set the `route` field (e.g., '/categories/men')

### 2. Plan Matches
Add matches through the admin interface:
- Admin → Zápasy → Přidat zápas
- Select the category and season
- Set match date, teams, and competition

### 3. View Results
Visit any category page:
- `/categories/men` - Men's category
- `/categories/women` - Women's category
- `/categories/junior-boys` - Junior boys category

## Components

### `CategoryPage`
- Main page component that orchestrates everything
- Fetches category data and matches
- Renders standings and seasonal matches

### `CategoryStandings`
- Displays the standings table
- Shows team positions, points, and statistics
- Handles missing data gracefully

### `SeasonalMatches`
- Shows matches in Autumn/Spring tabs
- Automatically groups matches by date
- Displays match status and scores

### Fallback Components
- `CategoryStandingsFallback` - When standings table doesn't exist
- `SeasonalMatchesFallback` - When no matches are available

## Customization

### Adding New Categories
1. Create category in admin interface
2. Set appropriate code and route
3. Add matches for the category
4. Page automatically adapts

### Modifying Match Display
- Edit `SeasonalMatches` component
- Modify date grouping logic
- Add new match statuses

### Customizing Standings
- Edit `CategoryStandings` component
- Modify table columns
- Add new statistics

## Benefits

### For Administrators
- **Single Interface**: Manage all categories from one place
- **Automatic Updates**: Standings update when matches are played
- **Consistent Layout**: All categories look the same

### For Visitors
- **Better UX**: Consistent navigation and layout
- **Real-time Data**: Always see current standings and matches
- **Seasonal View**: Easy to find matches by season

### For Developers
- **Maintainable Code**: Single component handles all categories
- **Extensible**: Easy to add new features
- **Database-driven**: No hardcoded category logic

## Migration from Static Pages

### Before (Static)
- Each category had its own page file
- Hardcoded URLs and data sources
- Inconsistent layouts
- Manual updates required

### After (Dynamic)
- Single dynamic page handles all categories
- Database-driven data
- Consistent, professional layout
- Automatic updates

## Troubleshooting

### Category Not Found
- Check if category exists in database
- Verify the `code` field matches the URL slug
- Ensure category is marked as active

### No Matches Displayed
- Check if matches exist for the category
- Verify season is active
- Check match dates are in correct format

### Standings Table Empty
- Check if `team_standings` table exists
- Verify data is being populated
- Check category and season relationships

## Future Enhancements

Potential improvements for the system:
- **Historical Data**: Show previous seasons
- **Team Pages**: Individual team statistics
- **Match Details**: Click through to match information
- **Statistics**: Advanced team and player stats
- **Mobile Optimization**: Better mobile experience
- **Export Features**: Download standings and matches
