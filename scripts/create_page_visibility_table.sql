-- Create page visibility table for TJ Sokol Svinov
-- This table stores which public pages are visible to visitors

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Page Visibility Table
CREATE TABLE IF NOT EXISTS page_visibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'home', 'blog', 'matches'
    page_title VARCHAR(255) NOT NULL, -- e.g., 'Úvod', 'Novinky', 'Zápasy'
    page_route VARCHAR(255) NOT NULL, -- e.g., '/', '/blog', '/matches'
    page_description TEXT, -- Description of what the page contains
    is_visible BOOLEAN DEFAULT true, -- Whether the page is visible to visitors
    sort_order INTEGER DEFAULT 0, -- Order for display in navigation
    category VARCHAR(100), -- For grouping pages (e.g., 'main', 'categories', 'info')
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default page visibility settings based on current routes
INSERT INTO page_visibility (page_key, page_title, page_route, page_description, is_visible, sort_order, category) VALUES
    ('home', 'Úvod', '/', 'Hlavní stránka klubu', true, 1, 'main'),
    ('categories', 'Kategorie', '/categories', 'Všechny kategorie týmů', true, 2, 'main'),
    ('blog', 'Novinky', '/blog', 'Blogové články a novinky', true, 3, 'main'),
    ('matches', 'Zápasy', '/matches', 'Harmonogram a výsledky zápasů', true, 4, 'main'),
    ('photoGallery', 'Fotogalerie', '/photo-gallery', 'Fotografie ze zápasů a akcí', true, 5, 'main'),
    ('chronicle', 'Kronika', '/chronicle', 'Historie klubu', true, 6, 'info'),
    ('downloads', 'Dokumenty', '/downloads', 'Ke stažení dokumenty', true, 7, 'info'),
    ('contact', 'Kontakt', '/contact', 'Kontaktní informace', true, 8, 'info'),
    ('about', 'O oddílu', '/about', 'Informace o klubu', true, 9, 'info'),
    ('celebration', '100 let', '/100', 'Oslava 100 let klubu', true, 10, 'info'),
    ('login', 'Admin', '/login', 'Přihlášení do administrace', true, 11, 'admin'),
    ('youngestKids', 'Kuřátka', '/categories/youngest-kids', 'Nejmladší se zájmem o pohyb', true, 12, 'categories'),
    ('prepKids', 'Přípravka', '/categories/prep-kids', 'Děti 5-10 let, turnajové kategorie', true, 13, 'categories'),
    ('youngerBoys', 'Mladší žáci', '/categories/younger-boys', 'Kluci 9-12 let, SM oblast', true, 14, 'categories'),
    ('youngerGirls', 'Mladší žáčky', '/categories/younger-girls', 'Devčata 9-12 let, SM oblast', true, 15, 'categories'),
    ('olderBoys', 'Starší žáci', '/categories/older-boys', 'Kluci 12-15 let, SM oblast', true, 16, 'categories'),
    ('olderGirls', 'Starší žáčky', '/categories/older-girls', 'Devčata 12-15 let, SM oblast', true, 17, 'categories'),
    ('juniorBoys', 'Dorostenci', '/categories/junior-boys', 'Junioři 15-18 let, SM oblast', true, 18, 'categories'),
    ('juniorGirls', 'Dorostenky', '/categories/junior-girls', 'Juniorky 15-18 let, SM oblast', true, 19, 'categories'),
    ('men', 'Muži', '/categories/men', '1.liga mužů, SM oblast', true, 20, 'categories'),
    ('women', 'Ženy', '/categories/women', 'Oblastní liga žen, SM oblast', true, 21, 'categories')
ON CONFLICT (page_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_page_visibility_visible ON page_visibility(is_visible);
CREATE INDEX IF NOT EXISTS idx_page_visibility_category ON page_visibility(category);
CREATE INDEX IF NOT EXISTS idx_page_visibility_sort_order ON page_visibility(sort_order);
CREATE INDEX IF NOT EXISTS idx_page_visibility_active ON page_visibility(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_page_visibility_updated_at 
    BEFORE UPDATE ON page_visibility 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE page_visibility ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Enable read access for all users" ON page_visibility
    FOR SELECT USING (true);

-- Allow authenticated users to update
CREATE POLICY "Enable update for authenticated users only" ON page_visibility
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users only" ON page_visibility
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT ON page_visibility TO anon, authenticated;
GRANT INSERT, UPDATE ON page_visibility TO authenticated;
