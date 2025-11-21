'use client';

import React, {memo} from 'react';

import {Card, CardBody, CardHeader, Chip, Image} from '@heroui/react';

import {LinkIcon, PencilIcon, PlayIcon, TrashIcon} from '@heroicons/react/24/outline';

import {
  ButtonWithTooltip,
  ButtonWithTooltipProps,
} from '@/components/ui/server/buttons/ButtonWithTooltip';

import {formatDateString} from '@/helpers';
import {translations} from '@/lib';
import {Category, Club, Season, VideoSchema} from '@/types';
import {copyUrl, playUrl} from '@/utils';

interface VideoCardProps {
  video: VideoSchema;
  onEdit: (video: VideoSchema) => void;
  onDelete: (video: VideoSchema) => void;
  categories?: Array<Category>;
  seasons?: Array<Season>;
  clubs?: Array<Club>;
}

const t = translations.components.videos.videoCard;

export const VideoCard = memo(function VideoCard({
  video,
  onEdit,
  onDelete,
  categories,
  seasons,
  clubs,
}: VideoCardProps) {
  const handlePlay = () => playUrl(video.youtube_url);

  const handleCopyUrl = () => copyUrl(video.youtube_url);

  const buttonsOnCard: ButtonWithTooltipProps[] = [
    {
      children: <PlayIcon className="w-4 h-4" />,
      tooltip: t.play,
      onPress: handlePlay,
      ariaLabel: t.play,
      isIconOnly: true,
    },
    {
      children: <LinkIcon className="w-4 h-4" />,
      tooltip: t.copyUrl,
      onPress: handleCopyUrl,
      ariaLabel: t.copyUrl,
      isIconOnly: true,
    },
    {
      children: <PencilIcon className="w-4 h-4" />,
      tooltip: t.edit,
      onPress: () => onEdit(video),
      ariaLabel: t.edit,
      isIconOnly: true,
    },
    {
      children: <TrashIcon className="w-4 h-4" />,
      tooltip: t.delete,
      onPress: () => onDelete(video),
      ariaLabel: t.delete,
      isIconOnly: true,
      isDanger: true,
    },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative w-full h-32 bg-gray-200 rounded-t-lg overflow-hidden">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <PlayIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
            <Chip size="sm" variant="solid" color="primary" className="shadow-md">
              {categories?.find((cat) => cat.id === video.category_id)?.name ||
                video.category_id ||
                'No Category'}
            </Chip>
            {video.season_id && (
              <Chip size="sm" variant="solid" color="secondary" className="shadow-md">
                {seasons?.find((season) => season.id === video.season_id)?.name ||
                  (video.season_id ? `Sezóna ${video.season_id.slice(0, 8)}...` : 'Neznámá sezóna')}
              </Chip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm">
          {clubs?.find((club) => club.id === video.club_id)?.name} - {video.title}
        </h3>

        {video.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{video.description}</p>
        )}

        {video.recording_date && (
          <div className="mb-2 text-xs text-gray-500">
            <div>
              {t.recordingDate} {formatDateString(video.recording_date)}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mb-3 space-y-1">
          <div>
            {t.createdAt} {video.created_at && formatDateString(video.created_at)}
          </div>
          {video.updated_at !== video.created_at && (
            <div>
              {t.updatedAt} {video.updated_at && formatDateString(video.updated_at)}
            </div>
          )}
        </div>

        <div className="flex w-full justify-end gap-1">
          {buttonsOnCard.map((button) => (
            <ButtonWithTooltip key={button.ariaLabel} {...button} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
});
