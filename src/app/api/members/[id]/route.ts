import {NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';
import {createClient} from '@/utils/supabase/server';

/**
 * GET /api/members/[id] - Get single member
 */
export async function GET(request: Request, {params}: {params: {id: string}}) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase.from('members').select('*').eq('id', params.id).single();

    if (error) {
      console.error('Error fetching member:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

/**
 * PATCH /api/members/[id] - Update member
 * @param request
 * @param params
 * @constructor
 */
export async function PATCH(request: Request, {params}: {params: {id: string}}) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();

    // Filter out undefined values to avoid Supabase errors
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are not undefined
    Object.keys(body).forEach((key) => {
      const value = body[key];
      if (value !== undefined && key !== 'id') {
        updateData[key] = value;
      }
    });

    const {data, error} = await supabaseAdmin
      .from('members')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return NextResponse.json(
        {error: `Chyba při aktualizaci člena: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

/**
 * DELETE /api/members/[id] - Delete member
 * @param request
 * @param params
 * @constructor
 */
export async function DELETE(request: Request, {params}: {params: {id: string}}) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {error} = await supabaseAdmin.from('members').delete().eq('id', params.id);

    if (error) {
      console.error('Error deleting member:', error);
      return NextResponse.json({error: `Chyba při mazání člena: ${error.message}`}, {status: 500});
    }

    return NextResponse.json({success: true, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
