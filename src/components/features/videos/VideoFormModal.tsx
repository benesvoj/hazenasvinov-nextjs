'use client';

import React from 'react';

import {Input, Select, SelectItem, Switch, Textarea} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {ModalMode} from '@/enums';
import {translations} from '@/lib';
import {Category, Club, Season, VideoFormData} from '@/types';
import {isValidYouTubeUrl} from '@/utils';

interface VideoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: VideoFormData;
  setFormData: (data: VideoFormData) => void;
  mode: ModalMode;
  clubs: Club[];
  seasons: Season[];
  categories: Category[];
  isLoading?: boolean;
}

export function VideoFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  clubs,
  categories,
  seasons,
  mode,
  isLoading,
}: VideoFormModalProps) {
  const t = translations.admin.videos;
  const modalTitle = mode === ModalMode.ADD ? t.addVideo : t.editVideo;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="2xl"
      onPress={onSubmit}
      isFooterWithActions
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <Input
          label="Název videa"
          placeholder="Zadejte název videa"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          isRequired
        />

        <Textarea
          label="Popis"
          placeholder="Zadejte popis videa (volitelné)"
          value={formData.description ?? ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          minRows={3}
          maxRows={5}
        />

        {/* YouTube URL */}
        <Input
          label="YouTube URL"
          placeholder="https://www.youtube.com/watch?v=..."
          value={formData.youtube_url}
          onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
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
              setFormData({...formData, category_id: selected});
            }}
            isRequired
          >
            <>
              {categories.length > 0 ? (
                categories.map((category) => (
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
              setFormData({...formData, club_id: selected});
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

        <div className="space-y-4">
          <Input
            label="Datum nahrání"
            type="date"
            value={formData.recording_date ?? ''}
            onChange={(e) => setFormData({...formData, recording_date: e.target.value})}
          />

          <Select
            label="Sezóna"
            placeholder="Vyberte sezónu (volitelné)"
            selectedKeys={formData.season_id ? [formData.season_id] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setFormData({...formData, season_id: selected});
            }}
          >
            <>
              {seasons.length > 0 ? (
                seasons.map((season) => <SelectItem key={season.id}>{season.name}</SelectItem>)
              ) : (
                <SelectItem key="no-seasons" isDisabled>
                  Žádné sezóny k dispozici
                </SelectItem>
              )}
            </>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">Aktivní</h4>
          <p className="text-sm text-gray-600">Video bude viditelné pro uživatele</p>
        </div>
        <Switch
          isSelected={formData.is_active}
          onValueChange={(e) => setFormData({...formData, is_active: e})}
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
    </UnifiedModal>
  );
}

// Helper function to extract YouTube ID
function extractYouTubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
