import {NextRequest, NextResponse} from 'next/server';

import {supabaseServerClient} from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServerClient();
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        user: null,
      });
    }

    // Get user profile
    const {data: profile, error: profileError} = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id);

    // Get user roles (legacy)
    const {data: roles, error: roleError} = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        email_confirmed: !!user.email_confirmed_at,
      },
      profiles: profile || [],
      roles: roles || [],
      errors: {
        profile: profileError?.message,
        roles: roleError?.message,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
