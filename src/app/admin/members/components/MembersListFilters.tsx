'use client';

import {Button, Input, Select, SelectItem} from '@heroui/react';

import {MagnifyingGlassIcon, TrashIcon} from '@heroicons/react/24/outline';

import {MemberFilters} from '@/types/entities/member/data/memberWithPaymentStatus';

import {Genders, getMemberFunctionOptions} from '@/enums';
import {translations} from '@/lib';
import {Category} from '@/types';

interface MembersListFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: MemberFilters;
  onFiltersChange: (filters: MemberFilters) => void;
  onClearFilters: () => void;
  categories: Category[];
}

export function MembersListFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
  categories,
}: MembersListFiltersProps) {
  const t = translations.members;
  const hasActiveFilters = filters.sex || filters.category_id || filters.function;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        {/* Search Input */}
        <div className="w-full lg:w-80">
          <Input
            placeholder={t.table.filters.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
            size="sm"
            aria-label="Search members"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Sex Filter */}
          <div className="w-full sm:w-40">
            <Select
              aria-label="Filter by gender"
              placeholder="Všechna pohlaví"
              selectedKeys={filters.sex && filters.sex !== Genders.EMPTY ? [filters.sex] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as Genders;
                onFiltersChange({
                  ...filters,
                  sex: selectedKey || Genders.EMPTY,
                });
              }}
              className="w-full"
              size="sm"
            >
              <SelectItem key="male">Muži</SelectItem>
              <SelectItem key="female">Ženy</SelectItem>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-48">
            <Select
              aria-label="Filter by category"
              placeholder="Všechny kategorie"
              selectedKeys={filters.category_id ? [filters.category_id] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                onFiltersChange({
                  ...filters,
                  category_id: selectedKey || '',
                });
              }}
              className="w-full"
              size="sm"
            >
              {categories.map((category) => (
                <SelectItem key={category.id} aria-label={`Select category ${category.name}`}>
                  {category.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Function Filter */}
          <div className="w-full sm:w-48">
            <Select
              aria-label="Filter by function"
              placeholder="Všechny funkce"
              selectedKeys={filters.function ? [filters.function] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                onFiltersChange({
                  ...filters,
                  function: selectedKey || '',
                });
              }}
              className="w-full"
              size="sm"
            >
              {getMemberFunctionOptions().map(({value, label}) => (
                <SelectItem key={value} aria-label={`Select function ${label}`}>
                  {label}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="w-full sm:w-auto">
              <Button
                variant="light"
                size="sm"
                onPress={onClearFilters}
                className="w-full sm:w-auto"
                aria-label="Clear all filters"
              >
                <TrashIcon className="w-4 h-4" />
                {t.table.filters.clearAll}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
