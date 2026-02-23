import {NextResponse} from 'next/server';

import {supabaseServerClient} from '@/utils/supabase/server';

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const offset = (page - 1) * limit;

  // Get filter parameters
  const search = searchParams.get('search');
  const sex = searchParams.get('sex');
  const categoryId = searchParams.get('category_id');
  const functionFilter = searchParams.get('function');

  try {
    const supabase = await supabaseServerClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Build query
    let query = supabase
      .from('members_internal')
      .select('*', {count: 'exact'})
      .order('surname', {ascending: true});

    // Apply search filter
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,surname.ilike.%${search}%,registration_number.ilike.%${search}%`
      );
    }

    // Apply sex filter
    if (sex && sex !== '' && sex !== 'EMPTY') {
      query = query.eq('sex', sex);
    }

    // Apply category filter
    if (categoryId && categoryId !== '') {
      query = query.eq('category_id', categoryId);
    }

    // Apply function filter (requires JSON contains check)
    if (functionFilter && functionFilter !== '') {
      query = query.contains('functions', [functionFilter]);
    }

    // Apply pagination
    const {data, error, count} = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching members internal:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({
      data,
      pagination: {page, limit, total: count},
      error: null,
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
