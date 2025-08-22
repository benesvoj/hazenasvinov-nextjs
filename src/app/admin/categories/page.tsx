'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { 
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { Tabs, Tab } from "@heroui/tabs";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";
import AddCategoryModal from './components/AddCategoryModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import AddSeasonModal from './components/AddSeasonModal';
import EditCategoryModal from './components/EditCategoryModal';
import EditSeasonModal from './components/EditSeasonModal';

interface CategorySeason {
  id: string;
  category_id: string;
  season_id: string;
  matchweek_count: number;
  competition_type: 'league' | 'league_playoff' | 'tournament';
  team_count: number;
  allow_team_duplicates: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  season?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  age_group?: string;
  gender?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category_seasons?: CategorySeason[];
}

const ageGroups = {
  adults: "Dospělí",
  juniors: "Junioři",
  youth: "Mládež",
  kids: "Děti"
};

const genders = {
  male: "Muži",
  female: "Ženy",
  mixed: "Smíšené"
};

const competitionTypes = {
  league: "Liga",
  league_playoff: "Liga s playoff",
  tournament: "Turnaj"
};

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isAddCategoryOpen, onOpen: onAddCategoryOpen, onClose: onAddCategoryClose } = useDisclosure();
  const { isOpen: isEditCategoryOpen, onOpen: onEditCategoryOpen, onClose: onEditCategoryClose } = useDisclosure();
  const { isOpen: isDeleteCategoryOpen, onOpen: onDeleteCategoryOpen, onClose: onDeleteCategoryClose } = useDisclosure();
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Category seasons management
  const { isOpen: isAddSeasonOpen, onOpen: onAddSeasonOpen, onClose: onAddSeasonClose } = useDisclosure();
  const { isOpen: isEditSeasonOpen, onOpen: onEditSeasonOpen, onClose: onEditSeasonClose } = useDisclosure();
  const [categorySeasons, setCategorySeasons] = useState<CategorySeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<CategorySeason | null>(null);
  const [seasonFormData, setSeasonFormData] = useState({
    season_id: '',
    matchweek_count: 0,
    competition_type: 'league' as 'league' | 'league_playoff' | 'tournament',
    team_count: 0,
    allow_team_duplicates: false,
    is_active: true
  });
  const [editSeasonFormData, setEditSeasonFormData] = useState({
    matchweek_count: 0,
    competition_type: 'league' as 'league' | 'league_playoff' | 'tournament',
    team_count: 0,
    allow_team_duplicates: false,
    is_active: true
  });
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    age_group: '',
    gender: '',
    is_active: true,
    sort_order: 0
  });

  const supabase = createClient();

  // Fetch seasons
  const fetchSeasons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setSeasons(data || []);
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  }, [supabase]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      setError('Chyba při načítání kategorií');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSeasons();
    fetchCategories();
  }, [fetchSeasons, fetchCategories]);

  // Fetch category seasons
  const fetchCategorySeasons = useCallback(async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_seasons')
        .select(`
          *,
          season:seasons(id, name)
        `)
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategorySeasons(data || []);
    } catch (error) {
      console.error('Error fetching category seasons:', error);
    }
  }, [supabase]);

  // Add season to category
  const handleAddSeason = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('category_seasons')
        .insert({
          category_id: selectedCategory.id,
          season_id: seasonFormData.season_id,
          matchweek_count: seasonFormData.matchweek_count,
          competition_type: seasonFormData.competition_type,
          team_count: seasonFormData.team_count,
          allow_team_duplicates: seasonFormData.allow_team_duplicates,
          is_active: seasonFormData.is_active
        });

      if (error) throw error;

      onAddSeasonClose();
      setSeasonFormData({
        season_id: '',
        matchweek_count: 0,
        competition_type: 'league',
        team_count: 0,
        allow_team_duplicates: false,
        is_active: true
      });
      
      fetchCategorySeasons(selectedCategory.id);
    } catch (error) {
      setError('Chyba při přidávání sezóny');
      console.error('Error adding season:', error);
    }
  };

  // Remove season from category
  const handleRemoveSeason = async (seasonId: string) => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('category_seasons')
        .delete()
        .eq('id', seasonId);

      if (error) throw error;
      
      fetchCategorySeasons(selectedCategory.id);
    } catch (error) {
      setError('Chyba při odstraňování sezóny');
      console.error('Error removing season:', error);
    }
  };

  // Edit season configuration
  const handleEditSeason = (categorySeason: CategorySeason) => {
    setSelectedSeason(categorySeason);
    setEditSeasonFormData({
      matchweek_count: categorySeason.matchweek_count,
      competition_type: categorySeason.competition_type,
      team_count: categorySeason.team_count,
      allow_team_duplicates: categorySeason.allow_team_duplicates,
      is_active: categorySeason.is_active
    });
    onEditSeasonOpen();
  };

  // Update season configuration
  const handleUpdateSeason = async () => {
    if (!selectedSeason || !selectedCategory) return;

    try {
      const { error } = await supabase
        .from('category_seasons')
        .update({
          matchweek_count: editSeasonFormData.matchweek_count,
          competition_type: editSeasonFormData.competition_type,
          team_count: editSeasonFormData.team_count,
          allow_team_duplicates: editSeasonFormData.allow_team_duplicates,
          is_active: editSeasonFormData.is_active
        })
        .eq('id', selectedSeason.id);

      if (error) throw error;

      onEditSeasonClose();
      setSelectedSeason(null);
      fetchCategorySeasons(selectedCategory.id);
    } catch (error) {
      setError('Chyba při aktualizaci sezóny');
      console.error('Error updating season:', error);
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    try {
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
          code: formData.code,
          name: formData.name,
          description: formData.description,
          age_group: formData.age_group || null,
          gender: formData.gender || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        })
        .select()
        .single();

      if (error) throw error;



      if (error) throw error;
      
      onAddCategoryClose();
      setFormData({
        code: '',
        name: '',
        description: '',
        age_group: '',
        gender: '',
        is_active: true,
        sort_order: 0
      });

      fetchCategories();
    } catch (error) {
      setError('Chyba při přidávání kategorie');
      console.error('Error adding category:', error);
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          code: formData.code,
          name: formData.name,
          description: formData.description,
          age_group: formData.age_group || null,
          gender: formData.gender || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        })
        .eq('id', selectedCategory.id);

      if (error) throw error;
      
      onEditCategoryClose();
      setSelectedCategory(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        age_group: '',
        gender: '',
        is_active: true,
        sort_order: 0
      });
      fetchCategories();
    } catch (error) {
      setError('Chyba při aktualizaci kategorie');
      console.error('Error updating category:', error);
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;
      
      onDeleteCategoryClose();
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      setError('Chyba při mazání kategorie');
      console.error('Error deleting category:', error);
    }
  };

  // Open edit modal
  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || '',
      age_group: category.age_group || '',
      gender: category.gender || '',
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    
    // Fetch category seasons
    fetchCategorySeasons(category.id);
    
    onEditCategoryOpen();
  };

  // Open delete modal
  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    onDeleteCategoryOpen();
  };

  // Get age group badge color
  const getAgeGroupBadgeColor = (ageGroup: string) => {
    switch (ageGroup) {
      case 'adults': return 'primary';
      case 'juniors': return 'secondary';
      case 'youth': return 'success';
      case 'kids': return 'warning';
      default: return 'default';
    }
  };

  // Get gender badge color
  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case 'male': return 'primary';
      case 'female': return 'secondary';
      case 'mixed': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="p-6">

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Seznam kategorií</h2>
          </div>
          <Button 
            color="primary" 
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={onAddCategoryOpen}
          >
            Přidat kategorii
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">{translations.loading}</div>
          ) : (
            <Table aria-label="Categories table">
              <TableHeader>
                <TableColumn>KÓD</TableColumn>
                <TableColumn>NÁZEV</TableColumn>
                <TableColumn>POPIS</TableColumn>
                <TableColumn>VĚKOVÁ SKUPINA</TableColumn>
                <TableColumn>POHLAVÍ</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>POŘADÍ</TableColumn>
                <TableColumn>AKCE</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Žádné kategorie nebyly nalezeny">
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono text-sm">{category.code}</TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      {category.age_group ? (
                        <Badge color={getAgeGroupBadgeColor(category.age_group)} variant="flat" size="sm">
                          {ageGroups[category.age_group as keyof typeof ageGroups]}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.gender ? (
                        <Badge color={getGenderBadgeColor(category.gender)} variant="flat" size="sm">
                          {genders[category.gender as keyof typeof genders]}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge color={category.is_active ? 'success' : 'default'} variant="flat" size="sm">
                        {category.is_active ? 'Aktivní' : 'Neaktivní'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{category.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          isIconOnly
                          onPress={() => openEditModal(category)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onPress={() => openDeleteModal(category)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                              </TableBody>
              </Table>
          )}
        </CardBody>
      </Card>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={onAddCategoryClose}
        onAddCategory={handleAddCategory}
        formData={formData}
        setFormData={setFormData}
        ageGroups={ageGroups}
        genders={genders}
      />

            {/* Edit Category Modal */}
      <EditCategoryModal
        isOpen={isEditCategoryOpen}
        onClose={onEditCategoryClose}
        onUpdateCategory={handleUpdateCategory}
        onAddSeason={onAddSeasonOpen}
        onEditSeason={handleEditSeason}
        onRemoveSeason={handleRemoveSeason}
        formData={formData}
        setFormData={setFormData}
        categorySeasons={categorySeasons}
        ageGroups={ageGroups}
        genders={genders}
        competitionTypes={competitionTypes}
      />

      {/* Delete Category Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteCategoryOpen}
        onClose={onDeleteCategoryClose}
        onConfirm={handleDeleteCategory}
        title="Smazat kategorii"
        message={`
          Opravdu chcete smazat kategorii <strong>${selectedCategory?.name}</strong>?<br><br>
          <span class="text-sm text-gray-600">Tato akce je nevratná a může ovlivnit data v celém systému.</span>
        `}
      />

      {/* Add Season Modal */}
      <AddSeasonModal
        isOpen={isAddSeasonOpen}
        onClose={onAddSeasonClose}
        onAddSeason={handleAddSeason}
        seasonFormData={seasonFormData}
        setSeasonFormData={setSeasonFormData}
        seasons={seasons}
        competitionTypes={competitionTypes}
      />

      {/* Edit Season Modal */}
      <EditSeasonModal
        isOpen={isEditSeasonOpen}
        onClose={onEditSeasonClose}
        onUpdateSeason={handleUpdateSeason}
        selectedSeason={selectedSeason}
        editSeasonFormData={editSeasonFormData}
        setEditSeasonFormData={setEditSeasonFormData}
        competitionTypes={competitionTypes}
      />
    </div>
  );
}
