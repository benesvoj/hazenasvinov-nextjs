'use client';

import React, {memo, useCallback, useMemo} from 'react';

import {LinkIcon, PencilIcon, PlayIcon, TrashIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {getStatusClasses, getStatusLabel} from '@/helpers/ui';

import {UnifiedTable} from '@/components';
import {ActionTypes, ColumnAlignType} from '@/enums';
import {formatDateString} from '@/helpers';
import {openInNewTab} from '@/shared/browser';
import {Category, Club, ColumnType, Season} from '@/types';

import {useCopyRecordingUrl} from '../hooks';
import type {RecordingSchema} from '../types';
import {getMatchPartLabel} from '../utils/matchPartLabel';

interface RecordingTableProps {
  recordings: RecordingSchema[];
  loading: boolean;
  categories: Category[];
  clubs: Club[];
  seasons: Season[];
  onEdit?: (item: RecordingSchema) => void;
  onDelete?: (item: RecordingSchema) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const RecordingTable = memo(function RecordingTable({
  recordings,
  loading,
  categories,
  clubs,
  seasons,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
}: RecordingTableProps) {
  const t = translations.matchRecordings.components.table;
  const copyUrl = useCopyRecordingUrl();

  const handlePlay = useCallback((recording: RecordingSchema) => {
    openInNewTab(recording.youtube_url);
  }, []);

  const handleCopyUrl = useCallback(
    (recording: RecordingSchema) => {
      copyUrl(recording.youtube_url);
    },
    [copyUrl]
  );

  const columns = useMemo((): ColumnType<RecordingSchema>[] => {
    const actionsList = [
      {
        type: ActionTypes.READ,
        onPress: handlePlay,
        icon: <PlayIcon className="w-4 h-4" />,
        title: t.actions.play,
        color: 'default' as const,
      },
      {
        type: ActionTypes.EXPORT,
        onPress: handleCopyUrl,
        icon: <LinkIcon className="w-4 h-4" />,
        title: t.actions.copyUrl,
        color: 'default' as const,
      },
      ...(onEdit
        ? [
            {
              type: ActionTypes.UPDATE,
              onPress: onEdit,
              icon: <PencilIcon className="w-4 h-4" />,
              title: t.actions.edit,
              color: 'default' as const,
            },
          ]
        : []),
      ...(onDelete
        ? [
            {
              type: ActionTypes.DELETE,
              onPress: onDelete,
              icon: <TrashIcon className="w-4 h-4" />,
              title: t.actions.delete,
              color: 'danger' as const,
            },
          ]
        : []),
    ];

    return [
      {key: 'title', label: t.columns.title},
      {key: 'match_part', label: t.columns.matchPart},
      {key: 'category_id', label: t.columns.category},
      {key: 'club_id', label: t.columns.club},
      {key: 'season_id', label: t.columns.season},
      {key: 'recording_date', label: t.columns.recordingDate},
      {key: 'is_active', label: t.columns.status},
      {
        key: 'actions',
        label: t.columns.actions,
        isActionColumn: true,
        actions: actionsList,
        align: ColumnAlignType.CENTER,
      },
    ];
  }, [handlePlay, handleCopyUrl, onEdit, onDelete, t]);

  const renderCell = useCallback(
    (recording: RecordingSchema, columnKey: string): React.ReactNode => {
      switch (columnKey) {
        case 'title':
          return <span className="font-medium">{recording.title}</span>;
        case 'category_id': {
          const category = categories.find((c) => c.id === recording.category_id);
          return <span>{category?.name ?? '-'}</span>;
        }
        case 'club_id': {
          const club = clubs.find((c) => c.id === recording.club_id);
          return <span>{club?.name ?? '-'}</span>;
        }
        case 'season_id': {
          const season = seasons.find((s) => s.id === recording.season_id);
          return <span>{season?.name ?? '-'}</span>;
        }
        case 'recording_date':
          return (
            <span>
              {recording.recording_date ? formatDateString(recording.recording_date) : '-'}
            </span>
          );
        case 'match_part':
          return <span>{getMatchPartLabel(recording.match_part)}</span>;
        case 'is_active':
          return (
            <span className={getStatusClasses(recording.is_active ?? false)}>
              {getStatusLabel(recording.is_active ?? false)}
            </span>
          );
        default:
          return null;
      }
    },
    [categories, clubs, seasons]
  );

  return (
    <UnifiedTable
      columns={columns}
      data={recordings}
      ariaLabel={t.ariaLabel}
      renderCell={renderCell}
      getKey={(recording) => recording.id}
      emptyContent={t.noRecordings}
      isLoading={loading}
      isStriped
      page={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  );
});
