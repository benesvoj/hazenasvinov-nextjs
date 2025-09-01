'use client';

import React from 'react';
import { Video } from '@/types';
import { 
  PlayIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Chip,
  Image
} from '@heroui/react';

interface VideoCardProps {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
}

export function VideoCard({ video, onEdit, onDelete }: VideoCardProps) {
  const handlePlay = () => {
    window.open(video.youtube_url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        {/* Thumbnail */}
        <div className="relative w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
              fallbackSrc="/placeholder-video.jpg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <PlayIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <Button
              isIconOnly
              color="primary"
              size="lg"
              className="bg-red-600 hover:bg-red-700"
              onPress={handlePlay}
            >
              <PlayIcon className="w-6 h-6" />
            </Button>
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Chip
              size="sm"
              color={video.is_active ? "success" : "default"}
              variant="flat"
            >
              {video.is_active ? (
                <div className="flex items-center gap-1">
                  <EyeIcon className="w-3 h-3" />
                  Aktivní
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <EyeSlashIcon className="w-3 h-3" />
                  Neaktivní
                </div>
              )}
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {video.title}
        </h3>

        {/* Description */}
        {video.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Category and Club */}
        <div className="mb-3 flex flex-wrap gap-2">
          {video.category && (
            <Chip size="sm" variant="bordered" color="primary">
              {video.category.name}
            </Chip>
          )}
          {video.club && (
            <Chip size="sm" variant="bordered" color="secondary">
              {video.club.name}
            </Chip>
          )}
        </div>

        {/* Season and Recording Date */}
        {(video.season || video.recording_date) && (
          <div className="mb-3 text-xs text-gray-500 space-y-1">
            {video.season && (
              <div>Sezóna: {video.season.name}</div>
            )}
            {video.recording_date && (
              <div>Nahráno: {formatDate(video.recording_date)}</div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 mb-4 space-y-1">
          <div>Vytvořeno: {formatDate(video.created_at)}</div>
          {video.updated_at !== video.created_at && (
            <div>Aktualizováno: {formatDate(video.updated_at)}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="bordered"
            startContent={<PlayIcon className="w-4 h-4" />}
            onPress={handlePlay}
            className="flex-1"
          >
            Přehrát
          </Button>
          
          <Button
            size="sm"
            variant="bordered"
            isIconOnly
            onPress={() => onEdit(video)}
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            color="danger"
            variant="bordered"
            isIconOnly
            onPress={() => onDelete(video)}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
