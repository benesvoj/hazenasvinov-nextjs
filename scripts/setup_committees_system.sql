-- Setup Committees System
-- Run this in your Supabase SQL Editor

-- Create committees table
CREATE TABLE IF NOT EXISTS committees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add committee_id to teams table (replacing region)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS committee_id UUID REFERENCES committees(id);
ALTER TABLE teams DROP COLUMN IF EXISTS region;

-- Add comments
COMMENT ON TABLE committees IS 'Regional competition committees (OBLASTNÍ SOUTĚŽNÍ KOMISE)';
COMMENT ON COLUMN teams.committee_id IS 'Reference to the committee this team belongs to';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_committees_active ON committees(is_active);
CREATE INDEX IF NOT EXISTS idx_committees_sort ON committees(sort_order);
CREATE INDEX IF NOT EXISTS idx_teams_committee ON teams(committee_id);

-- Insert sample committees
INSERT INTO committees (name, code, description, sort_order) VALUES
('Oblastní soutěžní komise Ostrava', 'OSK_OSTRAVA', 'Komise pro oblast Ostravy a okolí', 1),
('Oblastní soutěžní komise Frýdek-Místek', 'OSK_FM', 'Komise pro oblast Frýdku-Místku', 2),
('Oblastní soutěžní komise Karviná', 'OSK_KARVINA', 'Komise pro oblast Karviné', 3),
('Oblastní soutěžní komise Opava', 'OSK_OPAVA', 'Komise pro oblast Opavy', 4),
('Oblastní soutěžní komise Krnov', 'OSK_KRNOV', 'Komise pro oblast Krnova', 5),
('Oblastní soutěžní komise Bruntál', 'OSK_BRUNTAL', 'Komise pro oblast Bruntálu', 6)
ON CONFLICT (name) DO NOTHING;

-- Update existing teams to have a default committee (you can adjust this)
UPDATE teams SET committee_id = (SELECT id FROM committees WHERE code = 'OSK_OSTRAVA' LIMIT 1)
WHERE committee_id IS NULL;

-- Add RLS policies for committees
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Committees are viewable by everyone" ON committees
    FOR SELECT USING (true);

CREATE POLICY "Committees are insertable by authenticated users" ON committees
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Committees are updatable by authenticated users" ON committees
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Committees are deletable by authenticated users" ON committees
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON committees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
