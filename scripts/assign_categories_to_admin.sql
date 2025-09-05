-- Assign categories to admin profile for testing coaches dashboard
-- Run this in your Supabase SQL Editor

-- First, let's see what categories are available
SELECT id, code, name, description, is_active 
FROM categories 
WHERE is_active = true 
ORDER BY sort_order;

-- Get your admin user profile
SELECT id, user_id, role, assigned_categories 
FROM user_profiles 
WHERE role = 'admin' 
ORDER BY created_at DESC;

-- Assign some categories to the admin profile
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the query above
UPDATE user_profiles 
SET assigned_categories = ARRAY[
  (SELECT id FROM categories WHERE code = 'men'),
  (SELECT id FROM categories WHERE code = 'women'),
  (SELECT id FROM categories WHERE code = 'juniorBoys'),
  (SELECT id FROM categories WHERE code = 'juniorGirls')
]
WHERE role = 'admin' 
AND user_id = 'YOUR_USER_ID_HERE';

-- Verify the update
SELECT 
  up.id,
  up.user_id,
  up.role,
  up.assigned_categories,
  c.name as category_name,
  c.code as category_code
FROM user_profiles up
LEFT JOIN categories c ON c.id = ANY(up.assigned_categories)
WHERE up.role = 'admin' 
AND up.user_id = 'YOUR_USER_ID_HERE';

-- Alternative: Assign all active categories to admin
-- UPDATE user_profiles 
-- SET assigned_categories = (
--   SELECT ARRAY_AGG(id) 
--   FROM categories 
--   WHERE is_active = true
-- )
-- WHERE role = 'admin' 
-- AND user_id = 'YOUR_USER_ID_HERE';
