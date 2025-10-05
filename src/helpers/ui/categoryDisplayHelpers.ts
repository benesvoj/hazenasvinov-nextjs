import {AgeGroups, Genders} from '@/enums';
import {ageGroupsOptions, genderOptions} from '@/utils';

/**
 * UI helper functions for category display and formatting
 * These functions handle the presentation layer concerns for categories
 */

/**
 * Get display label for age group
 */
export const getAgeGroupLabel = (ageGroup?: AgeGroups): string => {
  if (!ageGroup) return '-';
  return ageGroupsOptions[ageGroup] || ageGroup;
};

/**
 * Get display label for gender
 */
export const getGenderLabel = (gender?: Genders): string => {
  if (!gender) return '-';
  return genderOptions[gender] || gender;
};

/**
 * Get status label for active/inactive state
 */
export const getStatusLabel = (isActive?: boolean): string => {
  return isActive ? 'Aktivní' : 'Neaktivní';
};

/**
 * Get status styling classes for active/inactive state
 */
export const getStatusClasses = (isActive?: boolean): string => {
  return isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
};

/**
 * Format category name with proper capitalization
 */
export const formatCategoryName = (name: string): string => {
  return name.trim();
};

/**
 * Format category description with fallback
 */
export const formatCategoryDescription = (description?: string): string => {
  return description?.trim() || '-';
};

/**
 * Format sort order with proper display
 */
export const formatSortOrder = (sortOrder?: number): string => {
  return sortOrder?.toString() || '0';
};
