import {createFeatureQuery} from '@/shared/lib/createFeatureQuery';

import {recordingsConfig} from '../config';
import type {RecordingSchema} from '../types';

const useRecordingsBase = createFeatureQuery<RecordingSchema, {categoryIds?: string[]}>(
  {
    table: recordingsConfig.table,
    entityName: recordingsConfig.entity.plural,
    errorMessage: recordingsConfig.messages.fetchFailed,
  },
  (filters) => {
    const result: Record<string, any> = {};

    if (filters?.categoryIds?.length) {
      result.category_id = filters.categoryIds;
    }

    return result;
  }
);

export function useRecordings(options?: {categoryIds?: string[]; page?: number; limit?: number}) {
  return useRecordingsBase({
    filters: {
      categoryIds: options?.categoryIds,
    },
    page: options?.page,
    limit: options?.limit,
    sort: [{column: 'recording_date', ascending: false}],
  });
}
