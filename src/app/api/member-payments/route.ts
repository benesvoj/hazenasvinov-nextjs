import {NextRequest, NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const memberId = searchParams.get('member_id');
  const year = searchParams.get('year');

  if (!memberId) {
    return NextResponse.json({error: 'Missing member_id'}, {status: 400});
  }

  try {
    let query = supabase.from('membership_fee_payments').select('*').eq('member_id', memberId);

    if (year) {
      query = query.eq('calendar_year', year);
    }

    const {data, error} = await query.order('payment_date', {ascending: false});

    if (error) throw error;

    return NextResponse.json({data}, {status: 200});
  } catch (error) {
    console.error('Error fetching member payments:', error);
    return NextResponse.json({error: 'Failed to fetch member payments'}, {status: 500});
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

    const {data, error} = await supabase
      .from('membership_fee_payments')
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
    console.error('Error creating payment:', error);
    return NextResponse.json({error: 'Failed to create payment'}, {status: 500});
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
      .from('membership_fee_payments')
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
    console.error('Error updating payment:', error);
    return NextResponse.json({error: 'Failed to update payment'}, {status: 500});
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({error: 'Missing payment ID'}, {status: 400});
  }

  try {
    const {error} = await supabase.from('membership_fee_payments').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({success: true}, {status: 200});
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({error: 'Failed to delete payment'}, {status: 500});
  }
}
