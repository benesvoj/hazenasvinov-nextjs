import {supabaseBrowserClient} from '@/utils';

export const getCategoryMatchweeks = async (categoryId: string) => {
  const supabase = await supabaseBrowserClient();

  const {data, error} = await supabase
    .from('categories')
    .select('matchweek_count')
    .eq('id', categoryId)
    .single();

  if (error) {
    // If the column doesn't exist, return a default value
    if (
      error.code === 'PGRST116' ||
      (error.message.includes('column') && error.message.includes('does not exist'))
    ) {
      console.warn("matchweek_count column doesn't exist, using default value");
      return 20; // Default to 20 matchweeks
    }
    throw error;
  }

  return data?.matchweek_count || 20; // Default to 20 if not set
};
