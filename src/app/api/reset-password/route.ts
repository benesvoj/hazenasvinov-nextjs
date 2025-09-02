import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const redirectUrl = `${origin}/auth/confirm`;
    
    console.log('Sending password reset email to:', email);
    console.log('Redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset email sent successfully',
      redirectUrl: redirectUrl
    });

  } catch (error) {
    console.error('Error in reset-password API:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
