import {NextRequest, NextResponse} from 'next/server';

import {supabaseServerClient} from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {email} = body;

    if (!email) {
      return NextResponse.json({error: 'Email is required'}, {status: 400});
    }

    const supabase = await supabaseServerClient();

    // Get the origin from the request headers or use environment variable
    // In production, we should always use the production URL
    const origin =
      process.env.NODE_ENV === 'production'
        ? 'https://www.hazenasvinov.cz'
        : request.headers.get('origin') ||
          process.env.NEXT_PUBLIC_PRODUCTION_URL ||
          process.env.NEXT_PUBLIC_BASE_URL ||
          'http://localhost:3000';
    const redirectUrl = `${origin}/api/auth/confirm`;

    console.log('Sending password reset email to:', email);
    console.log('Origin detected:', origin);
    console.log('Redirect URL:', redirectUrl);
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Environment:', process.env.NODE_ENV);

    // Try to force OTP flow by using a different approach
    const {error} = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
      captchaToken: undefined, // Disable captcha for now
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
      redirectUrl: redirectUrl,
    });
  } catch (error) {
    console.error('Error in reset-password API:', error);
    return NextResponse.json(
      {
        error: 'Failed to send password reset email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500}
    );
  }
}
