'use client';

import React, {createContext, useContext, useState, useEffect} from 'react';

import {useAppData} from '@/contexts/AppDataContext';

import {Category} from '@/types';
interface AdminCategorySimulationContextType {
  selectedCategories: string[];
  availableCategories: Array<Category>;
  selectCategory: (categoryId: string) => void;
  deselectCategory: (categoryId: string) => void;
  clearSelection: () => void;
  loading: boolean;
}

const AdminCategorySimulationContext = createContext<
  AdminCategorySimulationContextType | undefined
>(undefined);

export function AdminCategorySimulationProvider({children}: {children: React.ReactNode}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const {categories: {data: categories, loading: categoriesLoading}} = useAppData();

  const availableCategories = categories || [];
  const loading = categoriesLoading;

  // Load selected category from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('adminCategorySimulation');
      if (savedState) {
        try {
          const {selectedCategories: savedCategories} = JSON.parse(savedState);
          setSelectedCategories(savedCategories || []);
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  }, []);

  // Save selected category to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'adminCategorySimulation',
        JSON.stringify({
          selectedCategories,
        })
      );
    }
  }, [selectedCategories]);

  const selectCategory = (categoryId: string) => {
    setSelectedCategories((prev) => (prev.includes(categoryId) ? prev : [...prev, categoryId]));
  };

  const deselectCategory = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  };

  const clearSelection = () => {
    setSelectedCategories([]);
  };

  return (
    <AdminCategorySimulationContext.Provider
      value={{
        selectedCategories,
        availableCategories,
        selectCategory,
        deselectCategory,
        clearSelection,
        loading,
      }}
    >
      {children}
    </AdminCategorySimulationContext.Provider>
  );
}

export function useAdminCategorySimulation() {
  const context = useContext(AdminCategorySimulationContext);
  if (context === undefined) {
    throw new Error(
      'useAdminCategorySimulation must be used within an AdminCategorySimulationProvider'
    );
  }
  return context;
}
