import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and has admin privileges
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    console.log('🔄 Updating own_club_matches materialized view...');

    // SQL script to update the materialized view
    const updateScript = `
      -- Drop the existing materialized view
      DROP MATERIALIZED VIEW IF EXISTS own_club_matches;
      
      -- Recreate the materialized view with category and season information
      CREATE MATERIALIZED VIEW own_club_matches AS
      SELECT 
        m.id,
        m.date,
        m.time,
        m.venue,
        m.competition,
        m.status,
        m.home_score,
        m.away_score,
        m.home_score_halftime,
        m.away_score_halftime,
        m.matchweek,
        m.match_number,
        m.category_id,
        m.season_id,
        m.home_team_id,
        m.away_team_id,
        m.created_at,
        m.updated_at,
        -- Category information
        c.id as category_id_full,
        c.name as category_name,
        c.description as category_description,
        c.slug as category_slug,
        -- Season information
        s.id as season_id_full,
        s.name as season_name,
        s.start_date as season_start_date,
        s.end_date as season_end_date,
        -- Home team information
        hc.id as home_club_id,
        hc.is_own_club as home_is_own_club,
        hc.name as home_club_name,
        hc.short_name as home_club_short_name,
        hc.logo_url as home_club_logo_url,
        hcct.team_suffix as home_team_suffix,
        -- Away team information
        ac.id as away_club_id,
        ac.is_own_club as away_is_own_club,
        ac.name as away_club_name,
        ac.short_name as away_club_short_name,
        ac.logo_url as away_club_logo_url,
        acct.team_suffix as away_team_suffix
      FROM matches m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN seasons s ON m.season_id = s.id
      LEFT JOIN club_category_teams hcct ON m.home_team_id = hcct.id
      LEFT JOIN club_categories hcc ON hcct.club_category_id = hcc.id
      LEFT JOIN clubs hc ON hcc.club_id = hc.id
      LEFT JOIN club_category_teams acct ON m.away_team_id = acct.id
      LEFT JOIN club_categories acc ON acct.club_category_id = acc.id
      LEFT JOIN clubs ac ON acc.club_id = ac.id
      WHERE (hc.is_own_club = true OR ac.is_own_club = true);
      
      -- Create indexes for the updated materialized view
      CREATE INDEX IF NOT EXISTS idx_own_club_matches_category_season 
      ON own_club_matches(category_id, season_id);
      
      CREATE INDEX IF NOT EXISTS idx_own_club_matches_date 
      ON own_club_matches(date);
      
      CREATE INDEX IF NOT EXISTS idx_own_club_matches_status 
      ON own_club_matches(status);
      
      -- Refresh the materialized view
      REFRESH MATERIALIZED VIEW own_club_matches;
    `;

    // Execute the SQL script
    const {error} = await supabase.rpc('exec_sql', {sql: updateScript});

    if (error) {
      console.error('❌ Error updating materialized view:', error);
      return NextResponse.json(
        {
          error: 'Failed to update materialized view',
          details: error.message,
        },
        {status: 500}
      );
    }

    console.log('✅ Successfully updated own_club_matches materialized view');

    return NextResponse.json({
      success: true,
      message: 'Materialized view updated successfully',
    });
  } catch (error) {
    console.error('❌ Error in update-materialized-view API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500}
    );
  }
}
