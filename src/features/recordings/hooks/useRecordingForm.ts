'use client';

import {recordingsConfig} from '@/features/recordings/config';
import {createFormHook} from '@/hooks';

import type {RecordingFormData, RecordingSchema} from '../types';

const initialFormData: RecordingFormData = {
  title: '',
  description: '',
  youtube_url: '',
  category_id: '',
  club_id: '',
  recording_date: '',
  season_id: '',
  is_active: true,
};

export function useRecordingForm() {
  return createFormHook<RecordingSchema, RecordingFormData>({
    initialFormData,
    validationRules: [
      {
        field: 'youtube_url',
        message: recordingsConfig.messages.mandatoryYoutubeURL,
      },
      {field: 'title', message: recordingsConfig.messages.mandatoryTitle},
      {
        field: 'category_id',
        message: recordingsConfig.messages.mandatoryCategory,
      },
    ],
  })();
}
