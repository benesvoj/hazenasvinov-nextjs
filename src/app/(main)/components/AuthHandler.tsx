'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthFromFragment = async () => {
      try {
        // Check if we have authentication parameters in the URL fragment
        const hash = window.location.hash.substring(1); // Remove the # character
        if (!hash) return;

        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('token_type');
        const type = hashParams.get('type');
        const expiresIn = hashParams.get('expires_in');
        const expiresAt = hashParams.get('expires_at');

        console.log('AuthHandler detected URL fragment:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          tokenType,
          type,
          expiresIn,
          expiresAt
        });

        if (accessToken && refreshToken) {
          const supabase = createClient();
          
          console.log('Setting session from URL fragment');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session from URL fragment:', error);
            return;
          }

          console.log('Session set successfully, redirecting based on type:', type);
          
          // Clear the URL fragment
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          
          // Handle different types of email confirmations
          if (type === 'recovery') {
            // Password reset - redirect to reset-password page
            console.log('Redirecting to reset-password page');
            router.push('/reset-password');
          } else if (type === 'invite' || type === 'signup') {
            // User invitation - redirect to set-password page
            console.log('Redirecting to set-password page');
            router.push('/set-password');
          } else {
            // Default redirect to admin dashboard
            console.log('Redirecting to admin dashboard');
            router.push('/admin');
          }
        }
      } catch (error) {
        console.error('Error in AuthHandler:', error);
      }
    };

    handleAuthFromFragment();
  }, [router]);

  // This component doesn't render anything
  return null;
}
