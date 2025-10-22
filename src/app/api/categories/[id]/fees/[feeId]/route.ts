import {NextRequest, NextResponse} from 'next/server';

import {errorResponse, prepareUpdateData, successResponse, withAdminAuth, withAuth} from '@/utils';

/**
 * GET /api/categories/[id]/fees/[feeId] - Get single fee
 *
 * @example Nested dynamic route with proper validation
 */
export async function GET(request: NextRequest, {params}: {params: {id: string; feeId: string}}) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('category_membership_fees')
      .select('*, categories(name)')
      .eq('id', params.feeId)
      .eq('category_id', params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return errorResponse('Fee not found', 404);
    }

    return successResponse(data);
  });
}

/**
 * PATCH /api/categories/[id]/fees/[feeId] - Update specific fee (Admin only)
 *
 * @example Admin route with validation that fee belongs to category
 */
export async function PATCH(request: NextRequest, {params}: {params: {id: string; feeId: string}}) {
  return withAdminAuth(async (user, supabase) => {
    const body = await request.json();
    const updateData = prepareUpdateData(body);

    // Verify the fee belongs to this category
    const {data: existingFee} = await supabase
      .from('category_membership_fees')
      .select('id')
      .eq('id', params.feeId)
      .eq('category_id', params.id)
      .single();

    if (!existingFee) {
      return errorResponse('Fee not found or does not belong to this category', 404);
    }

    const {data, error} = await supabase
      .from('category_membership_fees')
      .update(updateData)
      .eq('id', params.feeId)
      .eq('category_id', params.id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  });
}

/**
 * DELETE /api/categories/[id]/fees/[feeId] - Delete specific fee (Admin only)
 *
 * @example Clean admin-only deletion with proper validation
 */
export async function DELETE(
  request: NextRequest,
  {params}: {params: {id: string; feeId: string}}
) {
  return withAdminAuth(async (user, supabase) => {
    // Verify the fee belongs to this category before deleting
    const {data: existingFee} = await supabase
      .from('category_membership_fees')
      .select('id')
      .eq('id', params.feeId)
      .eq('category_id', params.id)
      .single();

    if (!existingFee) {
      return errorResponse('Fee not found or does not belong to this category', 404);
    }

    const {error} = await supabase
      .from('category_membership_fees')
      .delete()
      .eq('id', params.feeId)
      .eq('category_id', params.id);

    if (error) throw error;

    return NextResponse.json({success: true, error: null});
  });
}
