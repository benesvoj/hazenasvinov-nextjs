# Club Management System Setup

## Overview

The Club Management System allows you to manage clubs, their teams, and their participation in different categories across seasons. This system supports the scenario where a single club can have multiple teams (A, B, C, etc.) in the same category.

## Features

- **Club Management**: Create, edit, and delete clubs with detailed information
- **Team Management**: Add/remove teams to clubs with optional suffixes
- **Category Assignment**: Assign clubs to categories for specific seasons
- **Team Limits**: Set maximum number of teams per club per category
- **Smart Suffix Logic**: Only show team suffixes when needed

## Database Setup

### 1. Run the Migration Script

Execute the SQL script to create the necessary tables:

```bash
psql -h your_host -U your_user -d your_database -f scripts/setup_club_management.sql
```

### 2. Tables Created

- `clubs` - Main club information
- `club_teams` - Relationship between clubs and teams
- `club_categories` - Club participation in categories per season

### 3. Views Created

- `club_overview` - Club information with team and category counts
- `club_category_details` - Detailed club-category relationships

## Usage

### Accessing Club Management

1. Navigate to `/admin/clubs` to manage clubs
2. Navigate to `/admin/club-categories` to manage category assignments

### Creating a Club

1. Go to `/admin/clubs`
2. Click "Přidat klub" (Add Club)
3. Fill in the required information:
   - **Název klubu** (Club Name): Full club name
   - **Krátký název** (Short Name): Abbreviated name for displays
   - **Město** (City): Club location
   - **Rok založení** (Founded Year): Year the club was established
   - **URL loga** (Logo URL): Link to club logo image

### Managing Club Teams

1. Go to a specific club's detail page (`/admin/clubs/[id]`)
2. In the "Týmy" (Teams) tab, click "Přidat tým" (Add Team)
3. Enter team name and select suffix (A, B, C, etc.)
4. The suffix is only used when a club has multiple teams in the same category

### Assigning Clubs to Categories

1. Go to `/admin/club-categories`
2. Click "Přiřadit klub" (Assign Club)
3. Select:
   - **Klub** (Club): The club to assign
   - **Kategorie** (Category): The competition category
   - **Sezóna** (Season): The season
   - **Maximální počet týmů** (Max Teams): How many teams this club can have

## Smart Suffix Logic

The system automatically determines when to show team suffixes:

- **Single Team**: Shows only club name (e.g., "Hazena Švínov")
- **Multiple Teams**: Shows club name + suffix (e.g., "Hazena Švínov A", "Hazena Švínov B")

This logic is based on:
1. How many teams the club has in a specific category
2. The `team_suffix` field in the `club_teams` table

## Database Schema

### Clubs Table
```sql
CREATE TABLE clubs (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    logo_url TEXT,
    city VARCHAR(255),
    founded_year INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Club Teams Table
```sql
CREATE TABLE club_teams (
    id UUID PRIMARY KEY,
    club_id UUID REFERENCES clubs(id),
    team_id UUID REFERENCES teams(id),
    team_suffix VARCHAR(10), -- A, B, C, etc.
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE
);
```

### Club Categories Table
```sql
CREATE TABLE club_categories (
    id UUID PRIMARY KEY,
    club_id UUID REFERENCES clubs(id),
    category_id UUID REFERENCES categories(id),
    season_id UUID REFERENCES seasons(id),
    max_teams INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE
);
```

## Migration from Old System

The system is designed to work alongside the existing team-based system:

1. **Phase 1**: Set up new club tables (current)
2. **Phase 2**: Migrate existing teams to clubs
3. **Phase 3**: Update application logic to use club-based system
4. **Phase 4**: Remove old team-based system (optional)

### Fallback Logic

The current implementation includes fallback logic:
- First tries to use the new club-based system
- Falls back to the old team-based system if club data isn't available
- This ensures smooth transition without breaking existing functionality

## Best Practices

### Club Naming
- Use consistent naming conventions
- Include city/location in club names when appropriate
- Use short names for display purposes

### Team Suffixes
- Use single letters (A, B, C, D)
- A team is typically the primary/first team
- Keep suffixes consistent across categories

### Category Assignment
- Assign clubs to categories before creating matches
- Set appropriate team limits based on competition rules
- Review assignments regularly, especially between seasons

## Troubleshooting

### Common Issues

1. **Teams not showing in matches**
   - Check if club is assigned to the category
   - Verify team is added to the club
   - Ensure category assignment is active

2. **Suffixes showing everywhere**
   - Check `team_suffix` values in `club_teams`
   - Verify club-category relationships
   - Review the smart suffix logic implementation

3. **Database errors**
   - Run the migration script again
   - Check foreign key constraints
   - Verify table permissions

### Debug Queries

```sql
-- Check club assignments
SELECT * FROM club_categories WHERE is_active = true;

-- Check club teams
SELECT c.name as club_name, t.name as team_name, ct.team_suffix
FROM club_teams ct
JOIN clubs c ON ct.club_id = c.id
JOIN teams t ON ct.team_id = t.id;

-- Check for orphaned records
SELECT * FROM club_teams ct
LEFT JOIN clubs c ON ct.club_id = c.id
WHERE c.id IS NULL;
```

## Future Enhancements

- **Bulk Operations**: Import/export clubs and assignments
- **Advanced Suffix Logic**: Custom suffix patterns
- **Club Statistics**: Performance metrics and history
- **Integration**: Connect with external club databases
- **Audit Trail**: Track changes to club assignments

## Support

For issues or questions about the Club Management System:
1. Check this documentation
2. Review the database schema
3. Check application logs
4. Contact the development team
