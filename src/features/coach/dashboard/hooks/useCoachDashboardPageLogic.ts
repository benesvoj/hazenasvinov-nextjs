'use client';

import {useState} from 'react';

import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
import {Match} from '@/types';

export function useCoachDashboardPageLogic() {
  const [resultFlowMatch, setResultFlowMatch] = useState<Match | null>(null);
  const [isResultFlowOpen, setIsResultFlowOpen] = useState(false);

  const {availableCategories, selectedCategory, setSelectedCategory, isLoading} =
    useCoachCategory();

  const handleStartResultFlow = (match: Match) => {
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
