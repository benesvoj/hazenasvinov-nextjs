import {Select, SelectItem, Input} from '@heroui/react';

import {translations} from '@/lib/translations';

import {UnifiedModal} from '@/components';
import {ModalMode} from '@/enums';
import {Category, Club, ClubCategoryInsert, Season} from '@/types';

interface ClubCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPress: () => void;
  mode: ModalMode;
  formData: ClubCategoryInsert;
  setFormData: (form: ClubCategoryInsert) => void;
  clubs: Club[];
  categories: Category[];
  seasons: Season[];
}

export const ClubCategoriesModal = ({
  isOpen,
  onClose,
  onPress,
  mode,
  formData,
  setFormData,
  clubs,
  categories,
  seasons,
}: ClubCategoriesModalProps) => {
  const t = translations.admin.clubCategories;

  const isEditMode = mode === ModalMode.EDIT;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t.editClubCategory : t.modal.title}
      size="2xl"
      onPress={onPress}
      isFooterWithActions
      classNames={{
        body: 'grid grid-cols-1 lg:grid-cols-2',
      }}
    >
      <Select
        label={t.modal.club}
        placeholder={t.modal.clubPlaceholder}
        selectedKeys={formData.club_id ? [formData.club_id] : []}
        isRequired
        onSelectionChange={(keys) => {
          const clubId = Array.from(keys)[0] as string;
          setFormData({...formData, club_id: clubId});
        }}
      >
        {clubs.map((club: any) => (
          <SelectItem key={club.id}>{club.name}</SelectItem>
        ))}
      </Select>
      <Select
        label={t.modal.category}
        placeholder={t.modal.categoryPlaceholder}
        isRequired
        selectedKeys={formData.category_id ? [formData.category_id] : []}
        onSelectionChange={(keys) => {
          const categoryId = Array.from(keys)[0] as string;
          setFormData({...formData, category_id: categoryId});
        }}
      >
        {categories.map((category: any) => (
          <SelectItem key={category.id}>{category.name}</SelectItem>
        ))}
      </Select>
      <Select
        label={t.modal.season}
        placeholder={t.modal.seasonPlaceholder}
        isRequired
        selectedKeys={formData.season_id ? [formData.season_id] : []}
        onSelectionChange={(keys) => {
          const seasonId = Array.from(keys)[0] as string;
          setFormData({...formData, season_id: seasonId});
        }}
      >
        {seasons.map((season: any) => (
          <SelectItem key={season.id}>{season.name}</SelectItem>
        ))}
      </Select>
      <Input
        label={t.modal.maxTeams}
        placeholder={t.modal.maxTeamsPlaceholder}
        type="number"
        min="1"
        value={formData.max_teams ? formData.max_teams.toString() : '1'}
        onChange={(e) => setFormData({...formData, max_teams: parseInt(e.target.value) || 1})}
      />
    </UnifiedModal>
  );
};
