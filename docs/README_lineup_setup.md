# Lineup Management System Setup

## Overview
This system allows administrators to manage team lineups for matches with specific constraints for national handball federation requirements.

## Features
- **Team Lineup Management**: Create and manage lineups for home and away teams
- **Player Management**: Add/remove players with positions and roles
- **Coach Management**: Assign coaching roles
- **Real-time Validation**: Immediate feedback on lineup composition
- **Handball Rules Compliance**: Enforces national handball federation requirements

## Database Schema
The system consists of three main tables:
- `lineups`: Main lineup records for each match/team combination
- `lineup_players`: Individual players in lineups with positions and roles
- `lineup_coaches`: Coaching staff assignments

## Setup Instructions

### 1. Database Setup (Required First Step)
**IMPORTANT**: If you're getting "Error getting lineup summary: {}" errors, the database tables haven't been created yet.

Run the following SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of scripts/setup_lineup_database.sql
-- into your Supabase SQL Editor and run it
```

**Quick Setup Steps:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the entire contents of `scripts/setup_lineup_database.sql`
5. Paste and run the script
6. Verify success message: "Lineup system setup completed successfully!"

### 2. What the Script Creates
- **Tables**: `lineups`, `lineup_players`, `lineup_coaches`
- **Functions**: `validate_lineup()`, `get_lineup_summary()`
- **Triggers**: Automatic validation and timestamp updates
- **Indexes**: Performance optimization
- **RLS Policies**: Security and access control
- **Permissions**: Proper user access rights

### 3. Validation Rules
The system enforces these handball federation requirements:
- **Minimum**: 7 players (1 goalkeeper + 6 field players)
- **Maximum**: 15 players (2 goalkeepers + 13 field players)
- **Coaches**: Maximum 3 per team
- **Positions**: Must specify goalkeeper or field player
- **Jersey Numbers**: 1-99, unique per lineup

## Usage

### Access Lineup Management
1. Navigate to `/admin/matches`
2. Select a category and season
3. Find the match you want to manage
4. Click the **"Sestava"** button

### Manage Lineups
1. **Switch Teams**: Use home/away team selection
2. **Add Players**: Click "Přidat hráče" for each position
3. **Add Coaches**: Click "Přidat trenéra" for coaching staff
4. **Set Roles**: Assign positions, jersey numbers, and special roles
5. **Validate**: Real-time validation ensures compliance

## Troubleshooting

### Common Issues

#### 1. "Error getting lineup summary: {}"
**Cause**: Database tables and functions not created
**Solution**: Run the `setup_lineup_database.sql` script in Supabase

#### 2. "Table 'lineups' does not exist"
**Cause**: Database setup incomplete
**Solution**: Run the complete setup script

#### 3. "Permission denied" errors
**Cause**: RLS policies not properly configured
**Solution**: Ensure the setup script ran completely

#### 4. Validation errors
**Cause**: Lineup doesn't meet handball requirements
**Solution**: Check player counts and positions

### Error Messages
The system provides clear error messages in Czech:
- "Musí být alespoň 1 brankář" (Must have at least 1 goalkeeper)
- "Musí být alespoň 6 hráčů v poli" (Must have at least 6 field players)
- "Celkem musí být alespoň 7 hráčů" (Total must be at least 7 players)

## Security Features
- **Row Level Security (RLS)**: Fine-grained access control
- **Authentication Required**: Only authenticated users can modify lineups
- **Data Integrity**: Database-level validation constraints
- **Audit Trail**: Automatic timestamp tracking

## Performance Considerations
- **Indexed Queries**: Fast lineup retrieval
- **Efficient Joins**: Optimized database queries
- **Caching**: Client-side data management
- **Lazy Loading**: Data loaded only when needed

## Next Steps
After successful setup:
1. **Test Basic Functionality**: Create a simple lineup
2. **Validate Rules**: Ensure validation works correctly
3. **User Training**: Train administrators on the system
4. **Monitor Usage**: Track system performance and usage

## Support
If you continue to experience issues after running the setup script:
1. Check Supabase logs for detailed error messages
2. Verify all tables were created successfully
3. Ensure RLS policies are active
4. Check user authentication status

**Note**: This system is designed specifically for national handball federation requirements. Ensure compliance with your local federation rules before production use.
