-- Setup club-assets storage bucket for TJ Sokol Svinov
-- This script creates the storage bucket and configures policies for club assets

-- Create the club-assets storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'club-assets',
    'club-assets',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public read access
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'club-assets');

-- Create storage policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload club assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'club-assets' 
        AND auth.role() = 'authenticated'
    );

-- Create storage policy for authenticated users to update
CREATE POLICY "Authenticated users can update club assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'club-assets' 
        AND auth.role() = 'authenticated'
    );

-- Create storage policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete club assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'club-assets' 
        AND auth.role() = 'authenticated'
    );

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Verify bucket was created
SELECT 
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'club-assets';
