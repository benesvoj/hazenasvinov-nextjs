import {NextRequest, NextResponse} from 'next/server';

import {errorResponse, prepareUpdateData, successResponse, withAdminAuth, withAuth} from '@/utils';

/**
 * GET /api/categories/[id] - Get single category
 *
 * @example Using new apiHelpers pattern - cleaner, less boilerplate
 */
export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return errorResponse('Category not found', 404);
    }

    return successResponse(data);
  });
}

/**
 * PATCH /api/categories/[id] - Update category (Admin only)
 *
 * @example Using withAdminAuth with admin client and prepareUpdateData helper
 */
export async function PATCH(request: NextRequest, {params}: {params: {id: string}}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();
    const updateData = prepareUpdateData(body);

    // Use admin client to bypass RLS for system-level updates
    const {data, error} = await admin
      .from('categories')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  });
}

/**
 * DELETE /api/categories/[id] - Delete category (Admin only)
 *
 * @example Using admin client for system-level deletion
 */
export async function DELETE(request: NextRequest, {params}: {params: {id: string}}) {
  return withAdminAuth(async (user, supabase, admin) => {
    // Use admin client to bypass RLS
    const {error} = await admin.from('categories').delete().eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({success: true, error: null});
  });
}
