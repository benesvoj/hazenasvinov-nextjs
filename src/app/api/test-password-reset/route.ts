import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the origin from the request headers or use environment variable
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUrl = `${origin}/auth/confirm`;
    
    console.log('Test password reset - Origin detected:', origin);
    console.log('Test password reset - Redirect URL:', redirectUrl);
    
    // Test with a dummy email to see what happens
    const testEmail = 'test@example.com';
    
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: redirectUrl
    });

    if (error) {
      console.error('Test password reset error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          origin,
          redirectUrl,
          errorCode: error.status,
          errorMessage: error.message
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test password reset email would be sent successfully',
      details: {
        origin,
        redirectUrl,
        testEmail
      }
    });

  } catch (error) {
    console.error('Error in test password reset:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test password reset', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
