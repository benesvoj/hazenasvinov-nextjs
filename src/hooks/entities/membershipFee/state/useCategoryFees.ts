'use client';
import {useCallback, useEffect, useState} from 'react';

import {showToast} from '@/components';
import {translations} from '@/lib';
import {CategoryMembershipFee, CreateCategoryFeeData, UpdateCategoryFeeData} from '@/types';

export const useCategoryFees = (year?: number) => {
  const [fees, setFees] = useState<CategoryMembershipFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations.membershipFees;

  const currentYear = year || new Date().getFullYear();

  const loadFees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/category-fees?year=${currentYear}`);
      const {data, error} = await response.json();

      if (error) throw new Error(error);

      setFees(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load fees';
      setError(errorMessage);
      showToast.danger(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  const createFee = useCallback(
    async (feeData: CreateCategoryFeeData) => {
      try {
        const response = await fetch('/api/category-fees', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(feeData),
        });

        const {data, error} = await response.json();

        if (error) throw new Error(error);

        showToast.success(t.toasts.feeCreated);
        loadFees();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create fee';
        showToast.danger(errorMessage);
        throw err;
      }
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [loadFees]
  );

  const updateFee = useCallback(
    async (feeData: UpdateCategoryFeeData) => {
      try {
        const response = await fetch('/api/category-fees', {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(feeData),
        });

        const {data, error} = await response.json();

        if (error) throw new Error(error);

        showToast.success(t.toasts.feeUpdated);
        loadFees();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update fee';
        showToast.danger(errorMessage);
        throw err;
      }
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [loadFees]
  );

  const deleteFee = useCallback(
    async (feeId: string) => {
      try {
        const response = await fetch(`/api/category-fees?id=${feeId}`, {
          method: 'DELETE',
        });

        const {error} = await response.json();

        if (error) throw new Error(error);

        showToast.success(t.toasts.feeDeleted);
        loadFees();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete fee';
        showToast.danger(errorMessage);
        throw err;
      }
    },
    [loadFees, t.toasts.feeDeleted]
  );

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  return {
    fees,
    loading,
    error,
    loadFees,
    createFee,
    updateFee,
    deleteFee,
  };
};
