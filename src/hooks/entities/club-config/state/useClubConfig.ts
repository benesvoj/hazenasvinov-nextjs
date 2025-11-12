'use client';

import {useState, useCallback} from 'react';

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";
import {UpdateClubConfig} from '@/types';

export function useClubConfig() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update club configuration
  const updateClubConfig = useCallback(
    async (id: string, data: Partial<UpdateClubConfig>) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_ROUTES.clubConfig.byId(id), {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });

        const response = await res.json();


        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to update club configuration');
        }

        showToast.success('Club configuration updated successfully');
        return response;
      } catch (err) {
        console.error('Error updating club config:', err);
        showToast.danger('Club configuration update failed');
      } finally {
        setLoading(false);
      }
    }, []
  );

  return {
    loading,
    error,
    updateClubConfig,
  };
}
