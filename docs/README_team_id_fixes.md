# Team ID Fix Scripts for Matches

This directory contains SQL scripts to fix team ID references in the matches table after database migrations or data corrections.

## 🚨 **Important Notes**

- **Always backup your database** before running these scripts
- **Test on a development environment** first
- **Verify the team IDs** you're updating are correct
- **Check foreign key constraints** after updates

## 📁 **Available Scripts**

### 1. **Simple Fix Script** (`simple_fix_match_team_ids.sql`)
**Use for**: Quick single team ID replacement
**Best for**: One-off fixes or testing

```sql
-- Modify these values in the script:
old_team_id UUID := 'OLD-TEAM-ID-HERE';
new_team_id UUID := 'NEW-TEAM-ID-HERE';
categoryId UUID := 'CATEGORY-ID-HERE';
```

**Features**:
- Simple and direct
- Updates both home and away team references
- Limited to specific category
- Shows update counts

### 2. **Comprehensive Fix Script** (`fix_match_team_ids.sql`)
**Use for**: Production fixes with full validation
**Best for**: Important data corrections

**Features**:
- Validates team and category existence
- Shows before/after state
- Comprehensive verification
- Detailed logging
- Error handling

### 3. **Batch Fix Script** (`batch_fix_match_team_ids.sql`)
**Use for**: Multiple team ID updates at once
**Best for**: Bulk migrations

**Features**:
- Handles multiple mappings
- Efficient batch processing
- Progress reporting
- Total update counts

## 🔧 **How to Use**

### **Step 1: Identify the Problem**
```sql
-- Check which matches have the old team ID
SELECT id, date, time, home_team_id, away_team_id, category_id
FROM matches 
WHERE home_team_id = 'OLD-TEAM-ID' 
   OR away_team_id = 'OLD-TEAM-ID';
```

### **Step 2: Find the Correct New Team ID**
```sql
-- Find the correct team in club_category_teams
SELECT cct.id, cct.team_suffix, c.name as club_name
FROM club_category_teams cct
JOIN club_categories cc ON cct.club_category_id = cc.id
JOIN clubs c ON cc.club_id = c.id
WHERE c.name = 'Club Name' AND cct.team_suffix = 'A';
```

### **Step 3: Run the Fix Script**
```bash
# For simple fix
psql -d your_database -f scripts/simple_fix_match_team_ids.sql

# For comprehensive fix
psql -d your_database -f scripts/fix_match_team_ids.sql

# For batch fix
psql -d your_database -f scripts/batch_fix_match_team_ids.sql
```

## 📝 **Example Usage**

### **Scenario**: Fix team ID after migration
```sql
-- Old team ID (from teams table)
old_team_id = '102a7408-b2c5-4a09-80d5-f76771ea4c3e'

-- New team ID (from club_category_teams table)
new_team_id = '2fbd366c-f375-40bb-a177-fd4c4a80a09e'

-- Category to limit scope
category_id = '5b0e437a-b815-4a37-a41d-088566637c7d'
```

### **Expected Output**:
```
=== SIMPLE TEAM ID FIX ===
Replacing team ID 102a7408-b2c5-4a09-80d5-f76771ea4c3e with 2fbd366c-f375-40bb-a177-fd4c4a80a09e in category 5b0e437a-b815-4a37-a41d-088566637c7d

Updates completed:
- Home team updates: 3
- Away team updates: 2
- Total: 5
```

## ✅ **Verification After Update**

### **Check 1: Verify old team ID is gone**
```sql
SELECT COUNT(*) FROM matches 
WHERE home_team_id = 'OLD-TEAM-ID' 
   OR away_team_id = 'OLD-TEAM-ID';
-- Should return 0
```

### **Check 2: Verify new team ID is used**
```sql
SELECT id, date, home_team_id, away_team_id 
FROM matches 
WHERE home_team_id = 'NEW-TEAM-ID' 
   OR away_team_id = 'NEW-TEAM-ID';
```

### **Check 3: Test application functionality**
- Open the matches page
- Verify team names display correctly
- Check that EditMatchModal works
- Ensure no foreign key constraint errors

## 🚨 **Common Issues & Solutions**

### **Issue**: "Team ID does not exist"
**Solution**: Verify the new team ID exists in `club_category_teams` table

### **Issue**: "Category ID does not exist"
**Solution**: Check the category ID in the `categories` table

### **Issue**: Foreign key constraint errors
**Solution**: Ensure the new team ID is valid and active

### **Issue**: No matches updated
**Solution**: Verify the old team ID and category ID match existing data

## 📊 **Performance Considerations**

- **Simple script**: Fastest, minimal overhead
- **Comprehensive script**: Slower due to validation and logging
- **Batch script**: Most efficient for multiple updates
- **Large datasets**: Consider running during low-traffic periods

## 🔒 **Security Notes**

- These scripts only update team IDs, not sensitive data
- All updates are logged and verifiable
- Scripts include category scoping to prevent unintended updates
- Use database user with appropriate permissions

## 📞 **Support**

If you encounter issues:
1. Check the console output for error messages
2. Verify all UUIDs are correct
3. Ensure database permissions are adequate
4. Test with a small dataset first
