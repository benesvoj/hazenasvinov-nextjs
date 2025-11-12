import {NextRequest, NextResponse} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {Category} from '@/types';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', {ascending: true})
      .order('name', {ascending: true});

    if (error) throw error;

    return successResponse(data);
  });
}

/**
 *  POST request to create a new category in system
 * @param request
 * @constructor
 */

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body: Category = await request.json();
    const {data, error} = await admin
      .from('categories')
      .insert({
        ...body,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({data}, {status: 201});
  });
}
