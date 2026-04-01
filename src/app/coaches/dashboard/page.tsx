'use client';

import React, {useState} from 'react';

import MatchSchedule from '@/components/shared/match/MatchSchedule';

import {translations} from '@/lib/translations';

import {Choice, ContentCard, Grid, GridItem, PageContainer, Show} from '@/components';
import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
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
          <ContentCard padding={'none'}>
            <Choice
              value={selectedCategory}
              onChange={(id) => setSelectedCategory(id)}
              items={availableCategories.map((c) => ({key: c.id, label: c.name}))}
              label={translations.members.table.columns.category}
              size="sm"
              className={'md:w-1/4'}
              disallowEmptySelection={true}
            />
          </ContentCard>
        </Show>

        <Grid columns={4}>
          <div className=" hidden sm:block md:col-span-2 xl:col-span-1">
            <BirthdayCard categoryId={selectedCategory} />
          </div>

          <TopScorersCard categoryId={selectedCategory} />

          <YellowCardsCard categoryId={selectedCategory} />

          <RedCardsCard categoryId={selectedCategory} />
        </Grid>

        <Grid columns={2}>
          <GridItem span={2}>
            <MatchSchedule
              showOnlyAssignedCategories={true}
              redirectionLinks={false}
              onStartResultFlow={handleStartResultFlow}
              showResultButton={true}
              selectedCategoryId={selectedCategory}
            />
          </GridItem>
        </Grid>
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
