import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('page_visibility')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching page visibility:', error);
      return NextResponse.json({ error: 'Failed to fetch page visibility' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/page-visibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { id, is_visible, sort_order, page_route, page_title } = await request.json();

    // Build update object with only provided fields
    const updateData: any = { updated_at: new Date().toISOString() };
    if (is_visible !== undefined) updateData.is_visible = is_visible;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (page_route !== undefined) updateData.page_route = page_route;
    if (page_title !== undefined) updateData.page_title = page_title;

    const { data, error } = await supabase
      .from('page_visibility')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating page visibility:', error);
      return NextResponse.json({ error: 'Failed to update page visibility' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/page-visibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
