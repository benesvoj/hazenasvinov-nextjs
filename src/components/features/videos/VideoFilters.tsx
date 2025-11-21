'use client';

import React, {memo} from 'react';

import {Button, Input, Select, SelectItem, Switch} from '@heroui/react';

import {FunnelIcon, MagnifyingGlassIcon} from '@heroicons/react/24/outline';

import {Category, Club, Season, VideoFilters as VideoFiltersType} from '@/types';

interface VideoFiltersProps {
  filters: VideoFiltersType;
  onFiltersChange: (filters: VideoFiltersType) => void;
  categories: Category[];
  clubs: Club[];
  seasons: Season[];
  availableCategories?: Category[]; // For coaches - only show assigned category
}

export const VideoFilters = memo(function VideoFilters({
  filters,
  onFiltersChange,
  categories,
  clubs,
  seasons,
  availableCategories,
}: VideoFiltersProps) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Search */}
      <Input
        placeholder="Hledat videa..."
        startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
        value={filters.search || ''}
        onValueChange={handleSearchFilter}
      />

      {/* Category Filter */}
      <Select
        placeholder="Všechny kategorie"
        selectedKeys={filters.category_id ? [filters.category_id] : ['all']}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          handleCategoryFilter(selected);
        }}
      >
        <>
          <SelectItem key="all">Všechny kategorie</SelectItem>
          {displayCategories.map((category) => (
            <SelectItem key={category.id}>{category.name}</SelectItem>
          ))}
        </>
      </Select>

      {/* Club Filter */}
      <Select
        placeholder="Všechny kluby"
        selectedKeys={filters.club_id ? [filters.club_id] : ['all']}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          handleClubFilter(selected);
        }}
      >
        <>
          <SelectItem key="all">Všechny kluby</SelectItem>
          {clubs.map((club) => (
            <SelectItem key={club.id}>{club.name}</SelectItem>
          ))}
        </>
      </Select>

      {/* Season Filter */}
      <Select
        placeholder="Všechny sezóny"
        selectedKeys={filters.season_id ? [filters.season_id] : ['all']}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          handleSeasonFilter(selected);
        }}
      >
        <>
          <SelectItem key="all">Všechny sezóny</SelectItem>
          {seasons.map((season) => (
            <SelectItem key={season.id}>{season.name}</SelectItem>
          ))}
        </>
      </Select>

      {/* Active Filter */}
      <div className="flex items-center gap-2">
        <Switch isSelected={filters.is_active === true} onValueChange={handleActiveFilter} />
        <span className="text-sm text-gray-600">Pouze aktivní</span>
      </div>

      {/* Clear Filters */}
      <Button
        variant="bordered"
        startContent={<FunnelIcon className="w-4 h-4" />}
        onPress={clearFilters}
      >
        Vymazat filtry
      </Button>
    </div>
  );
});
