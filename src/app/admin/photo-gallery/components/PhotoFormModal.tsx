'use client';

import React, {useState, useEffect} from 'react';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from '@heroui/modal';
import {Button} from '@heroui/button';
import {Input} from '@heroui/input';
import {Textarea} from '@heroui/input';
import {Switch} from '@heroui/switch';
import {Photo, CreatePhotoData, UpdatePhotoData} from '@/types/features/gallery/photoGallery';

interface PhotoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePhotoData | UpdatePhotoData) => void;
  photo?: Photo | null;
  albumId: string;
}

export default function PhotoFormModal({
  isOpen,
  onClose,
  onSubmit,
  photo,
  albumId,
}: PhotoFormModalProps) {
  const [formData, setFormData] = useState<CreatePhotoData>({
    album_id: albumId,
    title: '',
    description: '',
    file_path: '',
    file_url: '',
    sort_order: 0,
    is_featured: false,
  });
  const [loading, setLoading] = useState(false);

  // Reset form when photo changes
  useEffect(() => {
    if (photo) {
      setFormData({
        album_id: photo.album_id,
        title: photo.title || '',
        description: photo.description || '',
        file_path: photo.file_path,
        file_url: photo.file_url,
        sort_order: photo.sort_order,
        is_featured: photo.is_featured,
      });
    } else {
      setFormData({
        album_id: albumId,
        title: '',
        description: '',
        file_path: '',
        file_url: '',
        sort_order: 0,
        is_featured: false,
      });
    }
  }, [photo, albumId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreatePhotoData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            {photo ? 'Upravit fotografii' : 'Nová fotografie'}
          </ModalHeader>
          <ModalBody className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Název fotografie
              </label>
              <Input
                placeholder="Zadejte název fotografie (volitelné)"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Popis</label>
              <Textarea
                placeholder="Zadejte popis fotografie (volitelné)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                maxLength={1000}
                rows={3}
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pořadí</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.sort_order?.toString() || '0'}
                onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                min={0}
              />
              <p className="text-xs text-gray-500">Nižší číslo = vyšší priorita v albu</p>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hlavní fotografie
                </label>
                <p className="text-xs text-gray-500">
                  Hlavní fotografie se zobrazí s výraznějším označením
                </p>
              </div>
              <Switch
                isSelected={formData.is_featured}
                onValueChange={(value) => handleInputChange('is_featured', value)}
                color="warning"
              />
            </div>

            {/* File Info (Read-only for editing) */}
            {photo && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Soubor
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>Cesta: {photo.file_path}</div>
                    <div>URL: {photo.file_url}</div>
                    {photo.file_size && (
                      <div>Velikost: {(photo.file_size / 1024 / 1024).toFixed(2)} MB</div>
                    )}
                    {photo.mime_type && <div>Typ: {photo.mime_type}</div>}
                    {photo.width && photo.height && (
                      <div>
                        Rozměry: {photo.width} × {photo.height} px
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Zrušit
            </Button>
            <Button color="primary" type="submit" isLoading={loading}>
              {photo ? 'Uložit změny' : 'Vytvořit fotografii'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
