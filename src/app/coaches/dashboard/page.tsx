'use client';

import React, {useState} from 'react';

import {Tab, Tabs} from '@heroui/react';

import MatchSchedule from '@/components/shared/match/MatchSchedule';

import {translations} from '@/lib/translations/index';

import {useCoachCategory} from '@/app/coaches/components/CoachCategoryContext';

import {Choice, PageContainer, Show, UnifiedCard} from '@/components';
import {hasMoreThanOne} from '@/utils';

import CoachMatchResultFlow from '../matches/components/CoachMatchResultFlow';

import {BirthdayCard, RedCardsCard, TopScorersCard, YellowCardsCard} from './components';

export default function CoachesDashboard() {
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

  const handleResultSaved = () => {
    // Refresh matches data - the MatchSchedule component will handle its own refresh
    // No need to reload the entire page
  };

  return (
    <>
      <PageContainer isLoading={isLoading}>
        <Show when={hasMoreThanOne(availableCategories)}>
          <UnifiedCard padding={'none'}>
            <Choice
              value={selectedCategory}
              onChange={(id) => setSelectedCategory(id)}
              items={availableCategories.map((c) => ({key: c.id, label: c.name}))}
              label={translations.members.table.columns.category}
              size="sm"
              className={'md:w-1/4'}
              disallowEmptySelection={true}
            />
          </UnifiedCard>
        </Show>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-6">
          <div className=" hidden sm:block md:col-span-2 xl:col-span-1">
            <BirthdayCard categoryId={selectedCategory} />
          </div>

          <TopScorersCard categoryId={selectedCategory} />

          <YellowCardsCard categoryId={selectedCategory} />

          <RedCardsCard categoryId={selectedCategory} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <MatchSchedule
              showOnlyAssignedCategories={true}
              redirectionLinks={false}
              onStartResultFlow={handleStartResultFlow}
              showResultButton={true}
              selectedCategoryId={selectedCategory}
            />
          </div>
        </div>
      </PageContainer>

      <CoachMatchResultFlow
        isOpen={isResultFlowOpen}
        onClose={handleCloseResultFlow}
        match={resultFlowMatch}
        onResultSaved={handleResultSaved}
      />
    </>
  );
}
