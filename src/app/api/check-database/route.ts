import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const checks = {
      timestamp: new Date().toISOString(),
      supabase: {
        connected: false,
        error: null
      },
      tables: {
        categories: { exists: false, count: 0, error: null },
        seasons: { exists: false, count: 0, error: null },
        matches: { exists: false, count: 0, error: null },
        team_standings: { exists: false, count: 0, error: null }
      }
    };

    // Test basic connection
    try {
      const { data: testData, error: testError } = await supabase
        .from('club_config')
        .select('count')
        .limit(1);
      
      if (!testError) {
        checks.supabase.connected = true;
      } else {
        checks.supabase.error = testError.message;
      }
    } catch (err) {
      checks.supabase.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Check categories table
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('count')
        .limit(1);
      
      if (!categoriesError) {
        checks.tables.categories.exists = true;
        checks.tables.categories.count = categoriesData?.[0]?.count || 0;
      } else {
        checks.tables.categories.error = categoriesError.message;
      }
    } catch (err) {
      checks.tables.categories.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Check seasons table
    try {
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('id, name, is_active')
        .limit(5);
      
      if (!seasonsError) {
        checks.tables.seasons.exists = true;
        checks.tables.seasons.count = seasonsData?.length || 0;
        
        // Check if there's an active season
        const activeSeason = seasonsData?.find(s => s.is_active);
        if (activeSeason) {
          checks.tables.seasons.active_season = activeSeason.name;
        } else {
          checks.tables.seasons.warning = 'No active season found';
        }
      } else {
        checks.tables.seasons.error = seasonsError.message;
      }
    } catch (err) {
      checks.tables.seasons.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Check matches table
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('count')
        .limit(1);
      
      if (!matchesError) {
        checks.tables.matches.exists = true;
        checks.tables.matches.count = matchesData?.[0]?.count || 0;
      } else {
        checks.tables.matches.error = matchesError.message;
      }
    } catch (err) {
      checks.tables.matches.error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Check team_standings table
    try {
      const { data: standingsData, error: standingsError } = await supabase
        .from('team_standings')
        .select('count')
        .limit(1);
      
      if (!standingsError) {
        checks.tables.team_standings.exists = true;
        checks.tables.team_standings.count = standingsData?.[0]?.count || 0;
      } else {
        checks.tables.team_standings.error = standingsError.message;
      }
    } catch (err) {
      checks.tables.team_standings.error = err instanceof Error ? err.message : 'Unknown error';
    }

    return NextResponse.json(checks);
    
  } catch (error) {
    console.error('Error in database check:', error);
    return NextResponse.json({ 
      error: 'Database check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
