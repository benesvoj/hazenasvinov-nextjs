'use client';

import React, {memo} from 'react';

import {Button} from '@heroui/button';
import {Switch} from '@heroui/switch';

import {FunnelIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {Choice, ContentCard, Grid, HStack, Search} from '@/components';
import {Category, Club, Season} from '@/types';

import type {RecordingFilters as RecordingFiltersType} from '../types';

interface RecordingFiltersProps {
  filters: RecordingFiltersType;
  onFiltersChange: (filters: RecordingFiltersType) => void;
  categories: Category[];
  clubs: Club[];
  seasons: Season[];
  availableCategories?: Category[]; // For coaches - only show assigned category
}

export const RecordingFilters = memo(function RecordingFilters({
  filters,
  onFiltersChange,
  categories,
  clubs,
  seasons,
  availableCategories,
}: RecordingFiltersProps) {
  // Use availableCategories if provided (for coaches), otherwise use all category
  const displayCategories = availableCategories || categories;

  const handleSearchFilter = (search: string) => {
    onFiltersChange({
      ...filters,
      search: search || undefined,
    });
  };

  const handleCategoryFilter = (categoryId: string) => {
    onFiltersChange({
      ...filters,
      category_id: categoryId === 'all' ? undefined : categoryId,
    });
  };

  const handleClubFilter = (clubId: string) => {
    onFiltersChange({
      ...filters,
      club_id: clubId === 'all' ? undefined : clubId,
    });
  };

  const handleSeasonFilter = (seasonId: string) => {
    onFiltersChange({
      ...filters,
      season_id: seasonId === 'all' ? undefined : seasonId,
    });
  };

  const handleActiveFilter = (isActive: boolean) => {
    onFiltersChange({
      ...filters,
      is_active: isActive,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const clubOptions = clubs.map((club) => ({key: club.id, label: club.name}));
  const seasonOptions = seasons.map((season) => ({key: season.id, label: season.name}));
  const categoryOptions = displayCategories.map((category) => ({
    key: category.id,
    label: category.name,
  }));

  return (
    <ContentCard fullWidth>
      <Grid columns={6} gap={'sm'} className={'items-center'}>
        <Search
          value={filters.search || ''}
          onChange={handleSearchFilter}
          placeholder={translations.matchRecordings.placeholders.search}
        />

        <Choice
          items={categoryOptions}
          value={filters.category_id || 'all'}
          onChange={(id) => handleCategoryFilter(id || 'all')}
          placeholder={translations.matchRecordings.placeholders.allCategories}
          isClearable
        />

        <Choice
          items={clubOptions}
          value={filters.club_id || 'all'}
          onChange={(id) => handleClubFilter(id || 'all')}
          placeholder={translations.matchRecordings.placeholders.allClubs}
          isClearable
        />

        <Choice
          items={seasonOptions}
          value={filters.season_id || 'all'}
          onChange={(id) => handleSeasonFilter(id || 'all')}
          placeholder={translations.matchRecordings.placeholders.allSeasons}
          isClearable
        />

        <HStack spacing={2}>
          <Switch
            size={'sm'}
            isSelected={filters.is_active === true}
            onValueChange={handleActiveFilter}
          />
          <span className="text-sm text-gray-600">
            {translations.matchRecordings.labels.activeOnly}
          </span>
        </HStack>

        <Button variant="bordered" onPress={clearFilters} isIconOnly>
          <FunnelIcon className="w-4 h-4" />
        </Button>
      </Grid>
    </ContentCard>
  );
});
