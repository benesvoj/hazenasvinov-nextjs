'use client';

import {Input} from '@heroui/react';

import {translations} from '@/lib/translations';

import {Choice, Dialog} from '@/components';
import {ModalMode} from '@/enums';
import {Category, Club, ClubCategoryInsert, Season} from '@/types';

interface ClubCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  mode: ModalMode;
  formData: ClubCategoryInsert;
  setFormData: (form: ClubCategoryInsert) => void;
  clubs: Club[];
  categories: Category[];
  seasons: Season[];
  isLoading?: boolean;
}

export const ClubCategoriesModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  formData,
  setFormData,
  clubs,
  categories,
  seasons,
  isLoading,
}: ClubCategoriesModalProps) => {
  const t = translations.clubCategories;

  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode ? t.editClubCategory : t.modal.title;
  const submitButtonLabel = isEditMode
    ? translations.common.actions.save
    : translations.common.actions.add;
  const clubsOptions = clubs.map((club) => ({key: club.id, label: club.name}));
  const categoriesOptions = categories.map((category) => ({
    key: category.id,
    label: category.name,
  }));
  const seasonsOptions = seasons.map((season) => ({key: season.id, label: season.name}));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="2xl"
      onSubmit={onSubmit}
      submitButtonLabel={submitButtonLabel}
      isLoading={isLoading}
      classNames={{
        body: 'grid grid-cols-1 lg:grid-cols-2',
      }}
    >
      <Choice
        label={t.modal.club}
        placeholder={t.modal.clubPlaceholder}
        items={clubsOptions}
        value={formData.club_id}
        onChange={(value) => setFormData({...formData, club_id: value || ''})}
        isRequired
      />
      <Choice
        label={t.modal.category}
        placeholder={t.modal.categoryPlaceholder}
        isRequired
        items={categoriesOptions}
        value={formData.category_id}
        onChange={(value) => setFormData({...formData, category_id: value || ''})}
      />
      <Choice
        label={t.modal.season}
        placeholder={t.modal.seasonPlaceholder}
        isRequired
        items={seasonsOptions}
        value={formData.season_id}
        onChange={(value) => setFormData({...formData, season_id: value || ''})}
      />
      <Input
        label={t.modal.maxTeams}
        placeholder={t.modal.maxTeamsPlaceholder}
        type="number"
        min="1"
        value={formData.max_teams ? formData.max_teams.toString() : '1'}
        onChange={(e) => setFormData({...formData, max_teams: parseInt(e.target.value) || 1})}
        size={'sm'}
      />
    </Dialog>
  );
};
