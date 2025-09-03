-- Fix photo_albums RLS performance issue
-- This script optimizes RLS policies by replacing auth.role() with (SELECT auth.role())
-- to prevent re-evaluation for each row

-- 1. Drop existing inefficient policies
DROP POLICY IF EXISTS "Public albums are viewable by everyone" ON photo_albums;
DROP POLICY IF EXISTS "Authenticated users can view all albums" ON photo_albums;
DROP POLICY IF EXISTS "Authenticated users can create albums" ON photo_albums;
DROP POLICY IF EXISTS "Authenticated users can update albums" ON photo_albums;
DROP POLICY IF EXISTS "Authenticated users can delete albums" ON photo_albums;

-- 2. Create optimized RLS policies for photo_albums
-- Using (SELECT auth.role()) instead of auth.role() to prevent re-evaluation per row

-- Policy 1: Public albums are viewable by everyone
CREATE POLICY "Public albums are viewable by everyone" ON photo_albums
    FOR SELECT 
    USING (is_public = true);

-- Policy 2: Authenticated users can view all albums
CREATE POLICY "Authenticated users can view all albums" ON photo_albums
    FOR SELECT 
    USING ((SELECT auth.role()) = 'authenticated');

-- Policy 3: Authenticated users can create albums (OPTIMIZED)
CREATE POLICY "Authenticated users can create albums" ON photo_albums
    FOR INSERT 
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- Policy 4: Authenticated users can update albums (OPTIMIZED)
CREATE POLICY "Authenticated users can update albums" ON photo_albums
    FOR UPDATE 
    USING ((SELECT auth.role()) = 'authenticated')
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- Policy 5: Authenticated users can delete albums (OPTIMIZED)
CREATE POLICY "Authenticated users can delete albums" ON photo_albums
    FOR DELETE 
    USING ((SELECT auth.role()) = 'authenticated');

-- 3. Also fix photos table policies for consistency
DROP POLICY IF EXISTS "Photos from public albums are viewable by everyone" ON photos;
DROP POLICY IF EXISTS "Authenticated users can view all photos" ON photos;
DROP POLICY IF EXISTS "Authenticated users can create photos" ON photos;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON photos;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON photos;

-- Policy 1: Photos from public albums are viewable by everyone
CREATE POLICY "Photos from public albums are viewable by everyone" ON photos
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM photo_albums 
            WHERE photo_albums.id = photos.album_id 
            AND photo_albums.is_public = true
        )
    );

-- Policy 2: Authenticated users can view all photos (OPTIMIZED)
CREATE POLICY "Authenticated users can view all photos" ON photos
    FOR SELECT 
    USING ((SELECT auth.role()) = 'authenticated');

-- Policy 3: Authenticated users can create photos (OPTIMIZED)
CREATE POLICY "Authenticated users can create photos" ON photos
    FOR INSERT 
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- Policy 4: Authenticated users can update photos (OPTIMIZED)
CREATE POLICY "Authenticated users can update photos" ON photos
    FOR UPDATE 
    USING ((SELECT auth.role()) = 'authenticated')
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- Policy 5: Authenticated users can delete photos (OPTIMIZED)
CREATE POLICY "Authenticated users can delete photos" ON photos
    FOR DELETE 
    USING ((SELECT auth.role()) = 'authenticated');

-- 4. Add comments explaining the optimization
COMMENT ON POLICY "Authenticated users can create albums" ON photo_albums IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Authenticated users can update albums" ON photo_albums IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Authenticated users can delete albums" ON photo_albums IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Authenticated users can view all albums" ON photo_albums IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Authenticated users can view all photos" ON photos IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Authenticated users can create photos" ON photos IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Authenticated users can update photos" ON photos IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

COMMENT ON POLICY "Authenticated users can delete photos" ON photos IS 
'Optimized policy using (SELECT auth.role()) to prevent re-evaluation per row';

-- 5. Verify the policies are optimized
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
WHERE tablename IN ('photo_albums', 'photos')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Show performance improvement explanation
SELECT 
    'Performance Optimization Applied' as status,
    'auth.role() calls wrapped in (SELECT auth.role()) to prevent per-row re-evaluation' as optimization,
    'This improves query performance at scale by evaluating auth functions once per query instead of once per row' as benefit;
