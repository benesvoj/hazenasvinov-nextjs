-- Create function to refresh materialized views
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh the specified materialized view
  EXECUTE format('REFRESH MATERIALIZED VIEW %I', view_name);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_materialized_view(text) TO authenticated;

-- Test the function (optional)
-- SELECT refresh_materialized_view('own_club_matches');
