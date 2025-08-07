'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Team {
  id: string;
  name: string;
  short_name?: string;
  city?: string;
  is_active: boolean;
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
}

interface TeamCategory {
  id: string;
  team_id: string;
  season_id: string;
  category_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  team?: Team;
  season?: Season;
  category?: Category;
}

export default function TeamCategoriesAdminPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isAddCategoryOpen, onOpen: onAddCategoryOpen, onClose: onAddCategoryClose } = useDisclosure();
  const { isOpen: isEditCategoryOpen, onOpen: onEditCategoryOpen, onClose: onEditCategoryClose } = useDisclosure();
  const { isOpen: isDeleteCategoryOpen, onOpen: onDeleteCategoryOpen, onClose: onDeleteCategoryClose } = useDisclosure();
  
  const [selectedCategory, setSelectedCategory] = useState<TeamCategory | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [formData, setFormData] = useState({
    team_id: '',
    season_id: '',
    category_id: '',
    is_active: true
  });

  const supabase = createClient();

  // Fetch seasons
  const fetchSeasons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('name', { ascending: false });

      if (error) throw error;
      setSeasons(data || []);
      if (data && data.length > 0) {
        setSelectedSeason(data[0].id);
        setFormData(prev => ({ ...prev, season_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  }, [supabase]);

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, [supabase]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [supabase]);

  // Fetch team categories
  const fetchTeamCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_categories')
        .select(`
          *,
          team:teams(*),
          season:seasons(*),
          category:categories(*)
        `)
        .eq('season_id', selectedSeason)
        .order('team_id', { ascending: true });

      if (error) throw error;
      setTeamCategories(data || []);
    } catch (error) {
      setError('Chyba při načítání kategorií týmů');
      console.error('Error fetching team categories:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSeason, supabase]);

  useEffect(() => {
    fetchSeasons();
    fetchTeams();
    fetchCategories();
  }, [fetchSeasons, fetchTeams, fetchCategories]);

  useEffect(() => {
    if (selectedSeason) {
      fetchTeamCategories();
    }
  }, [selectedSeason, fetchTeamCategories]);

  // Add new team category
  const handleAddCategory = async () => {
    try {
      const { error } = await supabase
        .from('team_categories')
        .insert({
          team_id: formData.team_id,
          season_id: formData.season_id,
          category_id: formData.category_id,
          is_active: formData.is_active
        });

      if (error) throw error;
      
      onAddCategoryClose();
      setFormData({
        team_id: '',
        season_id: selectedSeason,
        category_id: categories.length > 0 ? categories[0].id : '',
        is_active: true
      });
      fetchTeamCategories();
    } catch (error) {
      setError('Chyba při přidávání kategorie týmu');
      console.error('Error adding team category:', error);
    }
  };

  // Update team category
  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('team_categories')
        .update({
          team_id: formData.team_id,
          season_id: formData.season_id,
          category_id: formData.category_id,
          is_active: formData.is_active
        })
        .eq('id', selectedCategory.id);

      if (error) throw error;
      
      onEditCategoryClose();
      setSelectedCategory(null);
      setFormData({
        team_id: '',
        season_id: selectedSeason,
        category_id: categories.length > 0 ? categories[0].id : '',
        is_active: true
      });
      fetchTeamCategories();
    } catch (error) {
      setError('Chyba při aktualizaci kategorie týmu');
      console.error('Error updating team category:', error);
    }
  };

  // Delete team category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('team_categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;
      
      onDeleteCategoryClose();
      setSelectedCategory(null);
      fetchTeamCategories();
    } catch (error) {
      setError('Chyba při mazání kategorie týmu');
      console.error('Error deleting team category:', error);
    }
  };

  // Open edit modal
  const openEditModal = (category: TeamCategory) => {
    setSelectedCategory(category);
    setFormData({
      team_id: category.team_id,
      season_id: category.season_id,
      category_id: category.category_id,
      is_active: category.is_active
    });
    onEditCategoryOpen();
  };

  // Open delete modal
  const openDeleteModal = (category: TeamCategory) => {
    setSelectedCategory(category);
    onDeleteCategoryOpen();
  };

  // Get category badge color
  const getCategoryBadgeColor = (categoryCode: string) => {
    switch (categoryCode) {
      case 'men': return 'primary';
      case 'women': return 'secondary';
      case 'juniorBoys': return 'success';
      case 'juniorGirls': return 'warning';
      case 'prepKids': return 'danger';
      case 'youngestKids': return 'default';
      case 'youngerBoys': return 'primary';
      case 'youngerGirls': return 'secondary';
      case 'olderBoys': return 'success';
      case 'olderGirls': return 'warning';
      default: return 'default';
    }
  };

  // Get active season
  const activeSeason = seasons.find(s => s.is_active);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Správa kategorií týmů
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Spravujte kategorie týmů pro vybranou sezónu
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Season Selector */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Výběr sezóny</h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-4">
            <select
              className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
              value={selectedSeason}
              onChange={(e) => {
                setSelectedSeason(e.target.value);
                setFormData(prev => ({ ...prev, season_id: e.target.value }));
              }}
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} {season.is_active && '(Aktivní)'}
                </option>
              ))}
            </select>
            {activeSeason && (
              <Badge color="success" variant="flat">
                Aktivní sezóna: {activeSeason.name}
              </Badge>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Kategorie týmů</h2>
          </div>
          <Button 
            color="primary" 
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={onAddCategoryOpen}
            isDisabled={!selectedSeason}
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
                    <th className="text-left py-3 px-4">Tým</th>
                    <th className="text-left py-3 px-4">Kategorie</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {teamCategories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-medium">
                        {category.team?.name || 'Neznámý tým'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={getCategoryBadgeColor(category.category?.code || '')} variant="flat">
                          {category.category?.name || 'Neznámá kategorie'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={category.is_active ? 'success' : 'default'} variant="flat">
                          {category.is_active ? 'Aktivní' : 'Neaktivní'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            onPress={() => openEditModal(category)}
                          >
                            Upravit
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            onPress={() => openDeleteModal(category)}
                          >
                            Smazat
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {teamCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Žádné kategorie týmů nebyly nalezeny
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Category Modal */}
      <Modal isOpen={isAddCategoryOpen} onClose={onAddCategoryClose}>
        <ModalContent>
          <ModalHeader>Přidat kategorii týmu</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              >
                <option value="">Vyberte tým</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Vyberte kategorii</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              
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
      <Modal isOpen={isEditCategoryOpen} onClose={onEditCategoryClose}>
        <ModalContent>
          <ModalHeader>Upravit kategorii týmu</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              >
                <option value="">Vyberte tým</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Vyberte kategorii</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              
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
          <ModalHeader>Smazat kategorii týmu</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat kategorii <strong>
                {selectedCategory?.team?.name} - {selectedCategory?.category?.name}
              </strong>?
              Tato akce je nevratná.
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
    </div>
  );
}
