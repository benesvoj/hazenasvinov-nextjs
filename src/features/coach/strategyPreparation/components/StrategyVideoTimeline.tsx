'use client';

import React, {useMemo, useState} from 'react';

import {Button} from '@heroui/react';

import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PencilSquareIcon,
  PlayIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

import {LoadingSpinner} from '@/components';
import {useCopyRecordingUrl, type RecordingSchema} from '@/features/recordings';
import {getMatchPartLabel} from '@/features/recordings/utils/matchPartLabel';
import {openInNewTab} from '@/shared/browser';
import {Team, VideoMatchPart, VideoWithMatch} from '@/types';

const MATCH_PART_FILTERS: {value: VideoMatchPart; label: string}[] = [
  {value: 'first_half', label: '1. poločas'},
  {value: 'second_half', label: '2. poločas'},
  {value: 'full_match', label: 'Celé utkání'},
];

const MONTH_CS = [
  'LEDEN',
  'ÚNOR',
  'BŘEZEN',
  'DUBEN',
  'KVĚTEN',
  'ČERVEN',
  'ČERVENEC',
  'SRPEN',
  'ZÁŘÍ',
  'ŘÍJEN',
  'LISTOPAD',
  'PROSINEC',
];

function toMonthLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return `${MONTH_CS[d.getMonth()]} ${d.getFullYear()}`;
}

const MATCH_PART_BADGE: Record<string, string> = {
  first_half: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  second_half: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  full_match: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  overtime: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

interface MatchGroup {
  key: string;
  hasMatch: boolean;
  date: string | null;
  homeShort: string;
  awayShort: string;
  homeScore: number | null;
  awayScore: number | null;
  homeHalftime: number | null;
  awayHalftime: number | null;
  videos: VideoWithMatch[];
}

interface Props {
  videos: VideoWithMatch[];
  loading: boolean;
  videosError: string | null;
  opponentTeam: Team | null;
  opponentClubIdMissing: boolean;
  onEdit?: (video: RecordingSchema) => void;
}

export default function StrategyVideoTimeline({
  videos,
  loading,
  videosError,
  opponentTeam,
  opponentClubIdMissing,
  onEdit,
}: Props) {
  const [seasonFilter, setSeasonFilter] = useState<string | null>(null);
  const [matchPartFilter, setMatchPartFilter] = useState<VideoMatchPart | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyUrl = useCopyRecordingUrl();

  const seasons = useMemo(() => {
    const seen = new Map<string, string>();
    videos.forEach((v) => {
      if (v.seasons?.id && v.seasons.name && !seen.has(v.seasons.id)) {
        seen.set(v.seasons.id, v.seasons.name);
      }
    });
    return Array.from(seen.entries())
      .map(([id, name]) => ({id, name}))
      .sort((a, b) => b.name.localeCompare(a.name));
  }, [videos]);

  const monthGroups = useMemo(() => {
    const filtered = videos.filter((v) => {
      if (seasonFilter && v.seasons?.id !== seasonFilter) return false;
      if (matchPartFilter && v.match_part !== matchPartFilter) return false;
      return true;
    });

    const matchMap = new Map<string, VideoWithMatch[]>();
    filtered.forEach((v) => {
      const key = v.match?.id ?? `_${v.id}`;
      if (!matchMap.has(key)) matchMap.set(key, []);
      matchMap.get(key)!.push(v);
    });

    const groups: MatchGroup[] = Array.from(matchMap.values())
      .map((vids) => {
        const first = vids[0];
        const match = first.match;
        return {
          key: match?.id ?? first.id,
          hasMatch: !!match,
          date: match?.date ?? first.recording_date,
          homeShort: match?.home_team.short_name ?? match?.home_team.name ?? '',
          awayShort: match?.away_team.short_name ?? match?.away_team.name ?? '',
          homeScore: match?.home_score ?? null,
          awayScore: match?.away_score ?? null,
          homeHalftime: match?.home_score_halftime ?? null,
          awayHalftime: match?.away_score_halftime ?? null,
          videos: vids,
        };
      })
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    const byMonth = new Map<string, {label: string; groups: MatchGroup[]}>();
    groups.forEach((g) => {
      const label = g.date ? toMonthLabel(g.date) : 'Bez data';
      if (!byMonth.has(label)) byMonth.set(label, {label, groups: []});
      byMonth.get(label)!.groups.push(g);
    });

    return Array.from(byMonth.values());
  }, [videos, seasonFilter, matchPartFilter]);

  const handleCopy = (url: string, id: string) => {
    copyUrl(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  };

  const totalVideos = monthGroups.reduce(
    (n, mg) => n + mg.groups.reduce((m, g) => m + g.videos.length, 0),
    0
  );

  const filterBtnClass = (active: boolean) =>
    `px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${
      active
        ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100'
        : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400 hover:border-gray-500 dark:hover:border-gray-400'
    }`;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        <VideoCameraIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <h3 className="text-sm font-semibold">Videa týmu {opponentTeam?.name || 'soupeře'}</h3>
        {!loading && videos.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">({videos.length})</span>
        )}
      </div>

      {videosError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
          <p className="text-xs text-red-700 dark:text-red-300">
            Chyba při načítání videí: {videosError}
          </p>
        </div>
      )}

      {opponentClubIdMissing ? (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Nepodařilo se identifikovat klub soupeře – videa nelze zobrazit.
          </p>
        </div>
      ) : (
        <>
          {/* Filters */}
          {!loading && seasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                className={filterBtnClass(!seasonFilter)}
                onClick={() => setSeasonFilter(null)}
              >
                Vše
              </button>
              {seasons.map((s) => (
                <button
                  key={s.id}
                  className={filterBtnClass(seasonFilter === s.id)}
                  onClick={() => setSeasonFilter(seasonFilter === s.id ? null : s.id)}
                >
                  {s.name}
                </button>
              ))}
              {MATCH_PART_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={filterBtnClass(matchPartFilter === f.value)}
                  onClick={() => setMatchPartFilter(matchPartFilter === f.value ? null : f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="py-4">
              <LoadingSpinner />
            </div>
          ) : totalVideos === 0 ? (
            <div className="text-center py-8">
              <VideoCameraIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Žádná videa týmu {opponentTeam?.name || 'soupeře'} nejsou k dispozici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthGroups.map((mg) => (
                <div key={mg.label}>
                  <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 px-0.5">
                    {mg.label}
                  </p>
                  <div className="space-y-1.5">
                    {mg.groups.map((group) => (
                      <div
                        key={group.key}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        {/* Match header */}
                        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 min-w-0">
                            {group.hasMatch ? (
                              <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ExclamationTriangleIcon
                                className="w-3.5 h-3.5 text-amber-400 flex-shrink-0"
                                title="Video není propojeno se zápasem"
                              />
                            )}
                            {group.hasMatch ? (
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                {group.homeShort} vs {group.awayShort}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                Bez vazby na zápas
                              </span>
                            )}
                            {group.date && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(group.date).toLocaleDateString('cs-CZ')}
                              </span>
                            )}
                          </div>
                          {group.hasMatch &&
                            group.homeScore !== null &&
                            group.awayScore !== null && (
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex-shrink-0">
                                {group.homeScore}:{group.awayScore}
                                {group.homeHalftime !== null && group.awayHalftime !== null && (
                                  <span className="font-normal text-gray-400 ml-1">
                                    ({group.homeHalftime}:{group.awayHalftime})
                                  </span>
                                )}
                              </span>
                            )}
                        </div>

                        {/* Video rows */}
                        {group.videos.map((video, idx) => (
                          <div
                            key={video.id}
                            className={`flex items-center gap-2 px-2.5 py-2 bg-white dark:bg-gray-900 ${
                              idx < group.videos.length - 1
                                ? 'border-b border-gray-100 dark:border-gray-800'
                                : ''
                            }`}
                          >
                            {/* Play thumb */}
                            <button
                              onClick={() => openInNewTab(video.youtube_url)}
                              className="w-9 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <PlayIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                            </button>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-snug">
                                {video.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {video.seasons?.name && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {video.seasons.name}
                                  </span>
                                )}
                                {video.match_part && (
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${MATCH_PART_BADGE[video.match_part] ?? 'bg-gray-100 text-gray-500'}`}
                                  >
                                    {getMatchPartLabel(video.match_part)}
                                  </span>
                                )}
                                {video.description && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-32">
                                    {video.description}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="bordered"
                                className="w-8 h-8 min-w-8 border-gray-200 dark:border-gray-700"
                                onPress={() => handleCopy(video.youtube_url, video.id)}
                                title={copiedId === video.id ? 'Zkopírováno!' : 'Zkopírovat odkaz'}
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="solid"
                                color="primary"
                                className="w-8 h-8 min-w-8"
                                onPress={() => openInNewTab(video.youtube_url)}
                                title="Přehrát video"
                              >
                                <PlayIcon className="w-3.5 h-3.5" />
                              </Button>
                              {onEdit && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="bordered"
                                  className="w-8 h-8 min-w-8 border-gray-200 dark:border-gray-700"
                                  onPress={() => onEdit(video as unknown as RecordingSchema)}
                                  title="Upravit video"
                                >
                                  <PencilSquareIcon className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
