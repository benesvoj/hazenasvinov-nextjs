'use client';
import {useState, useCallback, useEffect} from 'react';

import {showToast} from '@/components';
import {translations} from '@/lib';
import {MembershipFeePayment, CreatePaymentData, UpdatePaymentData} from '@/types';

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
        ? `/api/member-payments?member_id=${memberId}&year=${year}`
        : `/api/member-payments?member_id=${memberId}`;

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
    async (paymentData: CreatePaymentData) => {
      try {
        const response = await fetch('/api/member-payments', {
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
    async (paymentData: UpdatePaymentData) => {
      try {
        const response = await fetch('/api/member-payments', {
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
        const response = await fetch(`/api/member-payments?id=${paymentId}`, {
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
