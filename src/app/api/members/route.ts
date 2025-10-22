import {NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';
import {createClient} from '@/utils/supabase/server';

/**
 * GET /api/members - List all members (already rexists via other routes, optional without any condition)
 * @param request
 * @constructor
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase
      .from('members')
      .select('*')
      .order('surname', {ascending: true});

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

/**
 *  POST /api/members - Create new member
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const {
      data: {user},
    } = await supabaseAdmin.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {name, surname, registration_number, date_of_birth, sex, functions, category_id} = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({error: 'Jméno je povinné'}, {status: 400});
    }
    if (!surname?.trim()) {
      return NextResponse.json({error: 'Příjmení je povinné'}, {status: 400});
    }
    if (!registration_number?.trim()) {
      return NextResponse.json({error: 'Registrační číslo je povinné'}, {status: 400});
    }

    // Insert member
    const {data, error} = await supabaseAdmin
      .from('members')
      .insert({
        name: name.trim(),
        surname: surname.trim(),
        registration_number: registration_number.trim(),
        date_of_birth: date_of_birth ?? null,
        sex,
        functions,
        category_id: category_id ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      return NextResponse.json(
        {error: `Chyba při vytváření člena: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({data, error: null}, {status: 201});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
