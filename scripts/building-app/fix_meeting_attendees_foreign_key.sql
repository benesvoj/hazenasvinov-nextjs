-- Fix meeting_attendees foreign key to reference members instead of auth.users
-- This is needed because attendees are club members, not necessarily system users

-- First, drop the existing foreign key constraint
ALTER TABLE meeting_attendees DROP CONSTRAINT IF EXISTS meeting_attendees_user_id_fkey;

-- Add the new foreign key constraint to reference members table
ALTER TABLE meeting_attendees ADD CONSTRAINT meeting_attendees_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE;

-- Update the comment to reflect the change
COMMENT ON COLUMN meeting_attendees.user_id IS 'Reference to member who attended (from members table)';

-- Verify the change
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'meeting_attendees'
  AND kcu.column_name = 'user_id';
