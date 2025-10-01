import {createClient} from '@/utils/supabase/client';

import {Category} from '@/types';

const supabase = createClient();

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
