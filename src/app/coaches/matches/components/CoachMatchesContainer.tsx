'use client';

import {Tab, Tabs} from '@heroui/react';

import {ChartBarIcon} from '@heroicons/react/24/outline';

import UnifiedStandingTable from '@/components/shared/standing-table/UnifiedStandingTable';

import {translations} from '@/lib/translations';

import {Choice, ContentCard, Show} from '@/components';
import {StrategyPreparationZone} from '@/features/coach';
import {AppPageLayout} from '@/shared/components';
import {hasMoreThanOne} from '@/utils';

import {useCoachMatchesPageLogic} from '../hooks/useCoachMatchesPageLogic';

import CoachMatchResultFlow from './CoachMatchResultFlow';
import MatchStatisticsZone from './MatchStatisticsZone';
import RecentMatchDetails from './RecentMatchDetails';
import RecentResultsCard from './RecentResultsCard';
import UpcomingMatchesCard from './UpcomingMatchesCard';

export default function CoachMatchesContainer() {
  const state = useCoachMatchesPageLogic();

  return (
    <>
      <AppPageLayout
        isLoading={!state.isReady}
        isUnderConstruction
        header={
          <Show when={hasMoreThanOne(state.availableCategories)}>
            <ContentCard padding="none">
              <Choice
                value={state.selectedCategory}
                onChange={(id) => state.setSelectedCategory(id)}
                items={state.availableCategories.map((c) => ({key: c.id, label: c.name}))}
                label={translations.members.table.columns.category}
                size="sm"
                className="md:w-1/4"
                isLoading={state.isLoading}
                disallowEmptySelection={true}
              />
            </ContentCard>
          </Show>
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left column — tabs */}
          <div className="xl:col-span-2 order-2 xl:order-1">
            <Tabs
              selectedKey={state.activeTab}
              onSelectionChange={(key) => state.handleTabChange(key as string)}
            >
              <Tab key="upcoming" title={state.t.upcoming}>
                <UpcomingMatchesCard
                  upcomingMatches={state.upcomingMatches}
                  loading={state.loading}
                  onMatchSelect={state.handleMatchSelect}
                  selectedMatchId={state.selectedMatch?.id}
                  onStartResultFlow={state.handleStartResultFlow}
                />
              </Tab>
              <Tab key="recent" title={state.t.recent}>
                <RecentResultsCard
                  recentResults={state.recentResults}
                  loading={state.loading}
                  onMatchSelect={state.handleMatchSelect}
                  selectedMatchId={state.selectedMatch?.id}
                />
              </Tab>
              <Tab key="standings" title={state.t.standings}>
                <UnifiedStandingTable standings={state.categoryStandings} loading={state.loading} />
              </Tab>
              <Tab key="statistics" title={state.t.statistics}>
                <div className="text-center py-8 text-gray-500">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Statistiky zápasů</p>
                  <p className="text-sm">Statistiky jsou zobrazeny v pravém sloupci</p>
                </div>
              </Tab>
            </Tabs>
          </div>

          {/* Right column — detail panel */}
          <div className="xl:col-span-3 order-1 xl:order-2">
            {state.activeTab === 'upcoming' && (
              <>
                {state.selectedMatch?.status === 'upcoming' ? (
                  <StrategyPreparationZone
                    selectedMatch={state.selectedMatch}
                    onClose={state.handleCloseStrategy}
                  />
                ) : state.selectedMatch ? (
                  <EmptyPanel
                    title="Zápas již byl odehrán"
                    description="Strategie a příprava jsou dostupné pouze pro nadcházející zápasy."
                  />
                ) : (
                  <EmptyPanel
                    title="Vyberte zápas"
                    description="Klikněte na zápas v seznamu vlevo pro zobrazení strategie a přípravy."
                  />
                )}
              </>
            )}
            {state.activeTab === 'recent' && (
              <>
                {state.selectedMatch ? (
                  <RecentMatchDetails
                    selectedMatch={state.selectedMatch}
                    onClose={state.handleCloseStrategy}
                  />
                ) : (
                  <EmptyPanel
                    title="Vyberte zápas"
                    description="Klikněte na zápas v seznamu vlevo pro zobrazení detailů a statistik."
                  />
                )}
              </>
            )}
            {state.activeTab === 'standings' && (
              <EmptyPanel title="Tabulka" description="Tabulka je zobrazena v levém sloupci." />
            )}
            {state.activeTab === 'statistics' &&
              state.selectedCategoryData &&
              state.activeSeason && (
                <MatchStatisticsZone
                  categoryId={state.selectedCategoryData.id}
                  seasonId={state.activeSeason.id}
                />
              )}
          </div>
        </div>
      </AppPageLayout>

      <CoachMatchResultFlow
        isOpen={state.isResultFlowOpen}
        onClose={state.handleCloseResultFlow}
        match={state.resultFlowMatch}
        onResultSaved={state.handleResultSaved}
      />
    </>
  );
}

function EmptyPanel({title, description}: {title: string; description: string}) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium mb-2">{title}</p>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  );
}
