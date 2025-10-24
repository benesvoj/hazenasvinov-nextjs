'use client';

import {useCallback, useEffect, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {CategoryMembershipFee, CreateCategoryFeeData, UpdateCategoryFeeData} from '@/types';

const t = translations.membershipFees;

export const useCategoryMembershipFees = (year?: number) => {
  const [fees, setFees] = useState<CategoryMembershipFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFee = useCallback(async (feeData: CreateCategoryFeeData) => {
    try {
      const response = await fetch('/api/category-fees', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(feeData),
      });

      const {data, error} = await response.json();

      if (error) throw new Error(error);

      showToast.success(t.toasts.feeCreated);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create fee';
      showToast.danger(errorMessage);
      throw err;
    }
  }, []);

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
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update fee';
        showToast.danger(errorMessage);
        throw err;
      }
    },

    []
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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete fee';
        showToast.danger(errorMessage);
        throw err;
      }
    },
    [t.toasts.feeDeleted]
  );

  return {
    fees,
    loading,
    error,
    createFee,
    updateFee,
    deleteFee,
  };
};
