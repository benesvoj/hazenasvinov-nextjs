-- =====================================================
-- Simple Script: Clear Members Table
-- Purpose: Quick deletion of all members data
-- =====================================================

-- Start transaction
BEGIN;

-- Clear all data from members table
DELETE FROM members;

-- Commit the transaction
COMMIT;

-- Verify deletion
SELECT COUNT(*) as remaining_members FROM members;
