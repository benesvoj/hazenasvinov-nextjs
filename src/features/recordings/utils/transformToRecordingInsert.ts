import {emptyToNull, extractYoutubeId} from '@/shared/lib';
import {VideoFormData, VideoInsert} from '@/types';

/**
 * Transforms VideoFormData into VideoInsert format by extracting the YouTube ID
 * from the provided YouTube URL and setting default values for other fields.
 * @param formData
 */
export function transformToRecordingInsert(formData: VideoFormData): VideoInsert {
  const youtube_id = extractYoutubeId(formData.youtube_url);

  return {
    title: formData.title,
    description: emptyToNull(formData.description),
    youtube_url: formData.youtube_url ?? '',
    youtube_id: youtube_id ?? '',
    recording_date: emptyToNull(formData.recording_date),
    category_id: formData.category_id,
    club_id: formData.club_id,
    season_id: formData.season_id,
    is_active: formData.is_active ?? true,
    duration: null,
    thumbnail_url: null,
    created_by: null,
    updated_by: null,
  };
}
