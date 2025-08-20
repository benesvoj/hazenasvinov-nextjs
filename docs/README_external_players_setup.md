# External Players Support for Lineup Management

## Overview
This enhancement adds support for external players (players from other clubs) in the lineup management system. When managing lineups for matches that don't involve your own club, you can now add players by entering their name and registration number manually, rather than being limited to only your club's members.

## Key Features

### 🔄 **Auto-Completion & Memory**
- **Smart Recognition**: When you enter a registration number that was used before, the system automatically fills in the player's name and other details
- **Persistent Storage**: All external players are stored in the database for future use
- **Search Functionality**: Quick search through previously added external players

### 🎯 **Flexible Player Management**
- **Toggle Between Types**: Switch between internal players (from your club) and external players (from other clubs)
- **Complete Information**: Store name, surname, registration number, position, and club information
- **Club Identification**: Select from existing teams or enter custom club name
- **Validation**: Same validation rules apply to external players as internal ones

### 🏆 **Handball Federation Compliance**
- **Position Requirements**: Must specify goalkeeper or field player
- **Count Validation**: Enforces minimum/maximum player counts per position
- **Coach Rules**: Maximum 3 coaches per team, minimum 1 head coach required
- **Role Assignment**: Can assign starter, captain, and vice-captain roles

## Database Setup

### 1. Run the External Players Script
Execute the following SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of scripts/add_external_players_support.sql
-- into your Supabase SQL Editor and run it
```

**Quick Setup Steps:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the entire contents of `scripts/add_external_players_support.sql`
5. Paste and run the script
6. Verify success message: "External players support with club IDs and enhanced coach validation added successfully!"

### 2. What the Script Creates
- **`external_players` table**: Stores external player information with club ID references
- **`get_or_create_external_player()` function**: Creates or updates external players
- **`search_external_players()` function**: Searches through external players
- **`validate_lineup_enhanced()` function**: Enhanced validation including coach rules
- **Indexes**: Fast lookup by registration number, name, and club ID
- **RLS Policies**: Security and access control
- **Triggers**: Automatic validation and timestamp updates

## Club Identification Strategy

### **Why Club IDs Instead of Just Names?**
- ✅ **Unique Identification**: Each club has one ID, no duplicates
- ✅ **Data Integrity**: No typos or variations in club names
- ✅ **Relationships**: Can link to club tables, logos, contact info
- ✅ **Efficient Search**: Fast lookups and filtering
- ✅ **Future Scalability**: Easy to add club-level features

### **Club Selection Options**
1. **Select from Existing Teams**: Choose from teams already in your system
2. **Custom Club Name**: Enter a club name for teams not in your system
3. **Automatic Linking**: System maintains relationships between players and clubs

## Usage Instructions

### Accessing External Player Management
1. Navigate to `/admin/matches`
2. Select a category and season
3. Find the match you want to manage
4. Click the **"Sestava"** button
5. Click **"Upravit sestavu"** for the desired team

### Adding External Players
1. **Click "Přidat hráče"** to add a new player
2. **Toggle to "Externí hráč"** using the button
3. **Fill in the required fields**:
   - **Registrační číslo**: Player's federation registration number
   - **Jméno**: Player's first name
   - **Příjmení**: Player's last name
   - **Klub**: Select from existing teams or enter custom name
   - **Pozice**: Goalkeeper or field player
   - **Číslo dresu**: Jersey number (optional)
4. **Set player roles**: Starter, captain, vice-captain
5. **Save the lineup**

### Coach Management
1. **Click "Přidat trenéra"** to add a coach
2. **Select coach from members list** or add as external coach
3. **Choose role**: Head coach, assistant coach, or goalkeeper coach
4. **Validation rules**:
   - Maximum 3 coaches per team
   - Minimum 1 head coach required
   - Role-based validation

### Auto-Completion Feature
- **Enter Registration Number**: Start typing a registration number
- **Automatic Fill**: If the number exists, name and other details auto-fill
- **Update Information**: If details have changed, you can update them
- **Persistent Storage**: All information is saved for future use

### Switching Between Player Types
- **Interní hráč**: Select from your club's member list
- **Externí hráč**: Enter player details manually with club selection
- **Toggle Buttons**: Easy switching between the two modes
- **Preserved Data**: Your input is preserved when switching

## Technical Implementation

### Database Schema
```sql
CREATE TABLE external_players (
    id UUID PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL,
    club_id UUID REFERENCES teams(id), -- Reference to existing teams
    club_name VARCHAR(200), -- Fallback for custom clubs
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Enhanced Validation Function
```sql
CREATE OR REPLACE FUNCTION validate_lineup_enhanced()
-- Includes:
-- - Player count validation (goalkeepers: 1-2, field players: 6-13)
-- - Coach count validation (maximum 3)
-- - Coach role validation (minimum 1 head coach)
-- - Total player validation (minimum 7)
```

### Key Functions
- **`get_or_create_external_player()`**: Creates new or updates existing external players
- **`search_external_players()`**: Fast search with multiple criteria including club
- **`validate_lineup_enhanced()`**: Comprehensive validation for players and coaches
- **Auto-completion**: Real-time data filling and validation

## Benefits

### ✅ **Enhanced Flexibility**
- **No More Limitations**: Add players from any club, not just your own
- **Complete Lineups**: Fill lineups even when playing against other clubs
- **Professional Management**: Handle guest players and mixed teams
- **Club Relationships**: Maintain proper club identification

### ✅ **Improved Efficiency**
- **Auto-Completion**: No need to re-enter player information
- **Quick Search**: Find previously added players instantly
- **Consistent Data**: Maintain player information across matches
- **Smart Club Selection**: Choose from existing teams or add custom

### ✅ **Better User Experience**
- **Intuitive Interface**: Clear toggle between internal and external players
- **Smart Forms**: Dynamic form fields based on player type
- **Club Integration**: Seamless integration with existing team system
- **Validation**: Immediate feedback on lineup composition

## Example Use Cases

### 1. **Inter-Club Matches**
- Add players from visiting teams
- Store their information for future matches
- Maintain complete lineup records
- Link players to their actual clubs

### 2. **Tournament Play**
- Manage lineups for mixed teams
- Track guest players across multiple matches
- Build player database for future events
- Maintain club relationships

### 3. **Guest Players**
- Add temporary players to your lineups
- Store their information for future reference
- Maintain professional records
- Link to proper club information

## Troubleshooting

### Common Issues

#### 1. **External Players Not Saving**
**Cause**: Database tables not created
**Solution**: Run the `add_external_players_support.sql` script

#### 2. **Auto-Completion Not Working**
**Cause**: Search function not available
**Solution**: Verify the `search_external_players` function exists

#### 3. **Validation Errors**
**Cause**: Position or count requirements not met
**Solution**: Check handball federation rules compliance

#### 4. **Coach Validation Errors**
**Cause**: Coach count or role requirements not met
**Solution**: Ensure maximum 3 coaches, minimum 1 head coach

### Error Messages
- **"Tabulka externích hráčů ještě nebyla vytvořena"**: Run the setup script
- **"Musí být alespoň 1 brankář"**: Add a goalkeeper to the lineup
- **"Musí být alespoň 6 hráčů v poli"**: Add more field players
- **"Lineup must have at least 1 head coach"**: Add a head coach

## Security Features

### **Row Level Security (RLS)**
- **Public Read**: External players visible to everyone
- **Authenticated Write**: Only authenticated users can modify
- **Proper Permissions**: Granular access control

### **Data Integrity**
- **Unique Constraints**: No duplicate registration numbers
- **Foreign Keys**: Proper club references
- **Validation Rules**: Position and count requirements enforced
- **Audit Trail**: Automatic timestamp tracking

## Performance Considerations

### **Optimized Queries**
- **Indexed Lookups**: Fast search by registration number and club
- **Efficient Joins**: Optimized database queries with team relationships
- **Caching**: Client-side search results

### **Scalability**
- **Separate Tables**: External players don't affect internal member performance
- **Club References**: Efficient linking to existing team data
- **Quick Retrieval**: Fast lookup for auto-completion

## Future Enhancements

### **Club-Level Features**
- **Club Statistics**: Track performance by club
- **Club Logos**: Display club logos in lineups
- **Club Contact**: Link to club contact information
- **Club History**: Track matches against specific clubs

### **Advanced Search**
- **Club Filtering**: Search players by club
- **Position Filtering**: Filter by player position
- **Date Range**: Search by when players were added
- **Bulk Operations**: Import/export club player lists

## Next Steps

### **Immediate Actions**
1. ✅ **Run Setup Script**: Execute `add_external_players_support.sql`
2. ✅ **Test Functionality**: Add external players to test lineups
3. ✅ **Verify Auto-Completion**: Test with duplicate registration numbers
4. ✅ **Test Club Selection**: Verify club ID and name functionality

### **Future Enhancements**
- **Club Management**: Add/edit club information
- **Player Photos**: Support for external player photos
- **Advanced Statistics**: Club and player performance metrics
- **Integration**: Connect with federation databases

## Support

If you experience issues with external players functionality:
1. **Check Database**: Verify tables and functions were created
2. **Review Logs**: Check browser console for error messages
3. **Test Basic Functions**: Ensure basic lineup management works
4. **Verify Club Data**: Check that teams table has data
5. **Contact Support**: Provide specific error messages and steps

---

**Note**: This system maintains the same validation rules and security standards as the internal player management system, ensuring compliance with national handball federation requirements while providing enhanced flexibility for managing mixed-team lineups. The enhanced coach validation ensures proper coaching staff composition according to federation rules.
