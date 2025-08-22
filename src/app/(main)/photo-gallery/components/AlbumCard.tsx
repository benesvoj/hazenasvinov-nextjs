'use client';

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Image } from "@heroui/image";
import { 
  PhotoIcon,
  EyeIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import { PhotoAlbum } from "@/types/photoGallery";

interface AlbumCardProps {
  album: PhotoAlbum;
  onAlbumClick: (album: PhotoAlbum) => void;
}

export default function AlbumCard({ album, onAlbumClick }: AlbumCardProps) {
  return (
    <Card 
      className="group cursor-pointer bg-white dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-500/10 dark:hover:shadow-gray-900/50"
      isPressable
      onPress={() => onAlbumClick(album)}
    >
      <CardBody className="p-0 overflow-hidden">
        <div className="relative overflow-hidden">
          {album.cover_photo_url ? (
            <div className="relative overflow-hidden">
              <Image
                src={album.cover_photo_url}
                alt={album.title}
                className="w-full h-48 object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                radius="none"
                shadow="none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border-0">
              <div className="text-center">
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <div className="text-xs text-gray-500">Žádný náhled</div>
              </div>
            </div>
          )}
          
          {/* Photo count badge - HeroUI style */}
          <div className="absolute top-3 right-3">
            <Badge 
              color="primary" 
              variant="flat" 
              size="sm"
              className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50"
            >
              {album.photo_count || 0} fotek
            </Badge>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {album.title}
          </h3>
          
          {album.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
              {album.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(album.created_at).toLocaleDateString('cs-CZ')}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <EyeIcon className="w-4 h-4" />
              <span>Veřejné</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
