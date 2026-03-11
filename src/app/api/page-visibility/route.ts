import {NextRequest, NextResponse} from 'next/server';

import {SupabaseClient} from '@supabase/supabase-js';

import {withAdminAuth, withPublicAccess} from '@/utils/supabase/apiHelpers';

export async function GET() {
  return withPublicAccess(async (supabase: SupabaseClient) => {
    const {data, error} = await supabase
      .from('page_visibility')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', {ascending: true});

    if (error) {
      console.error('Error fetching page visibility:', error);
      return NextResponse.json({error: 'Failed to fetch page visibility'}, {status: 500});
    }

    return NextResponse.json(data);
  });
}

export async function PUT(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id, is_visible, sort_order, page_route, page_title} = await request.json();

    // Build update object with only provided fields
    const updateData: any = {updated_at: new Date().toISOString()};
    if (is_visible !== undefined) updateData.is_visible = is_visible;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (page_route !== undefined) updateData.page_route = page_route;
    if (page_title !== undefined) updateData.page_title = page_title;

    const {data, error} = await admin
      .from('page_visibility')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating page visibility:', error);
      return NextResponse.json({error: 'Failed to update page visibility'}, {status: 500});
    }

    return NextResponse.json(data);
  });
}
