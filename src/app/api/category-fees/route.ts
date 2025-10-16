import {NextRequest, NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('category_id');
  const year = searchParams.get('year') || new Date().getFullYear();

  try {
    let query = supabase
      .from('category_membership_fees')
      .select('*, categories(name)')
      .eq('calendar_year', year)
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const {data, error} = await query.order('fee_amount', {ascending: false});

    if (error) throw error;

    return NextResponse.json({data}, {status: 200});
  } catch (error) {
    console.error('Error fetching category fees:', error);
    return NextResponse.json({error: 'Failed to fetch category fees'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const {data: userData} = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Check if user is admin
    const {data: profile} = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({error: 'Forbidden'}, {status: 403});
    }

    const {data, error} = await supabase
      .from('category_membership_fees')
      .insert({
        ...body,
        created_by: userData.user.id,
        updated_by: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({data}, {status: 201});
  } catch (error) {
    console.error('Error creating category fee:', error);
    return NextResponse.json({error: 'Failed to create category fee'}, {status: 500});
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const {id, ...updates} = body;

    const {data: userData} = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase
      .from('category_membership_fees')
      .update({
        ...updates,
        updated_by: userData.user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({data}, {status: 200});
  } catch (error) {
    console.error('Error updating category fee:', error);
    return NextResponse.json({error: 'Failed to update category fee'}, {status: 500});
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({error: 'Missing fee ID'}, {status: 400});
  }

  try {
    const {error} = await supabase.from('category_membership_fees').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({success: true}, {status: 200});
  } catch (error) {
    console.error('Error deleting category fee:', error);
    return NextResponse.json({error: 'Failed to delete category fee'}, {status: 500});
  }
}
