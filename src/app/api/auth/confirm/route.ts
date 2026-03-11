import {redirect} from 'next/navigation';
import {type NextRequest} from 'next/server';

import {type EmailOtpType} from '@supabase/supabase-js';

import {APP_ROUTES} from '@/lib/app-routes';

import {supabaseServerClient} from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const code = searchParams.get('code');
  const token = searchParams.get('token');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? APP_ROUTES.public.home;

  // Handle token_hash, code, and token parameters
  const hasToken = !!(token_hash || code || token);
  const hasType = !!type;

  if (hasToken && hasType) {
    try {
      const supabase = await supabaseServerClient();

      let error;
      let result;

      if (token_hash) {
        // Handle token_hash (older format)
        result = await supabase.auth.verifyOtp({
          type,
          token_hash,
        });
        error = result.error;
      } else if (code) {
        // Handle code parameter (newer format)
        result = await supabase.auth.exchangeCodeForSession(code);
        error = result.error;
      } else if (token) {
        // Check if this is a PKCE token (starts with 'pkce_')
        if (token.startsWith('pkce_')) {
          // Redirect PKCE tokens to the callback page for proper handling
          const callbackUrl = new URL(APP_ROUTES.auth.callback, request.url);
          callbackUrl.searchParams.set('token', token);
          callbackUrl.searchParams.set('type', type || 'recovery');
          redirect(callbackUrl.toString());
        } else {
          // Try different approaches for regular token verification
          // First try as token_hash (most common for password reset)
          result = await supabase.auth.verifyOtp({
            type,
            token_hash: token,
          });
          error = result.error;
        }
      }

      if (!error) {
        // Handle different types of email confirmations
        try {
          if (type === 'recovery') {
            // Password reset - redirect to reset-password page
            redirect(APP_ROUTES.auth.resetPassword);
          } else if (type === 'signup' || type === 'invite') {
            // User invitation - redirect to set-password page
            redirect(APP_ROUTES.auth.setPassword);
          } else {
            // Other types - use the next parameter or default to home
            redirect(next);
          }
        } catch (redirectError) {
          // Check if this is a Next.js redirect (which throws NEXT_REDIRECT error)
          if (redirectError instanceof Error && redirectError.message === 'NEXT_REDIRECT') {
            // This is a redirect, not an actual error - re-throw it
            throw redirectError;
          }
          // If it's a real error, handle it
          throw redirectError;
        }
      } else {
        // Redirect to error page with proper error parameters
        const errorParams = new URLSearchParams({
          error: error.message,
          error_code: error.status?.toString() || 'unknown',
          error_description: error.message,
        });
        redirect(`${APP_ROUTES.auth.resetPassword}?${errorParams.toString()}`);
      }
    } catch (error) {
      // Check if this is a Next.js redirect (which throws NEXT_REDIRECT error)
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        // This is a redirect, not an actual error - re-throw it
        throw error;
      }

      console.error('Error in auth confirm route:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type,
        hasToken: !!(token_hash || code || token),
      });
      // Redirect to error page with proper error parameters
      const errorParams = new URLSearchParams({
        error: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'server_error',
        error_description: error instanceof Error ? error.message : 'Unknown error',
      });
      redirect(`${APP_ROUTES.auth.resetPassword}?${errorParams.toString()}`);
    }
  }

  // redirect the user to an error page with some instructions
  const errorParams = new URLSearchParams({
    error: 'Missing required parameters',
    error_code: 'missing_parameters',
    error_description:
      'The password reset link is missing required parameters. Please request a new password reset email.',
  });
  redirect(`${APP_ROUTES.auth.error}?${errorParams.toString()}`);
}
