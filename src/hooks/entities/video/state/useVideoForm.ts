'use client';

import {translations} from "@/lib/translations/index";

import {createFormHook} from '@/hooks';
import {VideoFormData, VideoSchema} from '@/types';

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
      {field: 'youtube_url', message: translations.videos.responseMessages.mandatoryYoutubeURL},
      {field: 'title', message: translations.videos.responseMessages.mandatoryTitle},
      {field: 'category_id', message: translations.videos.responseMessages.mandatoryCategory},
    ],
  })();
}
