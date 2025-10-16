import {useState, useCallback, useEffect} from 'react';

import {showToast} from '@/components';
import {MemberPaymentStatus} from '@/types';

export const usePaymentStatus = () => {
  const [statusData, setStatusData] = useState<MemberPaymentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/member-payment-status');
      const {data, error} = await response.json();

      if (error) throw new Error(error);

      setStatusData(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payment status';
      setError(errorMessage);
      showToast.danger(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    statusData,
    loading,
    error,
    loadStatus,
  };
};
