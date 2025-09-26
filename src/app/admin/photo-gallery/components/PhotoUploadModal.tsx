'use client';

import React, {useState, useCallback} from 'react';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from '@heroui/modal';
import {Button} from '@heroui/button';
import {Progress} from '@heroui/progress';
import {Badge} from '@heroui/badge';
import {
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {Photo, CreatePhotoData} from '@/types/features/gallery/photoGallery';
import {createPhoto} from '@/utils/supabase/photoGallery';
import {uploadClubAsset} from '@/utils/supabase/storage';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string;
  onPhotosUploaded: (photos: Photo[]) => void;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  photo?: Photo;
}

export default function PhotoUploadModal({
  isOpen,
  onClose,
  albumId,
  onPhotosUploaded,
}: PhotoUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      alert('Některé soubory nejsou obrázky a byly vynechány.');
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles]);
  }, []);

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearFiles = () => {
    setSelectedFiles([]);
    setUploadProgress([]);
    setUploadComplete(false);
  };

  // Upload files
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(
      selectedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'pending',
      }))
    );

    const uploadedPhotos: Photo[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      try {
        // Update status to uploading
        setUploadProgress((prev) =>
          prev.map((item, index) => (index === i ? {...item, status: 'uploading'} : item))
        );

        // Generate unique file path
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${i}.${fileExtension}`;
        const filePath = `photo-gallery/${albumId}/${fileName}`;

        // Upload to storage
        const uploadResult = await uploadClubAsset(file, filePath);

        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }

        // Get image dimensions
        const dimensions = await getImageDimensions(file);

        // Create photo record
        const photoData: CreatePhotoData = {
          album_id: albumId,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          file_path: uploadResult.path,
          file_url: uploadResult.url,
          file_size: file.size,
          mime_type: file.type,
          width: dimensions.width,
          height: dimensions.height,
          sort_order: i,
          is_featured: false,
        };

        const photo = await createPhoto(photoData);

        if (photo) {
          uploadedPhotos.push(photo);

          // Update progress to success
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? {
                    ...item,
                    status: 'success',
                    progress: 100,
                    photo,
                  }
                : item
            )
          );
        }
      } catch (error) {
        console.error('Upload error:', error);

        // Update progress to error
        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i
              ? {
                  ...item,
                  status: 'error',
                  progress: 0,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : item
          )
        );
      }
    }

    setIsUploading(false);
    setUploadComplete(true);

    if (uploadedPhotos.length > 0) {
      onPhotosUploaded(uploadedPhotos);
    }
  };

  // Get image dimensions
  const getImageDimensions = (file: File): Promise<{width: number; height: number}> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({width: img.width, height: img.height});
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Close modal and reset state
  const handleClose = () => {
    clearFiles();
    onClose();
  };

  const successCount = uploadProgress.filter((p) => p.status === 'success').length;
  const errorCount = uploadProgress.filter((p) => p.status === 'error').length;
  const pendingCount = uploadProgress.filter((p) => p.status === 'pending').length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Nahrát fotografie</ModalHeader>
        <ModalBody className="space-y-6">
          {/* File Selection */}
          {!isUploading && !uploadComplete && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Vyberte fotografie k nahrání
                </div>
                <div className="text-gray-600 dark:text-gray-400 mb-4">
                  Podporované formáty: JPG, PNG, WebP, GIF (max 5MB)
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button color="primary" as="span">
                    Vybrat soubory
                  </Button>
                </label>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Vybrané soubory ({selectedFiles.length})
                    </h3>
                    <Button variant="light" color="danger" onPress={clearFiles}>
                      Vymazat vše
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <PhotoIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => removeFile(index)}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nahrávání fotografií...
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Prosím vyčkejte, nahrávání může trvat několik minut
                </div>
              </div>

              <div className="space-y-3">
                {uploadProgress.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.file.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {item.status === 'pending' && (
                          <Badge color="default" variant="flat">
                            Čeká
                          </Badge>
                        )}
                        {item.status === 'uploading' && (
                          <Badge color="primary" variant="flat">
                            Nahrává se
                          </Badge>
                        )}
                        {item.status === 'success' && (
                          <Badge color="success" variant="flat">
                            <CheckIcon className="w-3 h-3" />
                            Úspěch
                          </Badge>
                        )}
                        {item.status === 'error' && (
                          <Badge color="danger" variant="flat">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            Chyba
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Progress
                      value={item.progress}
                      color={item.status === 'error' ? 'danger' : 'primary'}
                      className="w-full"
                    />

                    {item.error && (
                      <div className="text-sm text-red-600 dark:text-red-400">{item.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Complete */}
          {uploadComplete && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nahrávání dokončeno
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {successCount} fotografií bylo úspěšně nahráno
                  {errorCount > 0 && `, ${errorCount} se nepodařilo nahrát`}
                </div>
              </div>

              {errorCount > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="text-red-800 dark:text-red-200">
                    Některé soubory se nepodařilo nahrát. Zkuste je nahrát znovu.
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {!isUploading && !uploadComplete && (
            <>
              <Button variant="light" onPress={handleClose}>
                Zrušit
              </Button>
              <Button color="primary" onPress={uploadFiles} isDisabled={selectedFiles.length === 0}>
                Nahrát {selectedFiles.length} fotografií
              </Button>
            </>
          )}

          {uploadComplete && (
            <Button color="primary" onPress={handleClose}>
              Dokončit
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
