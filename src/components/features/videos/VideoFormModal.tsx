'use client';

import React from 'react';

import {Input, Textarea} from '@heroui/input';
import {Switch} from '@heroui/switch';

import {translations} from '@/lib/translations';

import {Choice, Dialog} from '@/components';
import {ModalMode} from '@/enums';
import {Category, Club, Season, VideoFormData} from '@/types';

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
  const t = translations.matchRecordings;
  const modalTitle = mode === ModalMode.ADD ? t.titles.add : t.titles.edit;
  const submitButtonLabel =
    mode === ModalMode.ADD ? translations.common.actions.create : translations.common.actions.save;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      submitButtonLabel={submitButtonLabel}
      size="2xl"
      onSubmit={onSubmit}
      isLoading={isLoading}
    >
      <Input
        label={t.labels.title}
        placeholder={t.placeholders.title}
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        isRequired
        size={'sm'}
      />

      <Textarea
        label={t.labels.description}
        placeholder={t.placeholders.description}
        value={formData.description ?? ''}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        minRows={3}
        maxRows={5}
      />

      <Input
        label={t.labels.youtubeUrl}
        placeholder={t.placeholders.youtubeUrl}
        value={formData.youtube_url}
        onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
        isRequired
        description={t.helpers.youtubeUrl}
        size={'sm'}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Choice
            items={categories.map((c) => ({key: c.id, label: c.name}))}
            value={formData.category_id}
            onChange={(id) => setFormData({...formData, category_id: id ?? ''})}
            label={translations.categories.labels.category}
            placeholder={translations.categories.placeholders.category}
            isRequired
          />
          <Choice
            items={clubs.map((c) => ({key: c.id, label: c.name}))}
            value={formData.club_id}
            onChange={(id) => setFormData({...formData, club_id: id ?? ''})}
            label={translations.clubs.labels.club}
            placeholder={translations.clubs.placeholders.club}
          />
        </div>

        <div className="space-y-4">
          <Input
            label={t.labels.recordingDate}
            type="date"
            value={formData.recording_date ?? ''}
            onChange={(e) => setFormData({...formData, recording_date: e.target.value})}
            size={'sm'}
          />

          <Choice
            items={seasons.map((c) => ({key: c.id, label: c.name}))}
            value={formData.season_id}
            onChange={(id) => setFormData({...formData, season_id: id ?? ''})}
            label={translations.seasons.labels.season}
            placeholder={translations.seasons.placeholders.season}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">{t.labels.active}</h4>
          <p className="text-sm text-gray-600">{t.placeholders.active}</p>
        </div>
        <Switch
          isSelected={formData.is_active}
          onValueChange={(e) => setFormData({...formData, is_active: e})}
          size={'sm'}
        />
      </div>
    </Dialog>
  );
}
