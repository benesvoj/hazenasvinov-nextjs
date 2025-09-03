-- Add action column to login_logs table
-- Run this in your Supabase SQL editor

-- Step 1: Add the action column
ALTER TABLE login_logs 
ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT 'login' 
CHECK (action IN ('login', 'logout'));

-- Step 2: Update existing records to have appropriate actions
UPDATE login_logs 
SET action = CASE 
    WHEN status = 'success' THEN 'login'
    WHEN status = 'failed' THEN 'login'
    ELSE 'login'
END
WHERE action IS NULL OR action = '';

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_login_logs_action ON login_logs(action);

-- Step 4: Update the status check constraint to be more flexible
ALTER TABLE login_logs 
DROP CONSTRAINT IF EXISTS login_logs_status_check;

ALTER TABLE login_logs 
ADD CONSTRAINT login_logs_status_check 
CHECK (status IN ('success', 'failed', 'pending'));

-- Step 5: Verify the changes
SELECT 
    action,
    status,
    COUNT(*) as count
FROM login_logs 
GROUP BY action, status
ORDER BY action, status;
