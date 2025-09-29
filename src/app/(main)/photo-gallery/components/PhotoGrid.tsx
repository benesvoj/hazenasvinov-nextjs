'use client';

import React from 'react';

import {Badge} from '@heroui/badge';
import {Image} from '@heroui/image';

import {Photo} from '@/types/features/gallery/photoGallery';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
}

export default function PhotoGrid({photos, onPhotoClick}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 dark:text-gray-400">V albu zatím nejsou žádné fotografie</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {photos.map((photo, index) => (
        <div key={photo.id} className="group">
          <div
            className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 shadow-lg hover:shadow-2xl hover:shadow-gray-500/10 dark:hover:shadow-gray-900/50 transition-all duration-500 ease-out hover:scale-[1.02] cursor-pointer"
            onClick={() => onPhotoClick(index)}
          >
            <div className="relative overflow-hidden w-full h-full">
              <Image
                src={photo.file_url}
                alt={photo.title || `Fotografie ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                radius="none"
                shadow="none"
              />

              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Photo info overlay - HeroUI style */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end">
              <div className="w-full p-5 text-white">
                {photo.title && (
                  <div className="font-bold text-lg mb-2 drop-shadow-lg">{photo.title}</div>
                )}
                {photo.description && (
                  <div className="text-sm opacity-95 line-clamp-2 drop-shadow-md mb-2">
                    {photo.description}
                  </div>
                )}
                <div className="text-xs opacity-90 drop-shadow-md">
                  {new Date(photo.created_at).toLocaleDateString('cs-CZ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
