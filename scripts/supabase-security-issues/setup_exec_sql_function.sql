-- Setup exec_sql function for automated scripts
-- This function allows JavaScript scripts to execute SQL dynamically

-- 1. Create the exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result TEXT;
BEGIN
    -- Execute the SQL and return a success message
    EXECUTE sql;
    RETURN 'SQL executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN 'Error: ' || SQLERRM;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;

-- 3. Add comment explaining the function
COMMENT ON FUNCTION public.exec_sql(TEXT) IS 
'Function to execute SQL dynamically from JavaScript scripts. Used for automated database fixes.';

-- 4. Verify the function was created
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'exec_sql' 
AND routine_schema = 'public';
