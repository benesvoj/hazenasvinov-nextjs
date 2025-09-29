'use client';

import {useEffect} from 'react';

import {useRouter} from 'next/navigation';

import {createClient} from '@/utils/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();

        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('token_type');
        const type = hashParams.get('type');
        const expiresIn = hashParams.get('expires_in');
        const expiresAt = hashParams.get('expires_at');

        // Also check for error parameters
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');

        // Check for PKCE tokens in query parameters
        const searchParams = new URLSearchParams(window.location.search);
        const pkceToken = searchParams.get('token');
        const pkceType = searchParams.get('type');
        const pkceCode = searchParams.get('code');

        console.log('Auth callback received:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          tokenType,
          type,
          expiresIn,
          expiresAt,
          error,
          errorCode,
          errorDescription,
          hasPkceToken: !!pkceToken,
          hasPkceCode: !!pkceCode,
          pkceType,
          fullUrl: window.location.href,
          hash: window.location.hash,
          search: window.location.search,
        });

        // Handle error cases first
        if (error) {
          console.error('Auth callback error:', {error, errorCode, errorDescription});
          // Redirect to error page with error parameters
          const errorParams = new URLSearchParams({
            error,
            error_code: errorCode || 'unknown',
            error_description: errorDescription || error,
          });
          router.push(`/error?${errorParams.toString()}`);
          return;
        }

        // Handle PKCE tokens from query parameters
        if (pkceToken || pkceCode) {
          console.log('Processing PKCE token/code:', {
            hasToken: !!pkceToken,
            hasCode: !!pkceCode,
            type: pkceType,
            tokenLength: pkceToken?.length,
            codeLength: pkceCode?.length,
          });

          try {
            let result;
            let error;

            if (pkceCode) {
              // Handle code parameter (newer PKCE format)
              console.log('Exchanging PKCE code for session');
              result = await supabase.auth.exchangeCodeForSession(pkceCode);
              error = result.error;
            } else if (pkceToken) {
              // Handle token parameter (email template format)
              console.log('Exchanging PKCE token for session');
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
              router.push(`/error?${errorParams.toString()}`);
              return;
            }

            console.log('PKCE exchange successful:', {
              user: result.data?.user?.id,
              session: !!result.data?.session,
            });

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
                } else {
                  console.log('User profile ensured');
                }
              } catch (err) {
                console.error('Error in profile creation fallback:', err);
                // Continue anyway
              }
            }

            // Check if this is an invitation (signup) or password reset
            if (pkceType === 'invite' || pkceType === 'signup') {
              // Redirect to set-password page for new users
              console.log('Redirecting to set-password page');
              router.push('/set-password');
            } else if (pkceType === 'recovery') {
              // Redirect to reset-password page for password reset
              console.log('Redirecting to reset-password page');
              router.push('/reset-password');
            } else {
              // Default redirect to admin dashboard
              console.log('Redirecting to admin dashboard (type:', pkceType, ')');
              router.push('/admin');
            }
            return;
          } catch (err) {
            console.error('Error processing PKCE token:', err);
            const errorParams = new URLSearchParams({
              error: err instanceof Error ? err.message : 'PKCE processing failed',
              error_code: 'pkce_processing_error',
              error_description: err instanceof Error ? err.message : 'PKCE processing failed',
            });
            router.push(`/error?${errorParams.toString()}`);
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
            router.push('/error');
            return;
          }

          console.log('Session set successfully:', data);

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
              } else {
                console.log('User profile ensured');
              }
            } catch (err) {
              console.error('Error in profile creation fallback:', err);
              // Continue anyway
            }
          } else {
            console.error('No user data in session:', data);
            router.push('/error');
            return;
          }

          // Check if this is an invitation (signup) or password reset
          if (type === 'invite' || type === 'signup') {
            // Redirect to set-password page for new users
            console.log('Redirecting to set-password page');
            router.push('/set-password');
          } else if (type === 'recovery') {
            // Redirect to reset-password page for password reset
            console.log('Redirecting to reset-password page');
            router.push('/reset-password');
          } else {
            // Default redirect to admin dashboard
            console.log('Redirecting to admin dashboard (type:', type, ')');
            router.push('/admin');
          }
        } else {
          console.error('Missing required tokens in URL');
          // Check if we have any hash parameters at all
          const hasAnyParams = hashParams.toString().length > 0;
          if (hasAnyParams) {
            console.log(
              'Hash parameters found but no tokens:',
              Object.fromEntries(hashParams.entries())
            );
          }
          router.push('/error');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Dokončování přihlášení...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Prosím počkejte, dokud vás nepřesměrujeme.
        </p>
      </div>
    </div>
  );
}
