'use client';

import React, {useState, useEffect} from 'react';
import {Video, VideoFormData, Category, Club} from '@/types';
import {useCategories} from '@/hooks/entities/category/useCategories';
import {useSeasons} from '@/hooks/entities/season/useSeasons';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Button,
} from '@heroui/react';

interface VideoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: VideoFormData) => void;
  video?: Video | null;
  clubs: Club[];
  availableCategories?: Category[]; // For coaches - only show assigned category
}

export function VideoFormModal({
  isOpen,
  onClose,
  onSubmit,
  video,
  clubs,
  availableCategories,
}: VideoFormModalProps) {
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    youtube_url: '',
    category_id: '',
    club_id: '',
    recording_date: '',
    season_id: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use hooks to fetch data
  const {categories, loading: categoriesLoading, fetchCategories} = useCategories();
  const {seasons, loading: seasonsLoading, fetchAllSeasons} = useSeasons();

  // Use availableCategories if provided (for coaches), otherwise use all category
  const displayCategories = availableCategories || categories;

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!availableCategories) {
        fetchCategories();
      }
      fetchAllSeasons();
    }
  }, [isOpen, fetchCategories, fetchAllSeasons, availableCategories]);

  // Reset form when modal opens/closes or video changes
  useEffect(() => {
    if (isOpen) {
      if (video) {
        setFormData({
          title: video.title,
          description: video.description || '',
          youtube_url: video.youtube_url,
          category_id: video.category_id,
          club_id: video.club_id || '',
          recording_date: video.recording_date || '',
          season_id: video.season_id || '',
          is_active: video.is_active,
        });
      } else {
        setFormData({
          title: '',
          description: '',
          youtube_url: '',
          category_id: '',
          club_id: '',
          recording_date: '',
          season_id: '',
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, video]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Název je povinný';
    }

    if (!formData.youtube_url.trim()) {
      newErrors.youtube_url = 'YouTube URL je povinná';
    } else if (!isValidYouTubeUrl(formData.youtube_url)) {
      newErrors.youtube_url = 'Neplatná YouTube URL';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Kategorie je povinná';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return regex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof VideoFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">{video ? 'Upravit video' : 'Přidat nové video'}</h2>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-6">
            {/* Full width fields */}
            <div className="space-y-4">
              {/* Title */}
              <Input
                label="Název videa"
                placeholder="Zadejte název videa"
                value={formData.title}
                onValueChange={(value) => handleInputChange('title', value)}
                isInvalid={!!errors.title}
                errorMessage={errors.title}
                isRequired
              />

              {/* Description */}
              <Textarea
                label="Popis"
                placeholder="Zadejte popis videa (volitelné)"
                value={formData.description}
                onValueChange={(value) => handleInputChange('description', value)}
                minRows={3}
                maxRows={5}
              />

              {/* YouTube URL */}
              <Input
                label="YouTube URL"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtube_url}
                onValueChange={(value) => handleInputChange('youtube_url', value)}
                isInvalid={!!errors.youtube_url}
                errorMessage={errors.youtube_url}
                isRequired
                description="Zadejte plnou URL adresu YouTube videa"
              />
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                {/* Category */}
                <Select
                  label="Kategorie"
                  placeholder="Vyberte kategorii"
                  selectedKeys={formData.category_id ? [formData.category_id] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    handleInputChange('category_id', selected);
                  }}
                  isInvalid={!!errors.category_id}
                  errorMessage={errors.category_id}
                  isRequired
                  isLoading={categoriesLoading}
                >
                  <>
                    {displayCategories.length > 0 ? (
                      displayCategories.map((category) => (
                        <SelectItem key={category.id}>{category.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-categories" isDisabled>
                        Žádné kategorie k dispozici
                      </SelectItem>
                    )}
                  </>
                </Select>

                {/* Club */}
                <Select
                  label="Klub"
                  placeholder="Vyberte klub (volitelné)"
                  selectedKeys={formData.club_id ? [formData.club_id] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    handleInputChange('club_id', selected);
                  }}
                >
                  <>
                    {clubs.length > 0 ? (
                      clubs.map((club) => <SelectItem key={club.id}>{club.name}</SelectItem>)
                    ) : (
                      <SelectItem key="no-clubs" isDisabled>
                        Žádné kluby k dispozici
                      </SelectItem>
                    )}
                  </>
                </Select>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Recording Date */}
                <Input
                  label="Datum nahrání"
                  type="date"
                  value={formData.recording_date}
                  onValueChange={(value) => handleInputChange('recording_date', value)}
                />

                {/* Season */}
                <Select
                  label="Sezóna"
                  placeholder="Vyberte sezónu (volitelné)"
                  selectedKeys={formData.season_id ? [formData.season_id] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    handleInputChange('season_id', selected);
                  }}
                  isLoading={seasonsLoading}
                >
                  <>
                    {seasons.length > 0 ? (
                      seasons.map((season) => (
                        <SelectItem key={season.id}>{season.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-seasons" isDisabled>
                        Žádné sezóny k dispozici
                      </SelectItem>
                    )}
                  </>
                </Select>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Aktivní</h4>
                <p className="text-sm text-gray-600">Video bude viditelné pro uživatele</p>
              </div>
              <Switch
                isSelected={formData.is_active}
                onValueChange={(value) => handleInputChange('is_active', value)}
              />
            </div>

            {/* Preview */}
            {formData.youtube_url && isValidYouTubeUrl(formData.youtube_url) && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Náhled</h4>
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    YouTube ID: {extractYouTubeId(formData.youtube_url)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Náhled: https://img.youtube.com/vi/
                    {extractYouTubeId(formData.youtube_url)}/maxresdefault.jpg
                  </p>
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onClose} disabled={isSubmitting}>
              Zrušit
            </Button>
            <Button color="primary" type="submit" isLoading={isSubmitting}>
              {video ? 'Uložit změny' : 'Přidat video'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// Helper function to extract YouTube ID
function extractYouTubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
