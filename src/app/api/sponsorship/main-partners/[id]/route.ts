import {NextRequest, NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

// GET - Fetch single main partner by ID
export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id} = await params;
    const supabase = await createClient();

    const {data, error} = await supabase.from('main_partners').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching main partner:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    if (!data) {
      return NextResponse.json({error: 'Partner not found'}, {status: 404});
    }

    return NextResponse.json({data});
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

// PUT - Update main partner
export async function PUT(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id} = await params;
    const supabase = await createClient();
    const body = await request.json();

    const {data, error} = await supabase
      .from('main_partners')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating main partner:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data});
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

// DELETE - Delete main partner
export async function DELETE(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id} = await params;
    const supabase = await createClient();

    const {error} = await supabase.from('main_partners').delete().eq('id', id);

    if (error) {
      console.error('Error deleting main partner:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({message: 'Partner deleted successfully'});
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
