'use client';
import {useState, useEffect} from 'react';

import {showToast} from '@/components';
import {MemberPaymentStatus} from '@/types';

export const usePaymentStatus = () => {
  const [statusData, setStatusData] = useState<MemberPaymentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/member-payment-status');
        const {data, error} = await response.json();

        if (error) throw new Error(error);

        if (isMounted) {
          setStatusData(data || []);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load payment status';
        if (isMounted) {
          setError(errorMessage);
          showToast.danger(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  return {
    statusData,
    loading,
    error,
  };
};
