'use client';

import React from 'react';

import {Button, Select, SelectItem} from '@heroui/react';

import {TrashIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {GenderFilter, Search} from '@/components';
import {Genders, getMemberFunctionOptions} from '@/enums';
import {Category, MemberTableFilters} from '@/types';

interface MembersListFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: MemberTableFilters;
  onFiltersChange: (filters: MemberTableFilters) => void;
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
  const hasActiveFilters = searchTerm || filters.gender || filters.category_id || filters.function;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        <div className="w-full lg:w-80">
          <Search
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={t.table.filters.searchPlaceholder}
            ariaLabel={t.table.filters.searchPlaceholder}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="w-full sm:w-40">
            <GenderFilter
              value={
                filters.gender &&
                filters.gender !== Genders.EMPTY &&
                filters.gender !== Genders.MIXED
                  ? filters.gender
                  : null
              }
              onChange={(v) =>
                onFiltersChange({
                  ...filters,
                  gender: v as Genders.MALE | Genders.FEMALE,
                })
              }
            />
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
                  function: selectedKey ? (selectedKey as any) : undefined,
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
