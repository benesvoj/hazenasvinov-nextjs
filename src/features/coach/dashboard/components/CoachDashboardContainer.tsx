'use client';

import MatchSchedule from '@/components/shared/match/MatchSchedule';

import {translations} from '@/lib/translations';

import {Choice, Grid, GridItem, Show} from '@/components';
import {CoachMatchResultFlow} from '@/features/coach/matches';
import {AppPageLayout} from '@/shared/components';
import {hasMoreThanOne} from '@/utils';

import {useCoachDashboardPageLogic} from '../hooks/useCoachDashboardPageLogic';

import {BirthdayCard, RedCardsCard, TopScorersCard, YellowCardsCard} from '.';

export default function CoachDashboardContainer() {
  const state = useCoachDashboardPageLogic();

  return (
    <>
      <AppPageLayout
        isLoading={state.isLoading}
        header={
          <Show when={hasMoreThanOne(state.availableCategories)}>
            <Choice
              value={state.selectedCategory}
              onChange={(id) => state.setSelectedCategory(id)}
              items={state.availableCategories.map((c) => ({key: c.id, label: c.name}))}
              label={translations.members.table.columns.category}
              size="sm"
              className="md:w-1/4"
              disallowEmptySelection={true}
            />
          </Show>
        }
      >
        <Grid columns={4}>
          <div className="hidden sm:block md:col-span-2 xl:col-span-1">
            <BirthdayCard categoryId={state.selectedCategory} />
          </div>
          <TopScorersCard categoryId={state.selectedCategory} />
          <YellowCardsCard categoryId={state.selectedCategory} />
          <RedCardsCard categoryId={state.selectedCategory} />
        </Grid>

        <Grid columns={2}>
          <GridItem span={2}>
            <MatchSchedule
              redirectionLinks={false}
              onStartResultFlow={state.handleStartResultFlow}
              showResultButton={true}
              selectedCategoryId={state.selectedCategory}
            />
          </GridItem>
        </Grid>
      </AppPageLayout>

      <CoachMatchResultFlow
        isOpen={state.isResultFlowOpen}
        onClose={state.handleCloseResultFlow}
        match={state.resultFlowMatch}
        onResultSaved={() => {}}
      />
    </>
  );
}
