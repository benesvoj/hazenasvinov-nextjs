'use client';

import {useAppData} from '@/contexts/AppDataContext';

import {RecordingFilters} from '@/features/recordings';
import {AppPageLayout} from '@/shared/components';

import {useCoachRecordingsPageLogic} from '../hooks';

import {RecordingsView} from './RecordingsView';

export function CoachRecordingsContainer() {
  const state = useCoachRecordingsPageLogic();

  const {
    clubs: {data: clubs},
    seasons: {data: seasons},
  } = useAppData();

  return (
    <AppPageLayout
      isLoading={state.loading}
      filters={
        <RecordingFilters
          filters={state.filters}
          categories={state.availableCategories}
          clubs={clubs}
          seasons={seasons}
          onFiltersChange={(f) => {
            state.setFilters(f);
            state.setCurrentPage(1);
          }}
        />
      }
    >
      <RecordingsView
        recordings={state.recordings}
        categories={state.availableCategories}
        loading={state.loading}
        clubs={clubs}
        seasons={seasons}
        currentPage={state.currentPage}
        totalPages={state.totalPages}
        totalCount={state.totalCount}
        itemsPerPage={20}
        onPageChange={state.setCurrentPage}
      />
    </AppPageLayout>
  );
}
