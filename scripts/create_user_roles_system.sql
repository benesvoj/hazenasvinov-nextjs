-- Create user roles system
-- This script creates tables and functions for managing user roles and coach category assignments

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'coach')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- 2. Create coach_categories table for category assignments
CREATE TABLE IF NOT EXISTS coach_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, category_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_coach_categories_user_id ON coach_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_categories_category_id ON coach_categories(category_id);

-- 4. Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_categories ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Create a function to check admin role without causing recursion
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = user_uuid 
        AND up.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has any admin role (new or old system)
CREATE OR REPLACE FUNCTION has_admin_access(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    -- Check new role system first
    IF EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = user_uuid 
        AND ur.role = 'admin'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Fallback to old role system
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = user_uuid 
        AND up.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow service role to bypass RLS (for initial setup)
CREATE POLICY "Service role can manage all roles" ON user_roles
    FOR ALL USING (auth.role() = 'service_role');

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL USING (has_admin_access());

-- 6. Create RLS policies for coach_categories
CREATE POLICY "Users can view their own coach categories" ON coach_categories
    FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to bypass RLS (for initial setup)
CREATE POLICY "Service role can manage all coach categories" ON coach_categories
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage all coach categories" ON coach_categories
    FOR ALL USING (has_admin_access());

-- 7. Create helper functions
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role VARCHAR(20)) AS $$
BEGIN
    RETURN QUERY
    SELECT ur.role
    FROM user_roles ur
    WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_coach_categories(user_uuid UUID)
RETURNS TABLE(category_id UUID, category_name VARCHAR(255), category_code VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.category_id,
        c.name as category_name,
        c.code as category_code
    FROM coach_categories cc
    JOIN categories c ON cc.category_id = c.id
    WHERE cc.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name VARCHAR(20))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = user_uuid 
        AND ur.role = role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create view for user role summary
CREATE OR REPLACE VIEW user_role_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COALESCE(
        up.full_name,
        u.raw_user_meta_data->>'full_name',
        u.email
    ) as full_name,
    up.role as profile_role, -- Keep existing role for backward compatibility
    COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
    COALESCE(array_agg(DISTINCT cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL), '{}') as assigned_categories,
    COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as assigned_category_names,
    COALESCE(array_agg(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL), '{}') as assigned_category_codes
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN coach_categories cc ON u.id = cc.user_id
LEFT JOIN categories c ON cc.category_id = c.id
GROUP BY u.id, u.email, up.full_name, u.raw_user_meta_data, up.role;

-- 9. Grant permissions
GRANT SELECT ON user_role_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_coach_categories(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_admin_access(UUID) TO authenticated;

-- 10. Add comments
COMMENT ON TABLE user_roles IS 'User role assignments (admin, coach)';
COMMENT ON TABLE coach_categories IS 'Coach category assignments for access control';
COMMENT ON FUNCTION get_user_roles(UUID) IS 'Get all roles for a specific user';
COMMENT ON FUNCTION get_user_coach_categories(UUID) IS 'Get assigned categories for a coach';
COMMENT ON FUNCTION has_role(UUID, VARCHAR) IS 'Check if user has a specific role';
COMMENT ON FUNCTION is_admin(UUID) IS 'Check if user has admin role (uses user_profiles to avoid recursion)';
COMMENT ON FUNCTION has_admin_access(UUID) IS 'Check if user has admin access (checks both new and old role systems)';
COMMENT ON VIEW user_role_summary IS 'Summary view of user roles and category assignments';
