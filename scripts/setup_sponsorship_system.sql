-- Supabase Sponsorship System Setup
-- Run this script in your Supabase SQL editor

-- First, run the main table creation script
\i create_sponsorship_tables.sql

-- Enable Row Level Security (RLS)
ALTER TABLE main_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for main_partners
CREATE POLICY "Enable read access for all users" ON main_partners
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON main_partners
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON main_partners
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON main_partners
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for business_partners
CREATE POLICY "Enable read access for all users" ON business_partners
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON business_partners
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON business_partners
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON business_partners
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for media_partners
CREATE POLICY "Enable read access for all users" ON media_partners
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON media_partners
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON media_partners
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON media_partners
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for sponsorship_packages
CREATE POLICY "Enable read access for all users" ON sponsorship_packages
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON sponsorship_packages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON sponsorship_packages
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON sponsorship_packages
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create a function to get sponsorship statistics
CREATE OR REPLACE FUNCTION get_sponsorship_stats()
RETURNS TABLE (
    total_main_partners BIGINT,
    total_business_partners BIGINT,
    total_media_partners BIGINT,
    active_main_partners BIGINT,
    active_business_partners BIGINT,
    active_media_partners BIGINT,
    total_monthly_value_czk BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM main_partners) as total_main_partners,
        (SELECT COUNT(*) FROM business_partners) as total_business_partners,
        (SELECT COUNT(*) FROM media_partners) as total_media_partners,
        (SELECT COUNT(*) FROM main_partners WHERE status = 'active') as active_main_partners,
        (SELECT COUNT(*) FROM business_partners WHERE status = 'active') as active_business_partners,
        (SELECT COUNT(*) FROM media_partners WHERE status = 'active') as active_media_partners,
        (SELECT COALESCE(SUM(monthly_value_czk), 0) FROM media_partners WHERE status = 'active') as total_monthly_value_czk;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_sponsorship_stats() TO authenticated;

-- Create a view for active partnerships
CREATE OR REPLACE VIEW active_partnerships AS
SELECT 
    'main_partner' as partner_type,
    id,
    name,
    level,
    start_date,
    end_date,
    status,
    created_at
FROM main_partners 
WHERE status = 'active'

UNION ALL

SELECT 
    'business_partner' as partner_type,
    id,
    name,
    partnership_type as level,
    start_date,
    NULL as end_date,
    status,
    created_at
FROM business_partners 
WHERE status = 'active'

UNION ALL

SELECT 
    'media_partner' as partner_type,
    id,
    name,
    media_type as level,
    start_date,
    NULL as end_date,
    status,
    created_at
FROM media_partners 
WHERE status = 'active';

-- Grant select permission on the view
GRANT SELECT ON active_partnerships TO authenticated;

-- Display setup completion message
SELECT 
    'Sponsorship system setup completed successfully!' as message,
    COUNT(*) as tables_created
FROM pg_tables 
WHERE tablename IN ('main_partners', 'business_partners', 'media_partners', 'sponsorship_packages');

-- Show created tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('main_partners', 'business_partners', 'media_partners', 'sponsorship_packages')
ORDER BY tablename;
