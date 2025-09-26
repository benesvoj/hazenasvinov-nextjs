'use client';

import React, {useState} from 'react';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from '@heroui/modal';
import {Button} from '@heroui/button';
import {Badge} from '@heroui/badge';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  StarIcon,
  CalendarIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import {Photo, PhotoAlbum} from '@/types/features/gallery/photoGallery';
import {Image} from '@heroui/image';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  currentPhotoIndex: number;
  album: PhotoAlbum;
  onPhotoChange: (index: number) => void;
}

export default function PhotoViewerModal({
  isOpen,
  onClose,
  photos,
  currentPhotoIndex,
  album,
  onPhotoChange,
}: PhotoViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  const currentPhoto = photos[currentPhotoIndex];
  const hasPrevious = currentPhotoIndex > 0;
  const hasNext = currentPhotoIndex < photos.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      onPhotoChange(currentPhotoIndex - 1);
      setIsLoading(true);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      onPhotoChange(currentPhotoIndex + 1);
      setIsLoading(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrevious) {
      goToPrevious();
    } else if (e.key === 'ArrowRight' && hasNext) {
      goToNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (!currentPhoto) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      onKeyDown={handleKeyDown}
      classNames={{
        base: 'max-h-[90vh]',
        body: 'p-0',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <PhotoIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {album.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fotografie {currentPhotoIndex + 1} z {photos.length}
                </p>
              </div>
            </div>

            <Button
              isIconOnly
              variant="light"
              onPress={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>
        </ModalHeader>

        <ModalBody className="p-0">
          <div className="relative bg-black">
            {/* Main Photo */}
            <div className="relative flex items-center justify-center min-h-[60vh]">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}

              <Image
                src={currentPhoto.file_url}
                alt={currentPhoto.title || `Fotografie ${currentPhotoIndex + 1}`}
                className={`max-w-full max-h-[70vh] object-contain transition-opacity duration-200 ${
                  isLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={handleImageLoad}
                width={100}
                height={100}
              />
            </div>

            {/* Navigation Arrows */}
            {hasPrevious && (
              <Button
                isIconOnly
                size="lg"
                variant="flat"
                color="default"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                onPress={goToPrevious}
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </Button>
            )}

            {hasNext && (
              <Button
                isIconOnly
                size="lg"
                variant="flat"
                color="default"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                onPress={goToNext}
              >
                <ChevronRightIcon className="w-6 h-6" />
              </Button>
            )}

            {/* Photo Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="text-white">
                {currentPhoto.title && (
                  <h3 className="text-xl font-semibold mb-2">{currentPhoto.title}</h3>
                )}

                {currentPhoto.description && (
                  <p className="text-gray-200 mb-3">{currentPhoto.description}</p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(currentPhoto.created_at).toLocaleDateString('cs-CZ')}</span>
                  </div>

                  {currentPhoto.is_featured && (
                    <Badge color="warning" variant="flat" size="sm">
                      <StarIcon className="w-3 h-3" />
                      Hlavní
                    </Badge>
                  )}

                  {currentPhoto.width && currentPhoto.height && (
                    <div className="flex items-center space-x-1">
                      <PhotoIcon className="w-4 h-4" />
                      <span>
                        {currentPhoto.width} × {currentPhoto.height} px
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="light"
              onPress={goToPrevious}
              isDisabled={!hasPrevious}
              startContent={<ChevronLeftIcon className="w-4 h-4" />}
            >
              Předchozí
            </Button>

            <Button
              variant="light"
              onPress={goToNext}
              isDisabled={!hasNext}
              endContent={<ChevronRightIcon className="w-4 h-4" />}
            >
              Další
            </Button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
