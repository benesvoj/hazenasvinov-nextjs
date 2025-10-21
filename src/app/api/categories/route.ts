import {NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';

import {Category} from '@/types';
import {createClient} from '@/utils';

const supabase = createClient();

export async function GET() {
  const {data, error} = await supabaseAdmin.from('categories').select('*');

  if (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({error: 'Failed to fetch data'}, {status: 500});
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const {
    name,
    description,
    age_group,
    gender,
    is_active,
    sort_order,
    slug,
    updated_at,
    id,
  }: Category = await request.json();
  const {error} = await supabase
    .from('categories')
    .update({
      name: name,
      description: description || '',
      slug: slug || '',
      update_at: updated_at,
      age_group: age_group || '',
      gender: gender || '',
      is_active: is_active || false,
      sort_order: sort_order || 0,
    })
    .eq('id', id);

  if (error) {
    console.log(error);
    throw new Error('Update failed: ' + error.message);
  }
}
