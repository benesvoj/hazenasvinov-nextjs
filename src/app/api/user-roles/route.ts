import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch role summaries from the secure view
    const { data: roleData, error: roleError } = await supabase
      .from('user_role_summary')
      .select('*')
      .order('user_id');

    if (roleError) {
      console.error('Error fetching role data:', roleError);
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    // Fetch user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, role')
      .in('user_id', (roleData || []).map((r: any) => r.user_id));

    if (profileError) {
      console.error('Error fetching profile data:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Get user emails from auth.users (using service role)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: usersData, error: usersError } = await serviceSupabase.auth.admin.listUsers();
    
    if (usersError) {
      console.warn('Could not fetch user emails:', usersError.message);
    }

    // Merge the data
    const enrichedData = (roleData || []).map((role: any) => {
      const profile = (profileData || []).find((p: any) => p.user_id === role.user_id);
      const user = usersData?.users?.find((u: any) => u.id === role.user_id);
      
      return {
        ...role,
        id: role.user_id, // Include user_id as id for compatibility
        email: user?.email || 'Neznámý email',
        full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Neznámý uživatel'
      };
    });

    return NextResponse.json({ data: enrichedData });
  } catch (error) {
    console.error('Error in user-roles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
