'use client';

import {useEffect, useState} from 'react';

import {hasItems} from '@/utils/arrayHelper';

import {useFetchCategories, useFetchSeasons, useSeasonFiltering} from '@/hooks';
import {Category} from '@/types';

export function useMatchesFilters() {
  const [selectedCategoryOverride, setSelectedCategory] = useState<string>('');
  const [selectedSeasonOverride, setSelectedSeasonId] = useState<string>('');

  const {
    data: categories,
    loading: categoriesLoading,
    refetch: fetchCategories,
  } = useFetchCategories();
  const {data: seasons, loading: seasonsLoading} = useFetchSeasons();
  const {activeSeason, sortedSeasons} = useSeasonFiltering({seasons: seasons || []});

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Derive effective values: use override if set, otherwise fall back to defaults
  const selectedSeasonId = selectedSeasonOverride || activeSeason?.id || '';
  const selectedCategory =
    selectedCategoryOverride || (hasItems(categories) ? categories[0].id : '');

  const selectedCategoryData: Category | undefined = categories.find(
    (cat) => cat.id === selectedCategory
  );

  return {
    selectedCategory,
    setSelectedCategory,
    selectedSeasonId,
    setSelectedSeasonId,
    categories,
    categoriesLoading,
    sortedSeasons,
    seasonsLoading,
    selectedCategoryData,
  };
}
