-- Create club configuration table for TJ Sokol Svinov
-- This table stores club-wide settings like logo, name, and hero image

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Club Configuration Table
CREATE TABLE IF NOT EXISTS club_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_name VARCHAR(255) NOT NULL DEFAULT 'TJ Sokol Svinov',
    club_logo_path TEXT, -- Path in storage bucket
    club_logo_url TEXT, -- Public URL (computed)
    hero_image_path TEXT, -- Path in storage bucket
    hero_image_url TEXT, -- Public URL (computed)
    hero_title VARCHAR(255) DEFAULT 'Vítejte v TJ Sokol Svinov',
    hero_subtitle TEXT DEFAULT 'Tradiční házenkářský klub s bohatou historií',
    hero_button_text VARCHAR(100) DEFAULT 'Více informací',
    hero_button_link VARCHAR(255) DEFAULT '/about',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    website_url TEXT,
    founded_year INTEGER DEFAULT 1920,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default club configuration
INSERT INTO club_config (
    club_name, 
    club_logo_path, 
    club_logo_url, 
    hero_image_path, 
    hero_image_url, 
    hero_title, 
    hero_subtitle,
    hero_button_text,
    hero_button_link,
    contact_email,
    contact_phone,
    address,
    founded_year,
    description
) VALUES (
    'TJ Sokol Svinov',
    'club-assets/logo.png',
    '/storage/v1/object/public/club-assets/club-assets/logo.png',
    'club-assets/hero-image.jpg',
    '/storage/v1/object/public/club-assets/club-assets/hero-image.jpg',
    'Vítejte v TJ Sokol Svinov',
    'Tradiční házenkářský klub s bohatou historií a úspěšnou současností. Vychováváme mladé talenty a podporujeme rozvoj házené v regionu.',
    'Více informací',
    '/about',
    'info@hazenasvinov.cz',
    '+420 123 456 789',
    'Svinov, Ostrava, Česká republika',
    1920,
    'TJ Sokol Svinov je tradiční házenkářský klub s dlouholetou tradicí. Zaměřujeme se na výchovu mladých hráčů a rozvoj házené v regionu.'
) ON CONFLICT DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_club_config_active ON club_config(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_club_config_updated_at 
    BEFORE UPDATE ON club_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your RLS setup)
-- For now, allow public read access and authenticated write access
ALTER TABLE club_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Enable read access for all users" ON club_config
    FOR SELECT USING (true);

-- Allow authenticated users to update
CREATE POLICY "Enable update for authenticated users only" ON club_config
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users only" ON club_config
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT ON club_config TO anon, authenticated;
GRANT INSERT, UPDATE ON club_config TO authenticated;
