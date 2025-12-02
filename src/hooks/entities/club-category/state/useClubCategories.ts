'use client';

import {useCallback, useEffect, useState} from 'react';

import {createClient} from '@/utils/supabase/client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {ClubCategoryInsert, ClubCategorySchema} from '@/types';

export interface UseClubCategoriesFilters {
  searchTerm?: string;
  selectedSeason?: string;
}

export interface CreateClubCategoryData {
  club_id: string;
  category_id: string;
  season_id: string;
  max_teams: number;
}

export interface UpdateClubCategoryData extends CreateClubCategoryData {
  id: string;
}

const t = translations.admin.clubCategories.responseMessages;
/**
 * Hook for managing club categories (CRUD operations)
 * Generated using createCRUDHook factory
 */
const _useClubCategories = createCRUDHook<ClubCategorySchema, ClubCategoryInsert>({
  baseEndpoint: API_ROUTES.entities.root('club_categories'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('club_categories', id),
  entityName: 'club_category',
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  },
});

/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useClubCategories() {
  const {loading, setLoading, error, create, update, deleteItem} = _useClubCategories();

  return {
    loading,
    error,
    createClubCategory: create,
    updateClubCategory: update,
    deleteClubCategory: deleteItem,
    setLoading,
  };
}
