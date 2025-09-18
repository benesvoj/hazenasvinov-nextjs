'use client';

import React, {useState} from 'react';
import {Card, CardHeader, CardBody, Button} from '@heroui/react';
import {VideoCameraIcon, PlayIcon, LinkIcon, CheckIcon} from '@heroicons/react/24/outline';
import {LoadingSpinner} from '@/components';
import Image from 'next/image';
import {formatDateString} from '@/helpers';

interface Video {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  youtube_id: string;
  thumbnail_url?: string;
  duration?: string;
  recording_date?: string;
  clubs?: {
    id: string;
    name: string;
    short_name: string;
  };
  // Match information when video is related to a match
  match?: {
    id: string;
    home_team: {
      id: string;
      name: string;
      short_name?: string;
    };
    away_team: {
      id: string;
      name: string;
      short_name?: string;
    };
    home_score?: number;
    away_score?: number;
    home_score_halftime?: number;
    away_score_halftime?: number;
    status: 'upcoming' | 'completed';
    date: string;
  };
}

interface CompactVideoListProps {
  videos: Video[];
  loading: boolean;
  title: string;
  emptyMessage?: string;
}

export default function CompactVideoList({
  videos,
  loading,
  title,
  emptyMessage = 'Žádná videa k dispozici',
}: CompactVideoListProps) {
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null);

  const handleVideoClick = (video: Video) => {
    window.open(video.youtube_url, '_blank');
  };

  const handleCopyLink = async (video: Video) => {
    try {
      await navigator.clipboard.writeText(video.youtube_url);
      setCopiedVideoId(video.id);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedVideoId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <Card className="h-full mx-1 sm:mx-2">
      <CardHeader className="flex items-center gap-2 px-3 sm:px-4">
        <VideoCameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold truncate">{title}</h3>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="p-3 sm:p-4">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="max-h-400 overflow-y-auto scrollbar-hide">
            <div className="space-y-2 p-1 sm:p-2">
              {videos.length === 0 ? (
                <div className="text-center py-4 sm:py-6 text-gray-500">
                  <VideoCameraIcon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs sm:text-sm">{emptyMessage}</p>
                </div>
              ) : (
                videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleVideoClick(video)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-12 h-9 sm:w-16 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      {video.thumbnail_url ? (
                        <Image
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          width={64}
                          height={48}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    </div>

                    {/* Video info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {video.title}
                      </h4>

                      {/* Match information */}
                      {video.match && (
                        <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                          <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                            {video.match.home_team.name} vs {video.match.away_team.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                            <span>{new Date(video.match.date).toLocaleDateString('cs-CZ')}</span>
                            {video.match.status === 'completed' && (
                              <>
                                <span className="font-medium">
                                  {video.match.home_score || 0} : {video.match.away_score || 0}
                                </span>
                                {(video.match.home_score_halftime !== undefined ||
                                  video.match.away_score_halftime !== undefined) && (
                                  <span className="text-gray-500">
                                    ({video.match.home_score_halftime || 0} :{' '}
                                    {video.match.away_score_halftime || 0})
                                  </span>
                                )}
                              </>
                            )}
                            {video.match.status === 'upcoming' && (
                              <span className="text-orange-600 dark:text-orange-400 font-medium">
                                Nadcházející
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {video.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1 hidden sm:block">
                          Poznámka: {video.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2 mt-1">
                        {video.recording_date && (
                          <span className="text-xs text-gray-500">
                            Datum nahrání: {formatDateString(video.recording_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1">
                      {/* Copy link button */}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color={copiedVideoId === video.id ? 'success' : 'default'}
                        className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10"
                        onPress={() => handleCopyLink(video)}
                        title={copiedVideoId === video.id ? 'Link zkopírován!' : 'Zkopírovat odkaz'}
                      >
                        {copiedVideoId === video.id ? (
                          <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </Button>

                      {/* Play button */}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10"
                        title="Přehrát video"
                      >
                        <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
