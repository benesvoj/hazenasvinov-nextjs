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
    
    // Get the origin from the request headers or use environment variable
    const origin = process.env.NODE_ENV === 'production' 
      ? 'https://www.hazenasvinov.cz'
      : (request.headers.get('origin') || process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    
    console.log('Simple password reset for:', email);
    console.log('Origin detected:', origin);
    
    // Use the admin client to send a password reset email
    // This should use the traditional OTP flow instead of PKCE
    const { error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${origin}/auth/confirm`
      }
    });

    if (error) {
      console.error('Admin generateLink error:', error);
      // Fallback to regular resetPasswordForEmail
      const { error: fallbackError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/confirm`
      });
      
      if (fallbackError) throw fallbackError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset email sent successfully',
      method: error ? 'fallback' : 'admin'
    });

  } catch (error) {
    console.error('Error in simple reset-password API:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
