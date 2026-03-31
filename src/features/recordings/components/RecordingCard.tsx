'use client';

import React, {memo} from 'react';

import {Card, CardBody, CardHeader} from '@heroui/card';
import {Chip} from '@heroui/chip';
import {Image} from '@heroui/image';

import {LinkIcon, PencilIcon, PlayIcon, TrashIcon} from '@heroicons/react/24/outline';

import {ButtonWithTooltip} from '@/components/ui/server/buttons/ButtonWithTooltip';

import {translations} from '@/lib/translations';

import {HStack} from '@/components';
import {formatDateString} from '@/helpers';
import {Category, Club, Season} from '@/types';
import {copyUrl, playUrl} from '@/utils';

import type {RecordingSchema} from '../types';

interface RecordingCardProps {
  recording: RecordingSchema;
  onEdit?: (item: RecordingSchema) => void;
  onDelete?: (item: RecordingSchema) => void;
  categories?: Array<Category>;
  seasons?: Array<Season>;
  clubs?: Array<Club>;
}

const t = translations.matchRecordings.components.card;

export const RecordingCard = memo(function VideoCard({
  recording,
  onEdit,
  onDelete,
  categories,
  seasons,
  clubs,
}: RecordingCardProps) {
  const handlePlay = () => playUrl(recording.youtube_url);

  const handleCopyUrl = () => copyUrl(recording.youtube_url);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative w-full h-32 bg-gray-200 rounded-t-lg overflow-hidden">
          {recording.thumbnail_url ? (
            <Image
              src={recording.thumbnail_url}
              alt={recording.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <PlayIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
            <Chip size="sm" variant="solid" color="primary" className="shadow-md">
              {categories?.find((cat) => cat.id === recording.category_id)?.name ||
                recording.category_id ||
                'No Category'}
            </Chip>
            {recording.season_id && (
              <Chip size="sm" variant="solid" color="secondary" className="shadow-md">
                {seasons?.find((season) => season.id === recording.season_id)?.name ||
                  (recording.season_id
                    ? `Sezóna ${recording.season_id.slice(0, 8)}...`
                    : 'Neznámá sezóna')}
              </Chip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm">
          {clubs?.find((club) => club.id === recording.club_id)?.name} - {recording.title}
        </h3>

        {recording.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{recording.description}</p>
        )}

        {recording.recording_date && (
          <div className="mb-2 text-xs text-gray-500">
            <div>
              {t.recordingDate} {formatDateString(recording.recording_date)}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mb-3 space-y-1">
          <div>
            {t.createdAt} {recording.created_at && formatDateString(recording.created_at)}
          </div>
          {recording.updated_at !== recording.created_at && (
            <div>
              {t.updatedAt} {recording.updated_at && formatDateString(recording.updated_at)}
            </div>
          )}
        </div>

        <HStack spacing={1} align={'center'} justify={'end'}>
          <ButtonWithTooltip tooltip={t.play} onPress={handlePlay} ariaLabel={t.play} isIconOnly>
            <PlayIcon className="w-4 h-4" />
          </ButtonWithTooltip>
          <ButtonWithTooltip
            tooltip={t.copyUrl}
            onPress={handleCopyUrl}
            ariaLabel={t.copyUrl}
            isIconOnly
          >
            <LinkIcon className="w-4 h-4" />,
          </ButtonWithTooltip>
          {onEdit && (
            <ButtonWithTooltip
              tooltip={t.edit}
              onPress={() => onEdit(recording)}
              ariaLabel={t.edit}
              isIconOnly
            >
              <PencilIcon className="w-4 h-4" />
            </ButtonWithTooltip>
          )}
          {onDelete && (
            <ButtonWithTooltip
              tooltip={t.delete}
              onPress={() => onDelete(recording)}
              ariaLabel={t.delete}
              isIconOnly
              isDanger
            >
              <TrashIcon className="w-4 h-4" />
            </ButtonWithTooltip>
          )}
        </HStack>
      </CardBody>
    </Card>
  );
});
