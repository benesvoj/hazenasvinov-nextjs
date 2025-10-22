/**
 * Hook for managing members - provides full CRUD operations
 * Follows entity-based naming convention (useMembers, not useMemberCreation)
 */
import {useCallback, useState} from 'react';

import {ValidationErrors} from '@/hooks';
import {API_ROUTES} from '@/lib';
import {MemberFunction} from '@/types';

export function useMemberFunctions() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Create a new function
   * @returns Full Function object
   */
  const createMemberFunction = useCallback(async (formData: MemberFunction): Promise<void> => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(API_ROUTES.members.functions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba při přidávání funkce');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);
}
