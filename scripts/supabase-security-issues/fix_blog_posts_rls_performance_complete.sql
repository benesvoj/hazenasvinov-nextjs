-- Fix ALL blog_posts RLS performance issues
-- This script optimizes ALL RLS policies by replacing auth.role() with (SELECT auth.role())
-- to prevent re-evaluation for each row

-- 1. Drop ALL existing inefficient policies (comprehensive cleanup)
DROP POLICY IF EXISTS "Allow authenticated users to read posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to insert posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to update posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to delete posts" ON blog_posts;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON blog_posts;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON blog_posts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON blog_posts;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON blog_posts;
DROP POLICY IF EXISTS "Enable select access for authenticated users" ON blog_posts;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON blog_posts;

-- 2. Create optimized RLS policies for blog_posts
-- Using (SELECT auth.role()) instead of auth.role() to prevent re-evaluation per row

-- Policy 1: Allow authenticated users to read posts (OPTIMIZED)
CREATE POLICY "Allow authenticated users to read posts" ON blog_posts
    FOR SELECT 
    USING ((SELECT auth.role()) = 'authenticated');

-- Policy 2: Allow authenticated users to insert posts (OPTIMIZED)
CREATE POLICY "Allow authenticated users to insert posts" ON blog_posts
    FOR INSERT 
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- Policy 3: Allow authenticated users to update posts (OPTIMIZED)
CREATE POLICY "Allow authenticated users to update posts" ON blog_posts
    FOR UPDATE 
    USING ((SELECT auth.role()) = 'authenticated')
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- Policy 4: Allow authenticated users to delete posts (OPTIMIZED)
CREATE POLICY "Allow authenticated users to delete posts" ON blog_posts
    FOR DELETE 
    USING ((SELECT auth.role()) = 'authenticated');

-- 3. Add comments explaining the optimization
COMMENT ON POLICY "Allow authenticated users to read posts" ON blog_posts IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Allow authenticated users to insert posts" ON blog_posts IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Allow authenticated users to update posts" ON blog_posts IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Allow authenticated users to delete posts" ON blog_posts IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

-- 4. Verify ALL policies are optimized
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'blog_posts'
AND schemaname = 'public'
ORDER BY policyname;

-- 5. Show performance improvement explanation
SELECT 
    'Complete Performance Optimization Applied' as status,
    'ALL auth.role() calls wrapped in (SELECT auth.role()) to prevent per-row re-evaluation' as optimization,
    'This improves query performance at scale by evaluating auth functions once per query instead of once per row' as benefit;

-- 6. Check for any remaining inefficient policies
SELECT 
    'Remaining Inefficient Policies Check' as check_type,
    COUNT(*) as inefficient_policies_count
FROM pg_policies 
WHERE tablename = 'blog_posts'
AND schemaname = 'public'
AND (
    qual LIKE '%auth.role()%' 
    OR with_check LIKE '%auth.role()%'
    OR qual LIKE '%current_setting(%'
    OR with_check LIKE '%current_setting(%'
);
