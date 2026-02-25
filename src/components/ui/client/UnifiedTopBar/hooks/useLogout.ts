'use client';

import {useState} from 'react';

import {useRouter} from 'next/navigation';

import {showToast} from '@/components';
import {useAuth} from '@/hooks';
import {logLogout} from '@/utils';

// Logout timing constants
const LOGOUT_DELAYS = {
  STEP_DELAY: 300, // Delay between logout steps
  SUCCESS_DELAY: 500, // Delay after success message
  FINAL_DELAY: 3000, // Final delay before redirect
  RETRY_MESSAGE_DELAY: 2000, // Delay before showing retry message
} as const;

export function useLogout() {
  const router = useRouter();
  const {user, signOut} = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(0);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);
    setLogoutProgress(0);
    setLogoutError(null); // Clear any previous errors

    try {
      // Step 1: Logging logout
      setLogoutProgress(25);
      if (user?.email) {
        try {
          await logLogout(user.email);
        } catch (logError) {
          console.error('Failed to log logout:', logError);
          // Don't show error toast for logging failure, just continue with logout
        }
      }

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, LOGOUT_DELAYS.STEP_DELAY));

      // Step 2: Sign out
      setLogoutProgress(50);
      await signOut();

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, LOGOUT_DELAYS.STEP_DELAY));

      // Step 3: Show success message
      setLogoutProgress(75);
      showToast.success('Úspěšně odhlášen. Přesměrovávám...');

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, LOGOUT_DELAYS.SUCCESS_DELAY));

      // Step 4: Complete and redirect
      setLogoutProgress(100);
      setTimeout(() => {
        router.push('/login');
      }, LOGOUT_DELAYS.FINAL_DELAY);
    } catch (error) {
      console.error('Logout error:', error);

      // Determine error type and message
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch');
      const isAuthError = errorMessage.includes('auth') || errorMessage.includes('unauthorized');

      let userMessage = 'Chyba při odhlašování.';
      if (isNetworkError) {
        userMessage = 'Problém s připojením. Zkuste to znovu.';
      } else if (isAuthError) {
        userMessage = 'Problém s autentizací. Zkuste obnovit stránku.';
      }

      setLogoutError(errorMessage);
      showToast.danger(userMessage);

      // Reset UI state but keep user logged in for retry
      setIsLoggingOut(false);
      setLogoutProgress(0);

      // Show retry option after a short delay
      setTimeout(() => {
        showToast.warning('Klikněte na "Odhlásit" pro opakování pokusu.');
      }, LOGOUT_DELAYS.RETRY_MESSAGE_DELAY);
    }
  };

  const cancelLogout = () => {
    setIsLoggingOut(false);
    setLogoutError(null);
    setLogoutProgress(0);
  };

  return {
    isLoggingOut,
    logoutProgress,
    logoutError,
    handleLogout,
    cancelLogout,
  };
}
