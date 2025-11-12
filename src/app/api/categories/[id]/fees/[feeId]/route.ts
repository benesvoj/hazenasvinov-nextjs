import {NextRequest, NextResponse} from 'next/server';

import {
  errorResponse,
  prepareUpdateData,
  successResponse,
  withAdminAuth,
  withAuth,
} from '@/utils/supabase/apiHelpers';

/**
 * GET /api/categories/[id]/fees/[feeId] - Get single fee
 *
 * @example Nested dynamic route with proper validation
 */
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{id: string; feeId: string}>}
) {
  return withAuth(async (user, supabase) => {
    const {id, feeId} = await params;
    const {data, error} = await supabase
      .from('category_membership_fees')
      .select('*, categories(name)')
      .eq('id', feeId)
      .eq('category_id', id)
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
export async function PATCH(
  request: NextRequest,
  {params}: {params: Promise<{id: string; feeId: string}>}
) {
  return withAdminAuth(async (user, supabase) => {
    const {id, feeId} = await params;
    const body = await request.json();
    const updateData = prepareUpdateData(body);

    // Verify the fee belongs to this category
    const {data: existingFee} = await supabase
      .from('category_membership_fees')
      .select('id')
      .eq('id', feeId)
      .eq('category_id', id)
      .single();

    if (!existingFee) {
      return errorResponse('Fee not found or does not belong to this category', 404);
    }

    const {data, error} = await supabase
      .from('category_membership_fees')
      .update(updateData)
      .eq('id', feeId)
      .eq('category_id', id)
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
  {params}: {params: Promise<{id: string; feeId: string}>}
) {
  return withAdminAuth(async (user, supabase) => {
    const {id, feeId} = await params;
    // Verify the fee belongs to this category before deleting
    const {data: existingFee} = await supabase
      .from('category_membership_fees')
      .select('id')
      .eq('id', feeId)
      .eq('category_id', id)
      .single();

    if (!existingFee) {
      return errorResponse('Fee not found or does not belong to this category', 404);
    }

    const {error} = await supabase
      .from('category_membership_fees')
      .delete()
      .eq('id', feeId)
      .eq('category_id', id);

    if (error) throw error;

    return NextResponse.json({success: true, error: null});
  });
}
