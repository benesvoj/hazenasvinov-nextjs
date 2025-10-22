import {NextRequest} from 'next/server';

import {successResponse, withAuth} from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('committees')
      .select('*')
      .order('sort_order', {ascending: true});

    if (error) throw error;

    return successResponse(data);
  });
}
