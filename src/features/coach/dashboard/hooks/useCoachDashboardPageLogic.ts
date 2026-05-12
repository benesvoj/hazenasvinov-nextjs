'use client';

import {useState} from 'react';

import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';

export function useCoachDashboardPageLogic() {
  const [resultFlowMatch, setResultFlowMatch] = useState<any>(null);
  const [isResultFlowOpen, setIsResultFlowOpen] = useState(false);

  const {availableCategories, selectedCategory, setSelectedCategory, isLoading} =
    useCoachCategory();

  const handleStartResultFlow = (match: any) => {
    setResultFlowMatch(match);
    setIsResultFlowOpen(true);
  };

  const handleCloseResultFlow = () => {
    setIsResultFlowOpen(false);
    setResultFlowMatch(null);
  };

  return {
    availableCategories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    resultFlowMatch,
    isResultFlowOpen,
    handleStartResultFlow,
    handleCloseResultFlow,
  };
}
