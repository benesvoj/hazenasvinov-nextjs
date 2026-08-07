import {NextResponse} from 'next/server';

import type {SupabaseClient} from '@supabase/supabase-js';

import {translations} from '@/lib/translations';

import supabaseAdmin from '@/utils/supabase/admin';
import {
  errorResponse,
  prepareUpdateData,
  successResponse,
  withAdminAuth,
  withAuth,
} from '@/utils/supabase/apiHelpers';
import {hasCategoryAccess, isAdmin} from '@/utils/supabase/coachAuth';

const t = translations.members.responseMessages;

type MemberRow = {id: string; category_id: string | null} & Record<string, any>;

type MemberAccess =
  | {allowed: true; member: MemberRow; isAdminUser: boolean}
  | {allowed: false; response: NextResponse};

/**
 * Loads a member and verifies the caller may act on it.
 *
 * Admins pass unconditionally. Everyone else (coaches) needs the member's
 * category in their `assigned_categories` — members without a category are
 * admin-only, since there is nothing to authorize against.
 */
async function loadAuthorizedMember(
  supabase: SupabaseClient,
  userId: string,
  memberId: string
): Promise<MemberAccess> {
  const {data: member, error} = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (error || !member) {
    return {allowed: false, response: errorResponse(t.memberNotFound, 404)};
  }

  const isAdminUser = await isAdmin(supabase, userId);

  if (!isAdminUser) {
    const hasAccess = member.category_id
      ? await hasCategoryAccess(supabase, userId, member.category_id)
      : false;

    if (!hasAccess) {
      return {allowed: false, response: errorResponse(t.noCategoryAccess, 403)};
    }
  }

  return {allowed: true, member, isAdminUser};
}

/**
 * GET /api/members/[id] - Get single member
 *
 * Restricted to admins and coaches managing the member's category.
 */
export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  return withAuth(async (user, supabase) => {
    const access = await loadAuthorizedMember(supabase, user.id, id);

    if (!access.allowed) return access.response;

    return successResponse(access.member);
  });
}

/**
 * PATCH /api/members/[id] - Update member
 *
 * Admins may update any member. Everyone else (coaches) may only touch members
 * of a category listed in their `assigned_categories`, and may not move a member
 * into — or out of — a category they do not manage.
 */
export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  return withAuth(async (user, supabase) => {
    const body = await request.json();

    const access = await loadAuthorizedMember(supabase, user.id, id);

    if (!access.allowed) return access.response;

    // Reassigning a category is only allowed between managed categories —
    // clearing it would also move the member out of the coach's reach.
    if (!access.isAdminUser && 'category_id' in body) {
      if (body.category_id !== access.member.category_id) {
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
 *
 * Admin-only, matching the UI: coaches deactivate members (PATCH `is_active`)
 * instead of deleting them, so history stays intact.
 */
export async function DELETE(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  return withAdminAuth(async (user, supabase, admin) => {
    await admin.from('member_club_relationships').delete().eq('member_id', id);
    await admin.from('member_metadata').delete().eq('member_id', id);

    const {error} = await admin.from('members').delete().eq('id', id);

    if (error) {
      console.error('Error deleting member:', error);
      return errorResponse(`Chyba při mazání člena: ${error.message}`, 500);
    }

    return NextResponse.json({success: true, error: null});
  });
}
