'use client';

import {useEffect} from 'react';

import {Input, Textarea} from '@heroui/input';

import {translations} from '@/lib/translations';

import {Choice, Dialog, HStack, VStack} from '@/components';
import {useTournamentForm} from '@/hooks';
import {Category, Season, Tournament} from '@/types';
import {isNotNilOrEmpty} from '@/utils';

interface TournamentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  onSuccess: (tournament: Tournament) => void;
  categories?: Category[];
  seasons?: Season[];
}

const t = translations.tournaments;

export const TournamentFormModal = ({
  isOpen,
  onClose,
  tournament,
  onSuccess,
  seasons,
  categories,
}: TournamentFormModalProps) => {
  const {formData, updateFormData, handleSubmit, openAddMode, openEditMode} = useTournamentForm();

  const title = isNotNilOrEmpty(tournament) ? t.modal.editTitle : t.modal.addTitle;
  const seasonOptions = seasons?.map((season) => ({label: season.name, key: season.id})) || [];
  const categoryOptions =
    categories?.map((category) => ({label: category.name, key: category.id})) || [];

  useEffect(() => {
    if (tournament) {
      openEditMode(tournament);
    } else {
      openAddMode();
    }
  }, [tournament]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    updateFormData({[field]: value} as Partial<typeof formData>);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onSubmit={async () => {
        try {
          const tournament = await handleSubmit();
          if (tournament) {
            onSuccess(tournament);
            onClose();
          }
        } catch {}
      }}
      size="lg"
    >
      <VStack spacing={4}>
        <Input
          label={t.labels.name}
          value={formData.name}
          onValueChange={(value) => handleInputChange('name', value)}
          isRequired
        />
        <Input
          label={t.labels.slug}
          description={t.placeholders.slug}
          value={formData.slug}
          onValueChange={(value) => handleInputChange('slug', value)}
        />

        <HStack spacing={4} className={'w-full'}>
          <Choice
            items={categoryOptions}
            value={formData.category_id}
            onChange={(value) => handleInputChange('category_id', value || '')}
            label={t.labels.category}
          />

          <Choice
            items={seasonOptions}
            value={formData.season_id}
            onChange={(value) => handleInputChange('season_id', value || '')}
            label={t.labels.season}
          />
        </HStack>
        <HStack spacing={4} className={'w-full'}>
          <Input
            type="date"
            label={t.labels.startDate}
            isRequired
            value={formData.start_date}
            onValueChange={(value) => handleInputChange('start_date', value)}
          />
          <Input
            type="date"
            label={t.labels.endDate}
            value={formData.end_date || undefined}
            onValueChange={(value) => handleInputChange('end_date', value)}
          />
        </HStack>
        <Input
          label={t.labels.venue}
          value={formData.venue || ''}
          onValueChange={(value) => handleInputChange('venue', value)}
        />
        <Textarea
          label={t.labels.description}
          value={formData.description || ''}
          onValueChange={(value) => handleInputChange('description', value)}
          rows={4}
        />
      </VStack>
    </Dialog>
  );
};
