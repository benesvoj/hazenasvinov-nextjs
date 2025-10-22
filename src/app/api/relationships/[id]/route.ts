import {NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';
import {createClient} from '@/utils/supabase/server';

// PATCH /api/relationships/[id] - Update relationship
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

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.relationshipType !== undefined) updateData.relationship_type = body.relationshipType;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.validFrom !== undefined) updateData.valid_from = body.validFrom;
    if (body.validTo !== undefined) updateData.valid_to = body.validTo;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const {data, error} = await supabaseAdmin
      .from('member_club_relationships')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating relationship:', error);
      return NextResponse.json(
        {error: `Chyba při aktualizaci vztahu: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

// DELETE /api/relationships/[id] - Delete relationship
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

    const {error} = await supabaseAdmin
      .from('member_club_relationships')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting relationship:', error);
      return NextResponse.json({error: `Chyba při mazání vztahu: ${error.message}`}, {status: 500});
    }

    return NextResponse.json({success: true, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
