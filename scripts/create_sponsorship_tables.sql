-- Create sponsorship tables for TJ Sokol Svinov
-- This script creates the necessary tables for managing sponsors, partners, and media relationships

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main Partners Table (Platinum/Gold level sponsors)
CREATE TABLE IF NOT EXISTS main_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    level VARCHAR(20) NOT NULL CHECK (level IN ('platinum', 'gold')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'pending')),
    benefits JSONB DEFAULT '[]',
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Partners Table (Suppliers, Services, Collaborations)
CREATE TABLE IF NOT EXISTS business_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    description TEXT NOT NULL,
    partnership_type VARCHAR(50) NOT NULL CHECK (partnership_type IN ('supplier', 'service', 'collaboration')),
    level VARCHAR(20) NOT NULL CHECK (level IN ('silver', 'bronze')),
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    notes TEXT,
    discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Partners Table (Newspapers, Radio, TV, Online, Social)
CREATE TABLE IF NOT EXISTS media_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    description TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('newspaper', 'radio', 'tv', 'online', 'social', 'other')),
    coverage VARCHAR(20) NOT NULL CHECK (coverage IN ('local', 'regional', 'national')),
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    coverage_details JSONB DEFAULT '[]',
    notes TEXT,
    monthly_value_czk INTEGER CHECK (monthly_value_czk >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsorship Packages Table (for future use)
CREATE TABLE IF NOT EXISTS sponsorship_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('platinum', 'gold', 'silver', 'bronze', 'partner')),
    price_czk INTEGER NOT NULL CHECK (price_czk >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'CZK',
    description TEXT,
    benefits JSONB DEFAULT '[]',
    validity_months INTEGER NOT NULL CHECK (validity_months > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_main_partners_status ON main_partners(status);
CREATE INDEX IF NOT EXISTS idx_main_partners_level ON main_partners(level);
CREATE INDEX IF NOT EXISTS idx_main_partners_dates ON main_partners(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_business_partners_status ON business_partners(status);
CREATE INDEX IF NOT EXISTS idx_business_partners_type ON business_partners(partnership_type);
CREATE INDEX IF NOT EXISTS idx_business_partners_level ON business_partners(level);

CREATE INDEX IF NOT EXISTS idx_media_partners_status ON media_partners(status);
CREATE INDEX IF NOT EXISTS idx_media_partners_type ON media_partners(media_type);
CREATE INDEX IF NOT EXISTS idx_media_partners_coverage ON media_partners(coverage);

CREATE INDEX IF NOT EXISTS idx_sponsorship_packages_level ON sponsorship_packages(level);
CREATE INDEX IF NOT EXISTS idx_sponsorship_packages_active ON sponsorship_packages(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_main_partners_updated_at 
    BEFORE UPDATE ON main_partners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_partners_updated_at 
    BEFORE UPDATE ON business_partners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_partners_updated_at 
    BEFORE UPDATE ON media_partners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsorship_packages_updated_at 
    BEFORE UPDATE ON sponsorship_packages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO main_partners (name, description, level, start_date, end_date, status, benefits, website_url) VALUES
('ABC Company', 'Hlavní sponzor klubu', 'platinum', '2024-01-01', '2024-12-31', 'active', 
 '["Logo na všech dresech", "Bannery na hřišti", "Výhradní práva na kategorii", "VIP akce pro zaměstnance", "Mediální partnerství"]', 
 'https://abc-company.cz'),
('XYZ Sports', 'Sponzor sportovního vybavení', 'gold', '2024-03-01', '2024-08-31', 'active',
 '["Logo na dresech vybrané kategorie", "Bannery na hřišti", "Pozvánky na zápasy", "Mediální zmínky"]',
 'https://xyz-sports.cz')
ON CONFLICT DO NOTHING;

INSERT INTO business_partners (name, description, partnership_type, level, start_date, status, website_url, email, phone, notes) VALUES
('Sportovní vybavení Pro', 'Dodavatel sportovního vybavení a dresů', 'supplier', 'silver', '2024-01-01', 'active',
 'https://sportovni-vybaveni.cz', 'info@sportovni-vybaveni.cz', '+420 123 456 789', 'Sleva 15% na veškeré vybavení'),
('Catering Plus', 'Dodavatel občerstvení na akce', 'service', 'bronze', '2024-02-01', 'active',
 'https://catering-plus.cz', 'info@catering-plus.cz', '+420 987 654 321', 'Sleva 10% na catering služby')
ON CONFLICT DO NOTHING;

INSERT INTO media_partners (name, description, media_type, coverage, start_date, status, website_url, email, phone, coverage_details, notes) VALUES
('Místní noviny', 'Místní deník s pravidelným sportovním rubrikou', 'newspaper', 'local', '2024-01-01', 'active',
 'https://mestni-noviny.cz', 'redakce@mestni-noviny.cz', '+420 111 222 333',
 '["Pravidelné články o zápasech", "Rozhovory s hráči", "Fotoreportáže z akcí", "Inzerce na sportovní stránky"]',
 'Měsíční inzerce v hodnotě 5000 Kč'),
('Sportovní Radio', 'Regionální sportovní rozhlasová stanice', 'radio', 'regional', '2024-02-01', 'active',
 'https://sportovni-radio.cz', 'studio@sportovni-radio.cz', '+420 222 333 444',
 '["Živé přenosy zápasů", "Sportovní zpravodajství", "Rozhovory s trenéry", "Reklamní spoty"]',
 'Hodinové sportovní bloky 2x týdně')
ON CONFLICT DO NOTHING;

INSERT INTO sponsorship_packages (name, level, price_czk, description, benefits, validity_months) VALUES
('Platinový Partner', 'platinum', 50000, 'Nejvyšší úroveň sponzorství s maximální viditelností',
 '["Logo na všech dresech", "Bannery na hřišti", "Výhradní práva na kategorii", "VIP akce pro zaměstnance", "Mediální partnerství"]', 12),
('Zlatý Sponzor', 'gold', 25000, 'Prémiové sponzorství s výraznou viditelností',
 '["Logo na dresech vybrané kategorie", "Bannery na hřišti", "Pozvánky na zápasy", "Mediální zmínky"]', 6)
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON TABLE main_partners IS 'Hlavní partneři a sponzoři klubu (platinum/gold úrovně)';
COMMENT ON TABLE business_partners IS 'Obchodní partneři, dodavatelé a poskytovatelé služeb';
COMMENT ON TABLE media_partners IS 'Mediální partneři pro propagaci a reklamu';
COMMENT ON TABLE sponsorship_packages IS 'Sponzorské balíčky a ceník';

-- Display created tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('main_partners', 'business_partners', 'media_partners', 'sponsorship_packages')
ORDER BY tablename;
