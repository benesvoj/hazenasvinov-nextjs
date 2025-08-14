# Sponsorship System Database Setup

This directory contains SQL scripts to set up the sponsorship management system for TJ Sokol Svinov.

## Files Overview

- **`create_sponsorship_tables.sql`** - Creates all necessary tables and sample data
- **`setup_sponsorship_system.sql`** - Sets up RLS policies and permissions for Supabase
- **`README_sponsorship_setup.md`** - This file with setup instructions

## Quick Setup in Supabase

### Option 1: Run Complete Setup (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content of `setup_sponsorship_system.sql`
4. Click **Run** to execute the script

This will:
- ✅ Create all tables with proper structure
- ✅ Insert sample data for testing
- ✅ Enable Row Level Security (RLS)
- ✅ Set up proper permissions
- ✅ Create useful views and functions

### Option 2: Step-by-Step Setup

If you prefer to run scripts separately:

1. **First**: Run `create_sponsorship_tables.sql` to create tables and sample data
2. **Then**: Run `setup_sponsorship_system.sql` to set up RLS and permissions

## Database Structure

### Tables Created

1. **`main_partners`** - Platinum/Gold level sponsors
   - Logo, website, benefits, sponsorship periods
   - Levels: platinum, gold

2. **`business_partners`** - Suppliers and service providers
   - Partnership types: supplier, service, collaboration
   - Levels: silver, bronze

3. **`media_partners`** - Media and promotional partners
   - Media types: newspaper, radio, TV, online, social
   - Coverage: local, regional, national

4. **`sponsorship_packages`** - Predefined sponsorship tiers
   - Pricing, benefits, validity periods

### Features

- **UUID primary keys** for security
- **JSONB fields** for flexible data storage (benefits, coverage details)
- **Automatic timestamps** (created_at, updated_at)
- **Data validation** with CHECK constraints
- **Performance indexes** for common queries
- **Row Level Security** for data protection

## Sample Data Included

The scripts include sample data for testing:

- **Main Partners**: ABC Company (Platinum), XYZ Sports (Gold)
- **Business Partners**: Sportovní vybavení Pro, Catering Plus
- **Media Partners**: Místní noviny, Sportovní Radio
- **Packages**: Platinový Partner, Zlatý Sponzor

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Public read access** for displaying partner information
- **Authenticated users only** for create/update/delete operations
- **Proper permissions** granted to authenticated users

## Useful Views and Functions

- **`active_partnerships`** - View of all active partnerships
- **`get_sponsorship_stats()`** - Function to get system statistics

## Testing the Setup

After running the scripts, you can test with:

```sql
-- Check if tables were created
SELECT * FROM main_partners;

-- Get sponsorship statistics
SELECT * FROM get_sponsorship_stats();

-- View active partnerships
SELECT * FROM active_partnerships;
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure you're running as a superuser or have proper permissions
2. **UUID Extension**: The script automatically enables the uuid-ossp extension
3. **RLS Policies**: If you get permission errors, check that RLS policies were created correctly

### Verification Commands

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('main_partners', 'business_partners', 'media_partners');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('main_partners', 'business_partners', 'media_partners');
```

## Next Steps

After database setup:

1. **Update your React components** to use real data instead of mock data
2. **Create API endpoints** for CRUD operations
3. **Implement forms** for adding/editing partners
4. **Add image upload** for partner logos
5. **Create dashboard** with sponsorship statistics

## Support

If you encounter issues:

1. Check the Supabase logs in your project dashboard
2. Verify that all scripts ran successfully
3. Ensure your Supabase project has the necessary permissions
4. Check that RLS policies are properly configured

---

**Note**: This setup creates a production-ready database structure. Make sure to backup your existing data before running these scripts in production.
