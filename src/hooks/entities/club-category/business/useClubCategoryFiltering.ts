import {ClubCategoryWithRelations} from '@/types';

export interface ClubCategoriesFilters {
  searchTerm?: string;
  selectedSeason?: string;
}

export const useClubCategoryFiltering = (
  data: ClubCategoryWithRelations[],
  filters?: ClubCategoriesFilters
) => {
  let filtered = data;

  if (filters?.selectedSeason) {
    filtered = filtered.filter((cc) => cc.season_id === filters.selectedSeason);
  }

  if (filters?.searchTerm) {
    filtered = filtered.filter(
      (cc) =>
        cc.club?.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        cc.category?.name.toLowerCase().includes(filters.searchTerm!.toLowerCase())
    );
  }

  return {
    data: filtered,
  };
};
