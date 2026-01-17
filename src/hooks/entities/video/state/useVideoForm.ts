'use client';

import {createFormHook} from '@/hooks';
import {translations} from '@/lib';
import {VideoFormData, VideoSchema} from '@/types';

const t = translations.admin.videos.responseMessages;

const initialFormData: VideoFormData = {
  title: '',
  description: '',
  youtube_url: '',
  category_id: '',
  club_id: '',
  recording_date: '',
  season_id: '',
  is_active: true,
};

export function useVideoForm() {
  return createFormHook<VideoSchema, VideoFormData>({
    initialFormData,
    validationRules: [
      {field: 'youtube_url', message: t.mandatoryYoutubeURL},
      {field: 'title', message: t.mandatoryTitle},
      {field: 'category_id', message: t.mandatoryCategory},
    ],
  })();
}
