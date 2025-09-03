-- ================================================================
-- Supabase Storage RLS Policies for Team Logos
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-logos',
  'team-logos', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on the storage.objects table (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy for viewing/downloading team logos (PUBLIC READ)
-- Anyone can view team logos since they're public
CREATE POLICY "Public read access for team logos" ON storage.objects
FOR SELECT USING (bucket_id = 'team-logos');

-- 4. Policy for uploading team logos (AUTHENTICATED USERS)
-- Only authenticated users can upload team logos
CREATE POLICY "Authenticated users can upload team logos" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
);

-- 5. Policy for updating team logos (AUTHENTICATED USERS)
-- Only authenticated users can update team logos
CREATE POLICY "Authenticated users can update team logos" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
);

-- 6. Policy for deleting team logos (AUTHENTICATED USERS)
-- Only authenticated users can delete team logos
CREATE POLICY "Authenticated users can delete team logos" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
);

-- ================================================================
-- Optional: More restrictive policies (uncomment if needed)
-- ================================================================

-- If you want to restrict uploads to admin users only, 
-- you would need to add a user role system first:

-- Example: Restrict to admin role (requires custom user metadata)
-- CREATE POLICY "Only admins can upload team logos" ON storage.objects
-- FOR INSERT 
-- WITH CHECK (
--   bucket_id = 'team-logos' 
--   AND auth.role() = 'authenticated'
--   AND (auth.jwt() ->> 'user_metadata' ->> 'role') = 'admin'
-- );

-- ================================================================
-- Verification queries (run these to check if policies are working)
-- ================================================================

-- Check if bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'team-logos';

-- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check bucket contents (should be empty initially)
-- SELECT * FROM storage.objects WHERE bucket_id = 'team-logos';
