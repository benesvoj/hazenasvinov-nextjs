import { createClient } from "@/utils/supabase/server";

export const getCategoryMatchweeks = async (categoryId: string) => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("categories")
    .select("matchweek_count")
    .eq("id", categoryId)
    .single();

  if (error) throw error;

  return data?.matchweek_count || 0;
};
