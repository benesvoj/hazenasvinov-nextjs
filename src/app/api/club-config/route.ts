import {NextRequest} from 'next/server';

import {SupabaseClient} from '@supabase/supabase-js';

import {successResponse, withPublicAccess} from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest) {
  return withPublicAccess(async (supabase: SupabaseClient) => {
    const {data, error} = await supabase
      .from('club_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) throw error;

    return successResponse(data);
  });
}
