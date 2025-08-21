-- =====================================================
-- SQL Script: Clear Members Table
-- Purpose: Remove all data from members table for fresh import
-- Created: $(date)
-- =====================================================

-- Start transaction for safety
BEGIN;

-- First, let's check what we're about to delete
SELECT 
    'Current members count:' as info,
    COUNT(*) as total_members
FROM members;

-- Check for any foreign key dependencies
SELECT 
    'Foreign key dependencies:' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'members';

-- Backup current data (optional - uncomment if you want to keep a backup)
-- CREATE TABLE members_backup_$(date +%Y%m%d_%H%M%S) AS SELECT * FROM members;

-- Clear all data from members table
DELETE FROM members;

-- Verify the table is empty
SELECT 
    'After deletion - members count:' as info,
    COUNT(*) as total_members
FROM members;

-- Reset auto-increment sequence if using serial/bigserial
-- Uncomment the appropriate line based on your primary key type:
-- ALTER SEQUENCE members_id_seq RESTART WITH 1;  -- if using serial
-- ALTER SEQUENCE members_registration_number_seq RESTART WITH 1;  -- if you have a custom sequence

-- Commit the transaction
COMMIT;

-- Final verification
SELECT 
    'Final verification - members count:' as info,
    COUNT(*) as total_members
FROM members;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. This script deletes ALL data from the members table
-- 2. Make sure you have a backup if needed
-- 3. Check for foreign key constraints before running
-- 4. The table structure remains intact
-- 5. You can now import fresh data using the CSV import feature
-- =====================================================
