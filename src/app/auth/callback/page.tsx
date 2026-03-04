'use client';

import {useEffect} from 'react';

import {useRouter} from 'next/navigation';

import {LoadingSpinner} from '@/components';
import {useSupabaseClient} from '@/hooks';
import {APP_ROUTES} from '@/lib';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check for error parameters
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');

        // Check for PKCE tokens in query parameters
        const searchParams = new URLSearchParams(window.location.search);
        const pkceToken = searchParams.get('token');
        const pkceType = searchParams.get('type');
        const pkceCode = searchParams.get('code');

        // Handle error cases first
        if (error) {
          console.error('Auth callback error:', {error, errorCode, errorDescription});
          // Redirect to error page with error parameters
          const errorParams = new URLSearchParams({
            error,
            error_code: errorCode || 'unknown',
            error_description: errorDescription || error,
          });
          router.push(`${APP_ROUTES.auth.error}?${errorParams.toString()}`);
          return;
        }

        // Handle PKCE tokens from query parameters
        if (pkceToken || pkceCode) {
          try {
            let result;
            let error;

            if (pkceCode) {
              // Handle code parameter (newer PKCE format)
              result = await supabase.auth.exchangeCodeForSession(pkceCode);
              error = result.error;
            } else if (pkceToken) {
              // Handle token parameter (email template format)
              result = await supabase.auth.exchangeCodeForSession(pkceToken);
              error = result.error;
            }

            if (error) {
              console.error('PKCE exchange failed:', error);
              const errorParams = new URLSearchParams({
                error: error.message,
                error_code: error.status?.toString() || 'pkce_exchange_failed',
                error_description: error.message,
              });
              router.push(`${APP_ROUTES.auth.error}?${errorParams.toString()}`);
              return;
            }

            // Ensure user has a profile before proceeding
            if (result.data && result.data.user) {
              try {
                // Use the safe profile function to ensure profile exists
                const {error: profileError} = await supabase.rpc('get_user_profile_safe', {
                  user_uuid: result.data.user.id,
                });

                if (profileError) {
                  console.error('Error ensuring user profile:', profileError);
                  // Continue anyway, the trigger should have created the profile
                }
              } catch (err) {
                console.error('Error in profile creation fallback:', err);
                // Continue anyway
              }
            }

            // Check if this is an invitation (signup) or password reset
            if (pkceType === 'invite' || pkceType === 'signup') {
              // Redirect to set-password page for new users
              router.push(APP_ROUTES.auth.setPassword);
            } else if (pkceType === 'recovery') {
              // Redirect to reset-password page for password reset
              router.push(APP_ROUTES.auth.resetPassword);
            } else {
              // Default redirect to admin dashboard
              router.push(APP_ROUTES.admin.root);
            }
            return;
          } catch (err) {
            console.error('Error processing PKCE token:', err);
            const errorParams = new URLSearchParams({
              error: err instanceof Error ? err.message : 'PKCE processing failed',
              error_code: 'pkce_processing_error',
              error_description: err instanceof Error ? err.message : 'PKCE processing failed',
            });
            router.push(`${APP_ROUTES.auth.error}?${errorParams.toString()}`);
            return;
          }
        }

        if (accessToken && refreshToken) {
          // Set the session using the tokens from the URL
          const {data, error} = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            router.push(APP_ROUTES.auth.error);
            return;
          }

          // Ensure user has a profile before proceeding
          if (data && data.user) {
            try {
              // Use the safe profile function to ensure profile exists
              const {error: profileError} = await supabase.rpc('get_user_profile_safe', {
                user_uuid: data.user.id,
              });

              if (profileError) {
                console.error('Error ensuring user profile:', profileError);
                // Continue anyway, the trigger should have created the profile
              }
            } catch (err) {
              console.error('Error in profile creation fallback:', err);
              // Continue anyway
            }
          } else {
            console.error('No user data in session:', data);
            router.push(APP_ROUTES.auth.error);
            return;
          }

          // Check if this is an invitation (signup) or password reset
          if (type === 'invite' || type === 'signup') {
            // Redirect to set-password page for new users
            router.push(APP_ROUTES.auth.setPassword);
          } else if (type === 'recovery') {
            // Redirect to reset-password page for password reset
            router.push(APP_ROUTES.auth.resetPassword);
          } else {
            // Default redirect to admin dashboard
            router.push(APP_ROUTES.admin.root);
          }
        } else {
          console.error('Missing required tokens in URL');
          // Check if we have any hash parameters at all
          router.push(APP_ROUTES.auth.error);
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push(APP_ROUTES.auth.error);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner label={'Dokončování přihlášení...'} />
        <p className="text-gray-600 dark:text-gray-400">
          Prosím počkejte, dokud vás nepřesměrujeme.
        </p>
      </div>
    </div>
  );
}
