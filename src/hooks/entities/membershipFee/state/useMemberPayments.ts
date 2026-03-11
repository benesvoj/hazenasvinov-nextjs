'use client';

import {useState, useCallback, useEffect} from 'react';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {showToast} from '@/components';
import {
  MembershipFeePayment,
  CreateMembershipFeePayment,
  UpdateMembershipFeePayment,
} from '@/types';

export const useMemberPayments = (memberId: string, year?: number) => {
  const [payments, setPayments] = useState<MembershipFeePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations.membershipFees;

  const loadPayments = useCallback(async () => {
    if (!memberId) return;

    setLoading(true);
    setError(null);

    try {
      const url = year
        ? `${API_ROUTES.memberPayments}?member_id=${memberId}&year=${year}`
        : `${API_ROUTES.memberPayments}?member_id=${memberId}`;

      const response = await fetch(url);
      const {data, error} = await response.json();

      if (error) throw new Error(error);

      setPayments(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payments';
      setError(errorMessage);
      showToast.danger(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [memberId, year]);

  const createPayment = useCallback(
    async (paymentData: CreateMembershipFeePayment) => {
      try {
        const response = await fetch(API_ROUTES.memberPayments, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(paymentData),
        });

        const {data, error} = await response.json();

        if (error) throw new Error(error);

        showToast.success(t.toasts.paymentsCreated);
        await loadPayments();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
        showToast.danger(errorMessage);
        throw err;
      }
    },
    [loadPayments, t.toasts.paymentsCreated]
  );

  const updatePayment = useCallback(
    async (paymentData: UpdateMembershipFeePayment) => {
      try {
        const response = await fetch(API_ROUTES.memberPayments, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(paymentData),
        });

        const {data, error} = await response.json();

        if (error) throw new Error(error);

        showToast.success(t.toasts.paymentsUpdated);
        await loadPayments();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update payment';
        showToast.danger(errorMessage);
        throw err;
      }
    },
    [loadPayments, t.toasts.paymentsUpdated]
  );

  const deletePayment = useCallback(
    async (paymentId: string) => {
      try {
        const response = await fetch(`${API_ROUTES.memberPayments}?id=${paymentId}`, {
          method: 'DELETE',
        });

        const {error} = await response.json();

        if (error) throw new Error(error);

        showToast.success(t.toasts.paymentsDeleted);
        await loadPayments();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment';
        showToast.danger(errorMessage);
        throw err;
      }
    },
    [loadPayments, t.toasts.paymentsDeleted]
  );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return {
    payments,
    loading,
    error,
    loadPayments,
    createPayment,
    updatePayment,
    deletePayment,
  };
};
