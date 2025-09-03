-- Fix security issue with user_role_summary view
-- This script removes the view and creates a secure version that doesn't expose auth.users data

-- 1. Drop the existing view
DROP VIEW IF EXISTS user_role_summary;

-- 2. Create a secure version that only exposes necessary data
-- This view only shows data from user_profiles and related tables, not auth.users
CREATE OR REPLACE VIEW user_role_summary AS
SELECT 
    up.user_id,
    up.role as profile_role, -- Keep existing role for backward compatibility
    COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
    COALESCE(array_agg(DISTINCT cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL), '{}') as assigned_categories,
    COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as assigned_category_names,
    COALESCE(array_agg(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL), '{}') as assigned_category_codes
FROM user_profiles up
LEFT JOIN user_roles ur ON up.user_id = ur.user_id
LEFT JOIN coach_categories cc ON up.user_id = cc.user_id
LEFT JOIN categories c ON cc.category_id = c.id
GROUP BY up.user_id, up.role;

-- 3. Grant permissions to authenticated users
GRANT SELECT ON user_role_summary TO authenticated;

-- 4. Add comment
COMMENT ON VIEW user_role_summary IS 'Secure summary view of user roles and category assignments (no auth.users data exposed)';

-- 5. Create a function for getting current user's own data (including email)
-- This function is secure because it only returns data for the authenticated user
CREATE OR REPLACE FUNCTION get_current_user_summary()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    profile_role TEXT,
    roles TEXT[],
    assigned_categories UUID[],
    assigned_category_names TEXT[],
    assigned_category_codes TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        COALESCE(
            u.raw_user_meta_data->>'full_name',
            u.email
        ) as full_name,
        up.role as profile_role,
        COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
        COALESCE(array_agg(DISTINCT cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL), '{}') as assigned_categories,
        COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as assigned_category_names,
        COALESCE(array_agg(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL), '{}') as assigned_category_codes
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN coach_categories cc ON u.id = cc.user_id
    LEFT JOIN categories c ON cc.category_id = c.id
    WHERE u.id = auth.uid() -- Only return data for the authenticated user
    GROUP BY u.id, u.email, u.raw_user_meta_data, up.role;
END;
$$;

-- 6. Grant execute permission on the secure function
GRANT EXECUTE ON FUNCTION get_current_user_summary() TO authenticated;

-- 7. Add comment for the function
COMMENT ON FUNCTION get_current_user_summary() IS 'Secure function to get current user summary including email (only returns own data)';

-- 8. Create an admin-only function for getting any user's data (for admin purposes)
CREATE OR REPLACE FUNCTION get_user_summary_by_id(target_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    profile_role TEXT,
    roles TEXT[],
    assigned_categories UUID[],
    assigned_category_names TEXT[],
    assigned_category_codes TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        COALESCE(
            u.raw_user_meta_data->>'full_name',
            u.email
        ) as full_name,
        up.role as profile_role,
        COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
        COALESCE(array_agg(DISTINCT cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL), '{}') as assigned_categories,
        COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as assigned_category_names,
        COALESCE(array_agg(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL), '{}') as assigned_category_codes
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN coach_categories cc ON u.id = cc.user_id
    LEFT JOIN categories c ON cc.category_id = c.id
    WHERE u.id = target_user_id
    GROUP BY u.id, u.email, u.raw_user_meta_data, up.role;
END;
$$;

-- 9. Grant execute permission on the admin function
GRANT EXECUTE ON FUNCTION get_user_summary_by_id(UUID) TO authenticated;

-- 10. Add comment for the admin function
COMMENT ON FUNCTION get_user_summary_by_id(UUID) IS 'Admin-only function to get any user summary including email (requires admin role)';
