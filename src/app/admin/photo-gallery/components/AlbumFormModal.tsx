'use client';

import React, {useState, useEffect} from 'react';

import {Button} from '@heroui/button';
import {Input, Textarea} from '@heroui/input';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from '@heroui/modal';
import {Switch} from '@heroui/switch';

import {PhotoAlbum, CreateAlbumData, UpdateAlbumData} from '@/types/features/gallery/photoGallery';

interface AlbumFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAlbumData | UpdateAlbumData) => void;
  album?: PhotoAlbum | null;
}

export default function AlbumFormModal({isOpen, onClose, onSubmit, album}: AlbumFormModalProps) {
  const [formData, setFormData] = useState<CreateAlbumData>({
    title: '',
    description: '',
    is_public: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  // Reset form when album changes
  useEffect(() => {
    if (album) {
      setFormData({
        title: album.title,
        description: album.description || '',
        is_public: album.is_public,
        sort_order: album.sort_order,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        is_public: true,
        sort_order: 0,
      });
    }
  }, [album]);

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

  const handleInputChange = (field: keyof CreateAlbumData, value: any) => {
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
            {album ? 'Upravit album' : 'Nové album'}
          </ModalHeader>
          <ModalBody className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Název alba *
              </label>
              <Input
                placeholder="Zadejte název alba"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                maxLength={255}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Popis</label>
              <Textarea
                placeholder="Zadejte popis alba (volitelné)"
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
              <p className="text-xs text-gray-500">Nižší číslo = vyšší priorita v seznamu</p>
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Veřejné album
                </label>
                <p className="text-xs text-gray-500">
                  Veřejná alba jsou viditelná pro všechny návštěvníky webu
                </p>
              </div>
              <Switch
                isSelected={formData.is_public}
                onValueChange={(value) => handleInputChange('is_public', value)}
                color="primary"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Zrušit
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={loading}
              isDisabled={!formData.title.trim()}
            >
              {album ? 'Uložit změny' : 'Vytvořit album'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
