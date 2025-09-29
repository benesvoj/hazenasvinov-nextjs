import {NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {name, display_name, description, sort_order} = await body;

    // Validate required fields
    if (!name || !display_name) {
      return NextResponse.json({error: 'Name and display_name are required'}, {status: 400});
    }

    // First, check if the table exists
    const {error: tableCheckError} = await supabaseAdmin
      .from('member_functions')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      console.error('Table check error:', tableCheckError);
      return NextResponse.json(
        {
          error: 'Member functions table not found. Please run the setup script first.',
          details: tableCheckError.message,
        },
        {status: 500}
      );
    }

    // Insert the new function
    const {data, error} = await supabaseAdmin
      .from('member_functions')
      .insert({
        name,
        display_name,
        description: description || null,
        sort_order: sort_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member function:', error);
      return NextResponse.json(
        {
          error: 'Failed to create member function',
          details: error.message,
          code: error.code,
        },
        {status: 500}
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error creating member function:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {id, name, display_name, description, sort_order, is_active} = body;

    // Validate required fields
    if (!id || !name || !display_name) {
      return NextResponse.json({error: 'ID, name, and display_name are required'}, {status: 400});
    }

    const {data, error} = await supabaseAdmin
      .from('member_functions')
      .update({
        name,
        display_name,
        description: description || null,
        sort_order: sort_order || 0,
        is_active: is_active !== undefined ? is_active : true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member function:', error);
      return NextResponse.json({error: 'Failed to update member function'}, {status: 500});
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error updating member function:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function DELETE(request: Request) {
  try {
    const {searchParams} = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({error: 'ID is required'}, {status: 400});
    }

    const {error} = await supabaseAdmin.from('member_functions').delete().eq('id', id);

    if (error) {
      console.error('Error deleting member function:', error);
      return NextResponse.json({error: 'Failed to delete member function'}, {status: 500});
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Unexpected error deleting member function:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
