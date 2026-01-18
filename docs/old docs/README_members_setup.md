# Members System Setup Instructions

## Overview
This document provides instructions for setting up the enhanced members system with registration numbers and string-based categories.

## Problem
The current database schema uses `category_id` (UUID) that references the categories table, but the updated code expects a string `category` field. This mismatch causes the "Error updating member: {}" error.

## Solution
We need to update the database schema to use string-based categories instead of UUID references, and add the registration number field.

## Files
- `scripts/setup_members_system.sql` - **Main setup script** (recommended)
- `scripts/update_members_schema.sql` - Schema update only
- `scripts/add_registration_number_to_members.sql` - Registration numbers only

## Quick Setup (Recommended)

### 1. Run the Main Setup Script
```sql
-- Connect to your Supabase database and run:
\i scripts/setup_members_system.sql
```

This script will:
- ✅ Backup existing data
- ✅ Convert `category_id` to string `category`
- ✅ Add `registration_number` field
- ✅ Set up auto-generation triggers
- ✅ Update indexes and constraints
- ✅ Verify the changes

### 2. Alternative: Step-by-Step Setup

If you prefer to run scripts separately:

```sql
-- Step 1: Update schema
\i scripts/update_members_schema.sql

-- Step 2: Add registration numbers
\i scripts/add_registration_number_to_members.sql
```

## What the Scripts Do

### Schema Update (`update_members_schema.sql`)
1. **Backup data**: Creates `members_backup` table
2. **Add category column**: Adds string `category` field
3. **Migrate data**: Converts UUID references to string codes
4. **Update constraints**: Adds validation for valid categories
5. **Clean up**: Removes old `category_id` column and indexes

### Registration Numbers (`add_registration_number_to_members.sql`)
1. **Add field**: Adds `registration_number` column
2. **Set constraints**: Makes it unique and NOT NULL
3. **Auto-generation**: Creates trigger for automatic numbers
4. **Format**: REG-YYYY-XXXX (e.g., REG-2024-0001)

## Expected Result

After running the setup, your `members` table should have:

```sql
CREATE TABLE members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    sex VARCHAR(10) NOT NULL,
    functions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Valid Categories
The system supports these category values:
- `men` - Muži
- `women` - Ženy
- `juniorBoys` - Dorostenci
- `juniorGirls` - Dorostenky
- `prepKids` - Přípravka
- `youngestKids` - Nejmladší děti
- `youngerBoys` - Mladší žáci
- `youngerGirls` - Mladší žákyně
- `olderBoys` - Starší žáci
- `olderGirls` - Starší žákyně

## Testing

### 1. Verify Schema
```sql
-- Check table structure
\d members

-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'members';
```

### 2. Test Auto-generation
```sql
-- Insert a member without registration number
INSERT INTO members (name, surname, date_of_birth, category, sex) 
VALUES ('Test', 'User', '1990-01-01', 'men', 'male');

-- Check if registration number was generated
SELECT * FROM members WHERE name = 'Test';
```

### 3. Test Validation
```sql
-- Try invalid category (should fail)
INSERT INTO members (name, surname, date_of_birth, category, sex) 
VALUES ('Invalid', 'Category', '1990-01-01', 'invalid_category', 'male');
```

## Troubleshooting

### Error: "column category does not exist"
- Run the schema update script first
- Check if the script completed successfully

### Error: "duplicate key value violates unique constraint"
- The registration number already exists
- Check for duplicate data in the backup table

### Error: "new row for relation members violates check constraint"
- Invalid category value
- Ensure category is one of the valid values listed above

### Error: "function generate_registration_number() does not exist"
- Run the registration number script
- Check if the function was created successfully

## Rollback

If something goes wrong, you can restore from backup:

```sql
-- Drop the current table
DROP TABLE members;

-- Restore from backup
ALTER TABLE members_backup RENAME TO members;

-- Re-run the setup script
```

## Next Steps

After successful setup:
1. ✅ **Test the admin interface** - Add/edit/delete members
2. ✅ **Verify registration numbers** - Check auto-generation
3. ✅ **Test search functionality** - Search by name, surname, or registration number
4. ✅ **Check form validation** - Ensure all fields work correctly

## Support

If you encounter issues:
1. Check the console for detailed error messages
2. Verify the database schema matches the expected structure
3. Ensure all triggers and functions are properly created
4. Check RLS policies if you have permission issues

---

**Note**: Always backup your database before running schema changes in production!
