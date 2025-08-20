-- Create Excel Template Structure
-- This script documents the expected Excel format for match imports

/*
EXCEL IMPORT TEMPLATE FOR MATCHES

Expected Excel structure with the following columns:

Column A: Date (Datum)
- Format: Any valid date format (Excel will auto-detect)
- Example: 15.03.2024, 2024-03-15, 15/03/2024
- Required: Yes

Column B: Time (Čas)
- Format: HH:MM (24-hour format)
- Example: 14:30, 09:00, 20:15
- Required: Yes

Column C: Match Number (Číslo zápasu)
- Format: Number or text
- Example: 1, 2, 3, "Finále", "Semifinále"
- Required: Yes
- Stored in: match_number column (TEXT)

Column D: Home Team (Domácí tým)
- Format: Text (team name or short name)
- Example: "Baník Most", "Sparta Praha", "Slavia Praha"
- Required: Yes
- Must match existing team names in database

Column E: Away Team (Hostující tým)
- Format: Text (team name or short name)
- Example: "Baník Most", "Sparta Praha", "Slavia Praha"
- Required: Yes
- Must match existing team names in database

Column F: Category (Kategorie)
- Format: Text (category name or code)
- Example: "Muži", "Ženy", "U16", "U18"
- Required: Yes
- Must match existing category names in database

IMPORTANT DISTINCTION: Matchweek vs Match Number

MATCH NUMBER (Column C):
- What it is: Specific match identifier within a week
- Examples: "1", "2", "3", "Finále", "Semifinále"
- Purpose: Identifies specific match in a week/round
- Storage: Stored directly in match_number column

MATCHWEEK (Auto-calculated):
- What it is: Week number in the season
- Calculation: Automatically calculated from match date and season start date
- Examples: 1 (Week 1), 2 (Week 2), 5 (Week 5)
- Purpose: Organizes matches into weeks/rounds
- Storage: Stored in matchweek column (INTEGER)

Example combination:
Date        | Time  | Match Number | Home Team    | Away Team    | Category | Matchweek (auto)
15.03.2024  | 14:30 | 1            | Baník Most   | Sparta Praha | Muži     | 1
15.03.2024  | 16:00 | 2            | Slavia Praha | Baník Most   | Muži     | 1
22.03.2024  | 14:30 | 1            | Baník Most   | Slavia Praha | Muži     | 2
22.03.2024  | 16:00 | 2            | Sparta Praha | Baník Most   | Muži     | 2

Explanation:
- 15.03.2024 = Week 1 of season → Matchweek = 1
- 22.03.2024 = Week 2 of season → Matchweek = 2
- Match Number = "1" or "2" within each week

IMPORTANT NOTES:
1. First row must contain headers (column names)
2. Data starts from second row
3. Empty rows are automatically skipped
4. Teams and categories must exist in the database
5. Duplicate matches (same teams, date, time) will be rejected
6. All matches will be imported with status 'upcoming'
7. Venue will be set to empty string (can be updated later)
8. Competition type will be set to 'league'
9. Matchweek is automatically calculated from date
10. Match number is stored exactly as provided in Excel

VALIDATION RULES:
1. Date must be a valid date
2. Time must be in HH:MM format (24-hour)
3. Match number cannot be empty
4. Home team must exist in database
5. Away team must exist in database
6. Category must exist in database
7. Home and away team cannot be the same
8. No duplicate matches allowed

ERROR HANDLING:
- Invalid data rows will be marked as 'invalid' with specific error messages
- Only valid rows will be imported
- Import summary shows success/failure counts
- Detailed error messages are displayed for each failed row
*/
