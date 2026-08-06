import {NextRequest} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {getAllPointDeductions} from '@/queries/pointDeductions';
import {PointDeductionInsert} from '@/types';

export async function GET(request: NextRequest) {
  return withAuth(async (_user, supabase) => {
    const {searchParams} = request.nextUrl;
    const categoryId = searchParams.get('category_id') ?? undefined;
    const seasonId = searchParams.get('season_id') ?? undefined;

    const result = await getAllPointDeductions({supabase}, {categoryId, seasonId});
    if (result.error) throw new Error(result.error);

    return successResponse(result.data);
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (_user, _supabase, admin) => {
    const body: PointDeductionInsert = await request.json();

    const {data, error} = await admin
      .from('point_deductions')
      .insert({...body})
      .select(
        `
        *,
        team:club_category_teams(
          id,
          team_suffix,
          club_category:club_categories(
            club:clubs(id, name, short_name)
          )
        )
      `
      )
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  });
}
