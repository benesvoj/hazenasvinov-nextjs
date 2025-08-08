'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { 
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { Tabs, Tab } from "@heroui/tabs";
import { createClient } from "@/utils/supabase/client";

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
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Kód</th>
                    <th className="text-left py-3 px-4">Název</th>
                    <th className="text-left py-3 px-4">Popis</th>
                    <th className="text-left py-3 px-4">Věková skupina</th>
                    <th className="text-left py-3 px-4">Pohlaví</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Pořadí</th>
                    <th className="text-center py-3 px-4">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-mono text-sm">{category.code}</td>
                      <td className="py-3 px-4 font-medium">{category.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {category.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {category.age_group ? (
                          <Badge color={getAgeGroupBadgeColor(category.age_group)} variant="flat" size="sm">
                            {ageGroups[category.age_group as keyof typeof ageGroups]}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {category.gender ? (
                          <Badge color={getGenderBadgeColor(category.gender)} variant="flat" size="sm">
                            {genders[category.gender as keyof typeof genders]}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={category.is_active ? 'success' : 'default'} variant="flat" size="sm">
                          {category.is_active ? 'Aktivní' : 'Neaktivní'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{category.sort_order}</td>
                      <td className="py-3 px-4">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Žádné kategorie nebyly nalezeny
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Category Modal */}
      <Modal isOpen={isAddCategoryOpen} onClose={onAddCategoryClose} size="3xl">
        <ModalContent>
          <ModalHeader>Přidat kategorii</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Základní údaje</h4>
                <Input
                  label="Kód"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  isRequired
                  placeholder="např. men, women, juniorBoys"
                />
                <Input
                  label="Název"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  isRequired
                  placeholder="např. Muži, Ženy, Dorostenci"
                />
                <Input
                  label="Popis"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Volitelný popis kategorie"
                />
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={formData.age_group}
                  onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                >
                  <option value="">Vyberte věkovou skupinu</option>
                  {Object.entries(ageGroups).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Vyberte pohlaví</option>
                  {Object.entries(genders).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
                <Input
                  label="Pořadí"
                  type="number"
                  value={formData.sort_order.toString()}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Aktivní</span>
                </label>
              </div>

              {/* Right Column - Competition Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Nastavení soutěže</h4>
                
                              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Funkce pro správu sezón bude implementována v další verzi.
                </p>
              </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddCategoryClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleAddCategory}>
              Přidat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Category Modal */}
      <Modal isOpen={isEditCategoryOpen} onClose={onEditCategoryClose} size="3xl">
        <ModalContent>
          <ModalHeader>Upravit kategorii</ModalHeader>
          <ModalBody>
            <Tabs aria-label="Category edit tabs" className="w-full">
              <Tab key="basic" title="Základní údaje">
                <div className="space-y-4 pt-4">
                  <Input
                    label="Kód"
                    value={formData.code}
                    isDisabled
                    placeholder="Kód nelze upravit"
                    description="Kód kategorie nelze změnit po vytvoření"
                  />
                  <Input
                    label="Název"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isRequired
                    placeholder="např. Muži, Ženy, Dorostenci"
                  />
                  <Input
                    label="Popis"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Volitelný popis kategorie"
                  />
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                    value={formData.age_group}
                    onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                  >
                    <option value="">Vyberte věkovou skupinu</option>
                    {Object.entries(ageGroups).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Vyberte pohlaví</option>
                    {Object.entries(genders).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                  <Input
                    label="Pořadí"
                    type="number"
                    value={formData.sort_order.toString()}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Aktivní</span>
                  </label>
                </div>
              </Tab>
              
              <Tab key="seasons" title="Sezóny">
                <div className="space-y-4 pt-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Zde můžete spravovat sezóny pro tuto kategorii. 
                      Každá kategorie může být použita v několika sezónách s různými nastaveními.
                    </p>
                  </div>
                  
                  {/* Add Season Button */}
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Přiřazené sezóny ({categorySeasons.length})
                    </h4>
                    <Button
                      color="primary"
                      size="sm"
                      onPress={onAddSeasonOpen}
                      startContent={<PlusIcon className="w-4 h-4" />}
                    >
                      Přidat sezónu
                    </Button>
                  </div>

                  {/* Seasons Table */}
                  {categorySeasons.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              Sezóna
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              Typ soutěže
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              Počet kol
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              Počet týmů
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              A/B týmy
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              Stav
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              Akce
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {categorySeasons.map((categorySeason) => (
                            <tr key={categorySeason.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                                {categorySeason.season?.name || 'N/A'}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                                <Badge color="primary" variant="flat" size="sm">
                                  {competitionTypes[categorySeason.competition_type]}
                                </Badge>
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                                {categorySeason.matchweek_count}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                                {categorySeason.team_count}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                                {categorySeason.allow_team_duplicates ? 'Ano' : 'Ne'}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                                <Badge 
                                  color={categorySeason.is_active ? "success" : "danger"} 
                                  variant="flat" 
                                  size="sm"
                                >
                                  {categorySeason.is_active ? 'Aktivní' : 'Neaktivní'}
                                </Badge>
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                                <div className="flex gap-2">
                                  <Button
                                    color="primary"
                                    size="sm"
                                    variant="light"
                                    isIconOnly
                                    onPress={() => handleEditSeason(categorySeason)}
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    color="danger"
                                    size="sm"
                                    variant="light"
                                    isIconOnly
                                    onPress={() => handleRemoveSeason(categorySeason.id)}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Žádné sezóny nejsou přiřazeny k této kategorii.</p>
                      <p className="text-sm mt-2">Klikněte na &quot;Přidat sezónu&quot; pro přiřazení první sezóny.</p>
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditCategoryClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateCategory}>
              Uložit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Category Modal */}
      <Modal isOpen={isDeleteCategoryOpen} onClose={onDeleteCategoryClose}>
        <ModalContent>
          <ModalHeader>Smazat kategorii</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat kategorii <strong>{selectedCategory?.name}</strong>?
              Tato akce je nevratná a může ovlivnit data v celém systému.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteCategoryClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={handleDeleteCategory}>
              Smazat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Season Modal */}
      <Modal isOpen={isAddSeasonOpen} onClose={onAddSeasonClose} size="2xl">
        <ModalContent>
          <ModalHeader>Přidat sezónu ke kategorii</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Season Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sezóna *
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={seasonFormData.season_id}
                  onChange={(e) => setSeasonFormData({ ...seasonFormData, season_id: e.target.value })}
                >
                  <option value="">Vyberte sezónu</option>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Competition Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Typ soutěže
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={seasonFormData.competition_type}
                  onChange={(e) => setSeasonFormData({ ...seasonFormData, competition_type: e.target.value as 'league' | 'league_playoff' | 'tournament' })}
                >
                  {Object.entries(competitionTypes).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              {/* Matchweek Count */}
              <Input
                label="Počet kol"
                type="number"
                value={seasonFormData.matchweek_count.toString()}
                onChange={(e) => setSeasonFormData({ ...seasonFormData, matchweek_count: parseInt(e.target.value) || 0 })}
                placeholder="Např. 10 pro 10 kol"
                min="0"
              />

              {/* Team Count */}
              <Input
                label="Počet týmů"
                type="number"
                value={seasonFormData.team_count.toString()}
                onChange={(e) => setSeasonFormData({ ...seasonFormData, team_count: parseInt(e.target.value) || 0 })}
                placeholder="Očekávaný počet týmů"
                min="0"
              />

              {/* Allow Team Duplicates */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add_allow_team_duplicates"
                  checked={seasonFormData.allow_team_duplicates}
                  onChange={(e) => setSeasonFormData({ ...seasonFormData, allow_team_duplicates: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="add_allow_team_duplicates" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Povolit A/B týmy stejného klubu
                </label>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add_season_active"
                  checked={seasonFormData.is_active}
                  onChange={(e) => setSeasonFormData({ ...seasonFormData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="add_season_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Aktivní
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onAddSeasonClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleAddSeason}>
              Přidat sezónu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Season Modal */}
      <Modal isOpen={isEditSeasonOpen} onClose={onEditSeasonClose} size="2xl">
        <ModalContent>
          <ModalHeader>Upravit konfiguraci sezóny</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Season Name (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sezóna
                </label>
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                  {selectedSeason?.season?.name || 'N/A'}
                </div>
              </div>

              {/* Competition Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Typ soutěže
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={editSeasonFormData.competition_type}
                  onChange={(e) => setEditSeasonFormData({ ...editSeasonFormData, competition_type: e.target.value as 'league' | 'league_playoff' | 'tournament' })}
                >
                  {Object.entries(competitionTypes).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              {/* Matchweek Count */}
              <Input
                label="Počet kol"
                type="number"
                value={editSeasonFormData.matchweek_count.toString()}
                onChange={(e) => setEditSeasonFormData({ ...editSeasonFormData, matchweek_count: parseInt(e.target.value) || 0 })}
                placeholder="Např. 10 pro 10 kol"
                min="0"
              />

              {/* Team Count */}
              <Input
                label="Počet týmů"
                type="number"
                value={editSeasonFormData.team_count.toString()}
                onChange={(e) => setEditSeasonFormData({ ...editSeasonFormData, team_count: parseInt(e.target.value) || 0 })}
                placeholder="Očekávaný počet týmů"
                min="0"
              />

              {/* Allow Team Duplicates */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_allow_team_duplicates"
                  checked={editSeasonFormData.allow_team_duplicates}
                  onChange={(e) => setEditSeasonFormData({ ...editSeasonFormData, allow_team_duplicates: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="edit_allow_team_duplicates" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Povolit A/B týmy stejného klubu
                </label>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_season_active"
                  checked={editSeasonFormData.is_active}
                  onChange={(e) => setEditSeasonFormData({ ...editSeasonFormData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="edit_season_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Aktivní
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onEditSeasonClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateSeason}>
              Uložit změny
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
