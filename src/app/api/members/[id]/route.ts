import {NextResponse} from 'next/server';

import {translations} from '@/lib/translations';

import supabaseAdmin from '@/utils/supabase/admin';
import {
  errorResponse,
  prepareUpdateData,
  successResponse,
  withAuth,
} from '@/utils/supabase/apiHelpers';
import {hasCategoryAccess, isAdmin} from '@/utils/supabase/coachAuth';
import {supabaseServerClient} from '@/utils/supabase/server';

/**
 * GET /api/members/[id] - Get single member
 */
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

    const {data, error} = await supabase.from('members').select('*').eq('id', id).single();

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
 *
 * Admins may update any member. Everyone else (coaches) may only touch members
 * of a category listed in their `assigned_categories`, and may not move a member
 * into — or out of — a category they do not manage. Members without a category
 * are admin-only, since there is nothing to authorize against.
 */
export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const t = translations.members.responseMessages;

  return withAuth(async (user, supabase) => {
    const body = await request.json();

    const {data: member, error: memberError} = await supabase
      .from('members')
      .select('id, category_id')
      .eq('id', id)
      .single();

    if (memberError || !member) {
      return errorResponse(t.memberNotFound, 404);
    }

    const adminUser = await isAdmin(supabase, user.id);

    if (!adminUser) {
      const allowed = member.category_id
        ? await hasCategoryAccess(supabase, user.id, member.category_id)
        : false;

      if (!allowed) {
        return errorResponse(t.noCategoryAccess, 403);
      }

      // Reassigning a category is only allowed between managed categories —
      // clearing it would also move the member out of the coach's reach.
      if ('category_id' in body && body.category_id !== member.category_id) {
        const targetAllowed = body.category_id
          ? await hasCategoryAccess(supabase, user.id, body.category_id)
          : false;

        if (!targetAllowed) {
          return errorResponse(t.noTargetCategoryAccess, 403);
        }
      }
    }

    const {data, error} = await supabaseAdmin
      .from('members')
      .update(prepareUpdateData(body))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return errorResponse(`Chyba při aktualizaci člena: ${error.message}`, 500);
    }

    return successResponse(data);
  });
}

/**
 * DELETE /api/members/[id] - Delete member
 * @param request
 * @param params
 * @constructor
 */
export async function DELETE(request: Request, {params}: {params: Promise<{id: string}>}) {
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

    await supabaseAdmin.from('member_club_relationships').delete().eq('member_id', id);
    await supabaseAdmin.from('member_metadata').delete().eq('member_id', id);

    const {error} = await supabaseAdmin.from('members').delete().eq('id', id);

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
