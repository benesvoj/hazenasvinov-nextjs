import {useState, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {CompetitionTypes} from '@/enums';
import {Category, CategorySeason} from '@/types';

export interface UseCategoriesResult {
  // Data
  categories: Category[];
  seasons: {id: string; name: string}[];
  categorySeasons: CategorySeason[];
  selectedCategory: Category | null;
  selectedSeason: CategorySeason | null;

  // Loading states
  loading: boolean;
  error: string;

  // Form data
  formData: Category;
  seasonFormData: any;
  editSeasonFormData: any;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchSeasons: () => Promise<void>;
  fetchCategorySeasons: (categoryId: string) => Promise<void>;
  handleAddCategory: () => Promise<void>;
  handleUpdateCategory: () => Promise<void>;
  handleDeleteCategory: () => Promise<void>;
  handleAddSeason: () => Promise<void>;
  handleUpdateSeason: () => Promise<void>;
  handleRemoveSeason: (seasonId: string) => Promise<void>;
  handleEditSeason: (categorySeason: CategorySeason) => void;
  openEditModal: (category: Category) => void;
  openDeleteModal: (category: Category) => void;

  // Setters
  setFormData: (data: Category) => void;
  setSeasonFormData: (data: any) => void;
  setEditSeasonFormData: (data: any) => void;
  setSelectedCategory: (category: Category | null) => void;
  setSelectedSeason: (season: CategorySeason | null) => void;
  setError: (error: string) => void;
  resetFormData: () => void;
  resetSeasonFormData: () => void;
  resetEditSeasonFormData: () => void;
}

const initialFormData: Category = {
  id: '',
  name: '',
  description: '',
  age_group: undefined,
  gender: undefined,
  is_active: true,
  sort_order: 0,
};

const initialSeasonFormData = {
  season_id: '',
  matchweek_count: 0,
  competition_type: CompetitionTypes.LEAGUE as CompetitionTypes,
  team_count: 0,
  allow_team_duplicates: false,
  is_active: true,
};

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<{id: string; name: string}[]>([]);
  const [categorySeasons, setCategorySeasons] = useState<CategorySeason[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<CategorySeason | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Category>(initialFormData);
  const [seasonFormData, setSeasonFormData] = useState(initialSeasonFormData);
  const [editSeasonFormData, setEditSeasonFormData] = useState(initialSeasonFormData);

  const supabase = createClient();

  // Fetch seasons
  const fetchSeasons = useCallback(async () => {
    try {
      const {data, error} = await supabase
        .from('seasons')
        .select('id, name')
        .order('name', {ascending: true});

      if (error) throw error;
      setSeasons(data || []);
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  }, [supabase]);

  // Fetch category
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const {data, error} = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', {ascending: true})
        .order('name', {ascending: true});

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      setError('Chyba při načítání kategorií');
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch category seasons
  const fetchCategorySeasons = useCallback(
    async (categoryId: string) => {
      try {
        const {data, error} = await supabase
          .from('category_seasons')
          .select(
            `
          *,
          season:seasons(id, name)
        `
          )
          .eq('category_id', categoryId)
          .order('created_at', {ascending: false});

        if (error) throw error;
        setCategorySeasons(data || []);
      } catch (error) {
        console.error('Error fetching category seasons:', error);
      }
    },
    [supabase]
  );

  // Add season to category
  const handleAddSeason = useCallback(async () => {
    if (!selectedCategory) return;

    try {
      const {error} = await supabase.from('category_seasons').insert({
        category_id: selectedCategory.id,
        season_id: seasonFormData.season_id,
        matchweek_count: seasonFormData.matchweek_count,
        competition_type: seasonFormData.competition_type,
        team_count: seasonFormData.team_count,
        allow_team_duplicates: seasonFormData.allow_team_duplicates,
        is_active: seasonFormData.is_active,
      });

      if (error) throw error;

      resetSeasonFormData();
      fetchCategorySeasons(selectedCategory.id);
    } catch (error) {
      setError('Chyba při přidávání sezóny');
      console.error('Error adding season:', error);
    }
  }, [selectedCategory, seasonFormData, supabase, fetchCategorySeasons]);

  // Remove season from category
  const handleRemoveSeason = useCallback(
    async (seasonId: string) => {
      if (!selectedCategory) return;

      try {
        const {error} = await supabase.from('category_seasons').delete().eq('id', seasonId);

        if (error) throw error;

        fetchCategorySeasons(selectedCategory.id);
      } catch (error) {
        setError('Chyba při odstraňování sezóny');
        console.error('Error removing season:', error);
      }
    },
    [selectedCategory, supabase, fetchCategorySeasons]
  );

  // Edit season configuration
  const handleEditSeason = useCallback((categorySeason: CategorySeason) => {
    setSelectedSeason(categorySeason);
    setEditSeasonFormData({
      matchweek_count: categorySeason.matchweek_count,
      competition_type: categorySeason.competition_type,
      team_count: categorySeason.team_count,
      allow_team_duplicates: categorySeason.allow_team_duplicates,
      is_active: categorySeason.is_active,
      season_id: categorySeason.season_id,
    });
  }, []);

  // Update season configuration
  const handleUpdateSeason = useCallback(async () => {
    if (!selectedSeason || !selectedCategory) return;

    try {
      const {error} = await supabase
        .from('category_seasons')
        .update({
          matchweek_count: editSeasonFormData.matchweek_count,
          competition_type: editSeasonFormData.competition_type,
          team_count: editSeasonFormData.team_count,
          allow_team_duplicates: editSeasonFormData.allow_team_duplicates,
          is_active: editSeasonFormData.is_active,
        })
        .eq('id', selectedSeason.id);

      if (error) throw error;

      setSelectedSeason(null);
      fetchCategorySeasons(selectedCategory.id);
    } catch (error) {
      setError('Chyba při aktualizaci sezóny');
      console.error('Error updating season:', error);
    }
  }, [selectedSeason, selectedCategory, editSeasonFormData, supabase, fetchCategorySeasons]);

  // Add new category
  const handleAddCategory = useCallback(async () => {
    try {
      const {data: newCategory, error} = await supabase
        .from('categories')
        .insert({
          name: formData.name,
          description: formData.description,
          age_group: formData.age_group || null,
          gender: formData.gender || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        })
        .select()
        .single();

      if (error) throw error;

      resetFormData();
      fetchCategories();
    } catch (error) {
      setError('Chyba při přidávání kategorie');
      console.error('Error adding category:', error);
    }
  }, [formData, supabase, fetchCategories]);

  // Update category
  const handleUpdateCategory = useCallback(async () => {
    if (!selectedCategory) return;

    try {
      const {error} = await supabase
        .from('categories')
        .update({
          name: formData.name,
          description: formData.description,
          age_group: formData.age_group || null,
          gender: formData.gender || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        })
        .eq('id', selectedCategory.id);

      if (error) throw error;

      setSelectedCategory(null);
      resetFormData();
      fetchCategories();
    } catch (error) {
      setError('Chyba při aktualizaci kategorie');
      console.error('Error updating category:', error);
    }
  }, [selectedCategory, formData, supabase, fetchCategories]);

  // Delete category
  const handleDeleteCategory = useCallback(async () => {
    if (!selectedCategory) return;

    try {
      const {error} = await supabase.from('categories').delete().eq('id', selectedCategory.id);

      if (error) throw error;

      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      setError('Chyba při mazání kategorie');
      console.error('Error deleting category:', error);
    }
  }, [selectedCategory, supabase, fetchCategories]);

  // Open edit modal
  const openEditModal = useCallback(
    (category: Category) => {
      setSelectedCategory(category);
      setFormData({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        age_group: category.age_group || undefined,
        gender: category.gender || undefined,
        is_active: category.is_active || false,
        sort_order: category.sort_order || 0,
      });

      // Fetch category seasons
      fetchCategorySeasons(category.id);
    },
    [fetchCategorySeasons]
  );

  // Open delete modal
  const openDeleteModal = useCallback((category: Category) => {
    setSelectedCategory(category);
  }, []);

  // Reset functions
  const resetFormData = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  const resetSeasonFormData = useCallback(() => {
    setSeasonFormData(initialSeasonFormData);
  }, []);

  const resetEditSeasonFormData = useCallback(() => {
    setEditSeasonFormData(initialSeasonFormData);
  }, []);

  return {
    // Data
    categories,
    seasons,
    categorySeasons,
    selectedCategory,
    selectedSeason,

    // Loading states
    loading,
    error,

    // Form data
    formData,
    seasonFormData,
    editSeasonFormData,

    // Actions
    fetchCategories,
    fetchSeasons,
    fetchCategorySeasons,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddSeason,
    handleUpdateSeason,
    handleRemoveSeason,
    handleEditSeason,
    openEditModal,
    openDeleteModal,

    // Setters
    setFormData,
    setSeasonFormData,
    setEditSeasonFormData,
    setSelectedCategory,
    setSelectedSeason,
    setError,
    resetFormData,
    resetSeasonFormData,
    resetEditSeasonFormData,
  };
}
