import {NextRequest} from 'next/server';

import {translations} from '@/lib/translations';
import {MembersInternalQuerySchema} from '@/lib/validators/membersInternal';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';

import {getMembersInternal} from '@/queries/membersInternal';
import {MemberInsert} from '@/types';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const parsed = MembersInternalQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    if (!parsed.success) {
      return errorResponse(JSON.stringify(parsed.error.flatten().fieldErrors), 400);
    }

    const result = await getMembersInternal(
      {supabase},
      {
        ...parsed.data,
        categoryId: parsed.data.category_id,
        // memberFunctions: parsed.data.function -> this is currently not supported, different structure TODO
      }
    );

    if (result.error) {
      return errorResponse(result.error, 500);
    }

    return successResponse({
      items: result.data,
      total: result.count,
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body: MemberInsert = await request.json();

    const {data: ownClub, error: clubError} = await supabase
      .from('clubs')
      .select('id')
      .eq('is_own_club', true)
      .single();

    if (clubError || !ownClub) {
      throw new Error('Own club not found');
    }

    const registration_number =
      body.registration_number?.trim() ||
      `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const {data: member, error: memberError} = await supabase
      .from('members')
      .insert({...body, registration_number})
      .select()
      .single();

    if (memberError) {
      if (memberError.code === '23505' && memberError.message?.includes('registration_number')) {
        return errorResponse(
          translations.members.responseMessages.memberWithSameRegNumberExists,
          409
        );
      }
      throw memberError;
    }

    const {error: relError} = await supabase.from('member_club_relationships').insert({
      member_id: member.id,
      club_id: ownClub.id,
      relationship_type: 'permanent',
      status: 'active',
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: null,
    });

    if (relError) {
      console.error('Error creating member-club relationship:', member.id, relError);
    }

    return successResponse(member, 201);
  });
}
