import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Fetch club configuration
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('club_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching club config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update club configuration
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get the current config to update
    const { data: currentConfig, error: fetchError } = await supabase
      .from('club_config')
      .select('id')
      .eq('is_active', true)
      .single();

    if (fetchError) {
      console.error('Error fetching current config:', fetchError);
      return NextResponse.json({ error: 'No active club configuration found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('club_config')
      .update(body)
      .eq('id', currentConfig.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating club config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
