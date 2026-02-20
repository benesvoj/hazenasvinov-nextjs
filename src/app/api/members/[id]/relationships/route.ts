import {NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';
import {supabaseServerClient} from '@/utils/supabase/server';

import {RelationshipType, RelationshipStatus} from '@/enums';

// POST /api/members/[id]/relationships - Create relationship
export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id} = await params;
    const supabase = await supabaseServerClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {clubId, relationshipType, status, validFrom, validTo, notes} = body;

    if (!clubId) {
      return NextResponse.json({error: 'Club ID je povinné'}, {status: 400});
    }

    const {data, error} = await supabaseAdmin
      .from('member_club_relationships')
      .insert({
        member_id: id,
        club_id: clubId,
        relationship_type: relationshipType || RelationshipType.PERMANENT,
        status: status || RelationshipStatus.ACTIVE,
        valid_from: validFrom || new Date().toISOString().split('T')[0],
        valid_to: validTo || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating relationship:', error);
      return NextResponse.json(
        {error: `Chyba při vytváření vztahu: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({data, error: null}, {status: 201});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

// GET /api/members/[id]/relationships - Get member's relationships
export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id} = await params;
    const supabase = await supabaseServerClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase
      .from('member_club_relationships')
      .select(
        `
        *,
        club:clubs(
          id,
          name,
          short_name
        )
      `
      )
      .eq('member_id', id)
      .order('created_at', {ascending: false});

    if (error) {
      console.error('Error fetching relationships:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
