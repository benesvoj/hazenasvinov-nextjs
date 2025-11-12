/**
 * GET, POST /api/categories/:id/lineups
 */
import {NextRequest} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {CreateCategoryLineup} from '@/types';

/**
 * GET /api/categories/[id]/lineups - Get all lineups for a category
 * Query params: ?season_id=xxx&is_active=true
 */

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAuth(async (user, supabase) => {
    const {id} = await params;
    const searchParams = request.nextUrl.searchParams;
    const seasonId = searchParams.get('season_id');
    const isActive = searchParams.get('is_active');

    let query = supabase.from('category_lineups').select('*').eq('category_id', id);

    if (seasonId) query = query.eq('season_id', seasonId);
    if (isActive !== null) query = query.eq('is_active', isActive === 'true');

    const {data, error} = await query.order('created_at', {ascending: false});

    if (error) throw error;

    return successResponse(data);
  });
}

export async function POST(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body: CreateCategoryLineup = await request.json();
    const {data, error} = await admin
      .from('category_lineups')
      .insert({...body, category_id: id, created_by: user.id, is_active: true})
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  });
}
