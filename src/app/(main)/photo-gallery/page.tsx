'use client';

import React, {useState, useEffect, useCallback} from 'react';
import {Button} from '@heroui/button';
import {Input} from '@heroui/input';
import {PhotoIcon, FolderIcon, MagnifyingGlassIcon} from '@heroicons/react/24/outline';
import {PhotoAlbum, Photo} from '@/types/features/gallery/photoGallery';
import {getPhotoAlbums, getPhotosByAlbum} from '@/utils/supabase/photoGallery';
import PhotoViewerModal from './components/PhotoViewerModal';
import PhotoGrid from './components/PhotoGrid';
import AlbumCard from './components/AlbumCard';

export default function PhotoGalleryPage() {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Load photos for a specific album
  const loadPhotosForAlbum = useCallback(async (album: PhotoAlbum) => {
    try {
      setSelectedAlbum(album);
      const albumPhotos = await getPhotosByAlbum(album.id);
      setPhotos(albumPhotos);
    } catch (err) {
      console.error('Error loading photos:', err);
    }
  }, []);

  // Load albums
  const loadAlbums = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPhotoAlbums();
      // Only show public albums
      const publicAlbums = data.filter((album) => album.is_public);
      setAlbums(publicAlbums);

      // Load photos for the first album if available
      if (publicAlbums.length > 0) {
        await loadPhotosForAlbum(publicAlbums[0]);
      }
    } catch (err) {
      setError('Chyba při načítání fotogalerie');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loadPhotosForAlbum]);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  // Filter albums based on search term
  const filteredAlbums = albums.filter(
    (album) =>
      album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (album.description && album.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600 dark:text-gray-400">Načítání fotogalerie...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
            <Button color="primary" onPress={loadAlbums}>
              Zkusit znovu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <PhotoIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Fotogalerie</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Prohlížejte si fotografie z našich akcí, zápasů a událostí
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Hledat v albu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Albums Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Fotoalba
          </h2>

          {filteredAlbums.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Žádná alba nebyla nalezena' : 'Zatím nejsou k dispozici žádná alba'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} onAlbumClick={loadPhotosForAlbum} />
              ))}
            </div>
          )}
        </div>

        {/* Selected Album Photos */}
        {selectedAlbum && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedAlbum.title}
              </h2>
              {selectedAlbum.description && (
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  {selectedAlbum.description}
                </p>
              )}
              <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <PhotoIcon className="w-4 h-4" />
                  <span>{photos.length} fotografií</span>
                </div>
              </div>
            </div>

            {/* Photos Grid */}
            <PhotoGrid
              photos={photos}
              onPhotoClick={(index) => {
                setSelectedPhotoIndex(index);
                setIsPhotoViewerOpen(true);
              }}
            />
          </div>
        )}

        {/* Back to Top */}
        <div className="text-center">
          <Button
            color="primary"
            variant="flat"
            onPress={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          >
            Zpět nahoru
          </Button>
        </div>

        {/* Photo Viewer Modal */}
        {selectedAlbum && (
          <PhotoViewerModal
            isOpen={isPhotoViewerOpen}
            onClose={() => setIsPhotoViewerOpen(false)}
            photos={photos}
            currentPhotoIndex={selectedPhotoIndex}
            album={selectedAlbum}
            onPhotoChange={setSelectedPhotoIndex}
          />
        )}
      </div>
    </div>
  );
}
