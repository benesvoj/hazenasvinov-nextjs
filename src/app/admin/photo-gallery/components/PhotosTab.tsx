'use client';

import React, {useState, useEffect, useCallback} from 'react';

import {Badge} from '@heroui/badge';
import {Button} from '@heroui/button';
import {Card, CardBody} from '@heroui/card';
import {Image} from '@heroui/image';
import {Select, SelectItem} from '@heroui/select';

import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

import {
  PhotoAlbum,
  Photo,
  CreatePhotoData,
  UpdatePhotoData,
} from '@/types/features/gallery/photoGallery';

import DeleteConfirmationModal from '@/components/ui/modals/DeleteConfirmationModal';

import {
  getPhotoAlbums,
  getPhotosByAlbum,
  createPhoto,
  updatePhoto,
  deletePhoto,
  reorderPhotos,
} from '@/utils/supabase/photoGallery';
import {uploadClubAsset, deleteClubAsset} from '@/utils/supabase/storage';

import PhotoFormModal from './PhotoFormModal';
import PhotoUploadModal from './PhotoUploadModal';

export default function PhotosTab() {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reordering, setReordering] = useState(false);

  // Modal states
  const [isPhotoFormOpen, setIsPhotoFormOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);

  // Load albums and photos
  const loadAlbums = useCallback(async () => {
    try {
      const data = await getPhotoAlbums();
      setAlbums(data);
      if (data.length > 0 && !selectedAlbumId) {
        setSelectedAlbumId(data[0].id);
      }
    } catch (err) {
      setError('Chyba při načítání alb');
      console.error(err);
    }
  }, [selectedAlbumId]);

  const loadPhotos = async (albumId: string) => {
    if (!albumId) return;

    try {
      setLoading(true);
      const data = await getPhotosByAlbum(albumId);
      //console.log('Loaded photos:', data); // Debug log
      setPhotos(data);
    } catch (err) {
      setError('Chyba při načítání fotografií');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  useEffect(() => {
    if (selectedAlbumId) {
      loadPhotos(selectedAlbumId);
    }
  }, [selectedAlbumId]);

  // Handle photo creation/editing
  const handlePhotoSubmit = async (photoData: CreatePhotoData | UpdatePhotoData) => {
    try {
      if (editingPhoto) {
        // Update existing photo
        const updated = await updatePhoto(editingPhoto.id, photoData as UpdatePhotoData);
        if (updated) {
          setPhotos((prev) =>
            prev.map((photo) => (photo.id === editingPhoto.id ? updated : photo))
          );
        }
      } else {
        // Create new photo
        const created = await createPhoto(photoData as CreatePhotoData);
        if (created) {
          setPhotos((prev) => [created, ...prev]);
        }
      }

      setIsPhotoFormOpen(false);
      setEditingPhoto(null);
    } catch (err) {
      setError('Chyba při ukládání fotografie');
      console.error(err);
    }
  };

  // Handle photo deletion
  const handlePhotoDelete = async () => {
    if (!deletingPhoto) return;

    try {
      // Delete from storage first
      await deleteClubAsset(deletingPhoto.file_path);

      // Then delete from database
      const success = await deletePhoto(deletingPhoto.id);
      if (success) {
        setPhotos((prev) => prev.filter((photo) => photo.id !== deletingPhoto.id));
      }
      setIsDeleteModalOpen(false);
      setDeletingPhoto(null);
    } catch (err) {
      setError('Chyba při mazání fotografie');
      console.error(err);
    }
  };

  // Handle photo reordering
  const handleReorder = async (photoId: string, direction: 'up' | 'down') => {
    if (reordering) return; // Prevent multiple simultaneous reorder operations

    try {
      setReordering(true);
      setError(''); // Clear any previous errors
      setSuccess(''); // Clear any previous success messages
      const currentIndex = photos.findIndex((p) => p.id === photoId);
      if (currentIndex === -1) return;

      const newPhotos = [...photos];
      if (direction === 'up' && currentIndex > 0) {
        [newPhotos[currentIndex], newPhotos[currentIndex - 1]] = [
          newPhotos[currentIndex - 1],
          newPhotos[currentIndex],
        ];
      } else if (direction === 'down' && currentIndex < newPhotos.length - 1) {
        [newPhotos[currentIndex], newPhotos[currentIndex + 1]] = [
          newPhotos[currentIndex + 1],
          newPhotos[currentIndex],
        ];
      }

      // Optimistically update UI first
      setPhotos(newPhotos);

      // Update sort order in database
      const photoIds = newPhotos.map((p) => p.id);
      const reorderSuccess = await reorderPhotos(photoIds);

      if (!reorderSuccess) {
        // Revert UI changes if database update failed
        setPhotos(photos);
        setError('Chyba při změně pořadí fotografií');
      } else {
        setSuccess('Pořadí fotografií bylo úspěšně změněno');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error reordering photos:', err);
      setError('Chyba při změně pořadí fotografií');
    } finally {
      setReordering(false);
    }
  };

  // Open edit modal
  const openEditModal = (photo: Photo) => {
    setEditingPhoto(photo);
    setIsPhotoFormOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (photo: Photo) => {
    setDeletingPhoto(photo);
    setIsDeleteModalOpen(true);
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingPhoto(null);
    setIsPhotoFormOpen(true);
  };

  // Open upload modal
  const openUploadModal = () => {
    setIsPhotoUploadOpen(true);
  };

  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId);

  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Nejdříve vytvořte album pro fotografie</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fotografie</h2>
          <p className="text-gray-600 dark:text-gray-400">Správa fotografií v albu</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select
            label="Vyberte album"
            selectedKeys={selectedAlbumId ? [selectedAlbumId] : []}
            onSelectionChange={(keys) => {
              const albumId = Array.from(keys)[0] as string;
              setSelectedAlbumId(albumId);
            }}
            className="w-64"
          >
            {albums.map((album) => (
              <SelectItem
                key={album.id}
                textValue={`${album.title} (${album.photo_count || 0} fotek)`}
              >
                {album.title} ({album.photo_count || 0} fotek)
              </SelectItem>
            ))}
          </Select>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={openCreateModal}
            isDisabled={!selectedAlbumId}
          >
            Nová fotografie
          </Button>
          <Button
            color="secondary"
            startContent={<PhotoIcon className="w-5 h-5" />}
            onPress={openUploadModal}
            isDisabled={!selectedAlbumId}
          >
            Nahrát fotky
          </Button>
        </div>
      </div>

      {/* Photos Grid */}
      {selectedAlbumId && (
        <Card className="shadow-sm">
          <CardBody className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Načítání...</div>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12">
                <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500 mb-4">
                  V albu &quot;{selectedAlbum?.title}&quot; zatím nejsou žádné fotografie
                </div>
                <Button color="primary" onPress={openUploadModal}>
                  Nahrát první fotky
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="group">
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <Image
                        src={photo.file_url}
                        alt={photo.title || `Fotografie ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        radius="lg"
                        shadow="sm"
                        onError={() => {
                          console.error('Image failed to load:', photo.file_url);
                        }}
                      />
                      {/* Fallback placeholder - only show if image fails */}
                      <div className="hidden w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400" />
                        <div className="text-xs text-gray-500 mt-2">
                          Obrázek se nepodařilo načíst
                        </div>
                      </div>

                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center z-20">
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => openEditModal(photo)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => openDeleteModal(photo)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Featured badge */}
                      {photo.is_featured && (
                        <div className="absolute top-2 left-2 z-20">
                          <Badge color="warning" variant="flat" size="sm">
                            <StarIcon className="w-3 h-3" />
                            Hlavní
                          </Badge>
                        </div>
                      )}

                      {/* Reorder buttons */}
                      <div className="absolute top-2 right-2 flex flex-col space-y-1 z-20">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="default"
                          onPress={() => handleReorder(photo.id, 'up')}
                          isDisabled={index === 0 || reordering}
                          isLoading={reordering}
                        >
                          <ArrowUpIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="default"
                          onPress={() => handleReorder(photo.id, 'down')}
                          isDisabled={index === photos.length - 1 || reordering}
                          isLoading={reordering}
                        >
                          <ArrowDownIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Photo info */}
                    <div className="mt-2 space-y-1">
                      {photo.title && (
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {photo.title}
                        </div>
                      )}
                      {photo.description && (
                        <div className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">
                          {photo.description}
                        </div>
                      )}
                      <div className="text-gray-500 text-xs">
                        {new Date(photo.created_at).toLocaleDateString('cs-CZ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800">{success}</div>
        </div>
      )}

      {/* Debug Info - Remove this in production */}
      {process.env.NODE_ENV === 'development' && photos.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800 font-medium mb-2">Debug Info (Development Only)</div>
          <div className="text-blue-700 text-sm space-y-1">
            <div>Total photos: {photos.length}</div>
            {photos.slice(0, 2).map((photo, index) => (
              <div key={photo.id} className="ml-4">
                <div>Photo {index + 1}:</div>
                <div className="ml-4 text-xs">
                  <div>ID: {photo.id}</div>
                  <div>File URL: {photo.file_url || 'NULL'}</div>
                  <div>File Path: {photo.file_path || 'NULL'}</div>
                  <div>Title: {photo.title || 'NULL'}</div>
                </div>
                {/* Test image display */}
                <div className="mt-2">
                  <div className="text-xs font-medium">Test Image Display:</div>
                  <Image
                    src={photo.file_url || photo.file_path}
                    alt="Test"
                    className="w-16 h-16 object-cover border rounded"
                    radius="sm"
                    onError={() =>
                      console.error('Test image failed:', photo.file_url, photo.file_path)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <PhotoFormModal
        isOpen={isPhotoFormOpen}
        onClose={() => {
          setIsPhotoFormOpen(false);
          setEditingPhoto(null);
        }}
        onSubmit={handlePhotoSubmit}
        photo={editingPhoto}
        albumId={selectedAlbumId}
      />

      <PhotoUploadModal
        isOpen={isPhotoUploadOpen}
        onClose={() => setIsPhotoUploadOpen(false)}
        albumId={selectedAlbumId}
        onPhotosUploaded={(newPhotos: Photo[]) => {
          setPhotos((prev) => [...newPhotos, ...prev]);
        }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingPhoto(null);
        }}
        onConfirm={handlePhotoDelete}
        title="Smazat fotografii"
        message={`Opravdu chcete smazat fotografii "${deletingPhoto?.title || 'bez názvu'}"? Tato akce je nevratná.`}
      />
    </div>
  );
}
