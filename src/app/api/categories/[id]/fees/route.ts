import {NextRequest, NextResponse} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

/**
 * GET /api/categories/[id]/fees - Get all fees for a category
 *
 * @example Using withAuth - cleaner pattern with automatic error handling
 */
export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAuth(async (user, supabase) => {
    const {id} = await params;
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || new Date().getFullYear();

    const {data, error} = await supabase
      .from('category_membership_fees')
      .select('*, categories(name)')
      .eq('category_id', id)
      .eq('calendar_year', year)
      .eq('is_active', true)
      .order('fee_amount', {ascending: false});

    if (error) throw error;

    return successResponse(data);
  });
}

/**
 * POST /api/categories/[id]/fees - Create new fee for category (Admin only)
 *
 * @example Admin-only route with automatic authorization check
 */
export async function POST(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase) => {
    const {id} = await params;
    const body = await request.json();

    const {data, error} = await supabase
      .from('category_membership_fees')
      .insert({
        ...body,
        category_id: id, // Ensure category_id matches URL
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({data}, {status: 201});
  });
}
