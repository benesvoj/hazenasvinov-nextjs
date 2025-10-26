'use client';
import {useState, useEffect, useCallback} from 'react';

import {useUserRoles} from '@/hooks/entities/user/useUserRoles';

export interface PortalAccess {
  hasAdminAccess: boolean;
  hasCoachAccess: boolean;
  hasBothAccess: boolean;
  loading: boolean;
}

export function usePortalAccess() {
  const [access, setAccess] = useState<PortalAccess>({
    hasAdminAccess: false,
    hasCoachAccess: false,
    hasBothAccess: false,
    loading: true,
  });
  const {hasRole} = useUserRoles();

  const checkAccess = useCallback(async () => {
    try {
      setAccess((prev) => ({...prev, loading: true}));

      const [isAdmin, isCoach] = await Promise.all([hasRole('admin'), hasRole('coach')]);

      const hasBothAccess = isAdmin && isCoach;

      setAccess({
        hasAdminAccess: isAdmin,
        hasCoachAccess: isCoach,
        hasBothAccess,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking portal access:', error);
      setAccess({
        hasAdminAccess: false,
        hasCoachAccess: false,
        hasBothAccess: false,
        loading: false,
      });
    }
  }, [hasRole]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {...access, refreshAccess: checkAccess};
}
