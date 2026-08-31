import {SupabaseClient} from '@supabase/supabase-js';

import {successResponse, withPublicAccess} from '@/utils/supabase/apiHelpers';

import {getOwnClubActiveSeasonCategories} from '@/queries/categories';

/**
 * GET /api/categories/active — categories the own club fields this season.
 *
 * Public, because the home page and the menu are public. It answers the
 * question those two actually have — "which categories are we playing right
 * now" — which `/api/entities/categories` cannot: that returns every row, so
 * Ženy kept a tab and a menu entry in a season the club is not entering,
 * rendering an empty table behind both.
 */
export async function GET() {
  return withPublicAccess(async (supabase: SupabaseClient) => {
    const result = await getOwnClubActiveSeasonCategories({supabase});

    if (result.error) throw new Error(result.error);

    return successResponse(result.data);
  });
}
