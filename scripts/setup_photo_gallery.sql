-- Setup photo gallery system for TJ Sokol Svinov
-- This script creates the necessary tables for managing photo albums and photos

-- Create photo_albums table
CREATE TABLE IF NOT EXISTS photo_albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_photo_url TEXT,
    is_public BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    album_id UUID NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_albums_public ON photo_albums(is_public);
CREATE INDEX IF NOT EXISTS idx_photo_albums_sort ON photo_albums(sort_order);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_sort ON photos(sort_order);

-- Enable Row Level Security
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_albums
CREATE POLICY "Public albums are viewable by everyone" ON photo_albums
    FOR SELECT USING (is_public = true);

CREATE POLICY "Authenticated users can view all albums" ON photo_albums
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create albums" ON photo_albums
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update albums" ON photo_albums
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete albums" ON photo_albums
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for photos
CREATE POLICY "Photos from public albums are viewable by everyone" ON photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM photo_albums 
            WHERE photo_albums.id = photos.album_id 
            AND photo_albums.is_public = true
        )
    );

CREATE POLICY "Authenticated users can view all photos" ON photos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create photos" ON photos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update photos" ON photos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete photos" ON photos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_photo_albums_updated_at 
    BEFORE UPDATE ON photo_albums 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at 
    BEFORE UPDATE ON photos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON photo_albums TO authenticated;
GRANT ALL ON photos TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert sample album for testing
INSERT INTO photo_albums (title, description, is_public, sort_order) 
VALUES ('Ukázkový album', 'Toto je ukázkový album pro testování systému', true, 1)
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('photo_albums', 'photos')
ORDER BY table_name, ordinal_position;
