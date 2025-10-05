'use client';

import {useState, useEffect, useCallback} from 'react';

import {ClubConfig} from '@/types';

export function useClubConfig() {
  const [clubConfig, setClubConfig] = useState<ClubConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch club configuration
  const fetchClubConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/club-config');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch club configuration');
      }

      setClubConfig(result.data || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching club config:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch club configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update club configuration
  const updateClubConfig = useCallback(
    async (configData: Partial<ClubConfig>) => {
      try {
        const response = await fetch('/api/club-config', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(configData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update club configuration');
        }

        await fetchClubConfig(); // Refresh data
        return result.data;
      } catch (err) {
        console.error('Error updating club config:', err);
        throw err;
      }
    },
    [fetchClubConfig]
  );

  // Fetch config on mount
  useEffect(() => {
    fetchClubConfig();
  }, [fetchClubConfig]);

  return {
    clubConfig,
    loading,
    error,
    fetchClubConfig,
    updateClubConfig,
  };
}
