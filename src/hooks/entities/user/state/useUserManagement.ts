'use client';

import {useCallback, useState} from 'react';

import {CreateUserData, CreateUserResult, OperationResult} from '@/types';

export function useUserManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(async (userData: CreateUserData): Promise<CreateUserResult> => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/manage-users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'create',
          userData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      return {
        success: true,
        userId: data.userId,
        userEmail: data.userEmail,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {success: false, error: errorMessage};
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateUser = useCallback(
    async (userId: string, userData: Partial<CreateUserData>): Promise<OperationResult> => {
      try {
        setIsUpdating(true);
        setError(null);

        const response = await fetch('/api/manage-users', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            action: 'update',
            userId,
            userData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update user');
        }

        return {success: true};
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return {success: false, error: errorMessage};
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const toggleUserBlock = useCallback(async (userId: string): Promise<OperationResult> => {
    try {
      setIsTogglingBlock(true);
      setError(null);

      const response = await fetch('/api/manage-users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'toggleBlock',
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle user status');
      }

      return {success: true};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {success: false, error: errorMessage};
    } finally {
      setIsTogglingBlock(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<OperationResult> => {
    try {
      setIsResettingPassword(true);
      setError(null);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset');
      }

      return {success: true};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {success: false, error: errorMessage};
    } finally {
      setIsResettingPassword(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    // Actions
    createUser,
    updateUser,
    toggleUserBlock,
    resetPassword,

    // Loading states
    isCreating,
    isUpdating,
    isTogglingBlock,
    isResettingPassword,
    isLoading: isCreating || isUpdating || isTogglingBlock || isResettingPassword,

    // Error handling
    error,
    clearError,
  };
}
