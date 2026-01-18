import {VideoFormData, VideoInsert} from '@/types';
import {extractYoutubeId} from '@/utils';

/**
 * Transforms VideoFormData into VideoInsert format by extracting the YouTube ID
 * from the provided YouTube URL and setting default values for other fields.
 * @param formData
 */
export function transformToVideoInsert(formData: VideoFormData): VideoInsert {
  const youtube_id = extractYoutubeId(formData.youtube_url);

  return {
    ...formData,
    youtube_id,
    duration: null,
    thumbnail_url: null,
    created_by: null,
    updated_by: null,
  };
}
