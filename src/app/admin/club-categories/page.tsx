'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BuildingOfficeIcon,
  TrophyIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { Club, Category } from "@/types/types";
import { Season } from "@/types";

interface ClubCategory {
  id: string;
  club_id: string;
  category_id: string;
  season_id: string;
  max_teams: number;
  is_active: boolean;
  club: Club;
  category: Category;
  season: Season;
}

export default function ClubCategoriesAdminPage() {
  const [clubCategories, setClubCategories] = useState<ClubCategory[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  
  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // Form states
  const [createForm, setCreateForm] = useState({
    club_id: '',
    category_id: '',
    season_id: '',
    max_teams: 1
  });
  
  const [editForm, setEditForm] = useState({
    id: '',
    club_id: '',
    category_id: '',
    season_id: '',
    max_teams: 1
  });
  
  const [clubCategoryToDelete, setClubCategoryToDelete] = useState<ClubCategory | null>(null);
  
  const supabase = createClient();

  // Fetch club categories
  const fetchClubCategories = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('club_categories')
        .select(`
          *,
          club:clubs(*),
          category:categories(*),
          season:seasons(*)
        `)
        .order('season_id', { ascending: false })
        .order('category_id')
        .order('club_id');

      if (selectedSeason) {
        query = query.eq('season_id', selectedSeason);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClubCategories(data || []);
    } catch (error) {
      setError('Chyba při načítání přiřazení klubů');
      console.error('Error fetching club categories:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedSeason]);

  // Fetch clubs, categories, and seasons
  const fetchData = useCallback(async () => {
    try {
      const [clubsResult, categoriesResult, seasonsResult] = await Promise.all([
        supabase.from('clubs').select('*').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').eq('is_active', true).order('name'),
        supabase.from('seasons').select('*').order('name', { ascending: false })
      ]);

      if (clubsResult.error) throw clubsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (seasonsResult.error) throw seasonsResult.error;

      setClubs(clubsResult.data || []);
      setCategories(categoriesResult.data || []);
      setSeasons(seasonsResult.data || []);
      
      // Set first season as default
      if (seasonsResult.data && seasonsResult.data.length > 0 && !selectedSeason) {
        setSelectedSeason(seasonsResult.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [supabase, selectedSeason]);

  // Create club category assignment
  const handleCreateClubCategory = async () => {
    try {
      if (!createForm.club_id || !createForm.category_id || !createForm.season_id) {
        setError('Prosím vyplňte všechna povinná pole');
        return;
      }

      // Check if assignment already exists
      const { data: existing, error: checkError } = await supabase
        .from('club_categories')
        .select('id')
        .eq('club_id', createForm.club_id)
        .eq('category_id', createForm.category_id)
        .eq('season_id', createForm.season_id);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        setError('Tento klub je již přiřazen k této kategorii v této sezóně');
        return;
      }

      const { error } = await supabase
        .from('club_categories')
        .insert({
          club_id: createForm.club_id,
          category_id: createForm.category_id,
          season_id: createForm.season_id,
          max_teams: createForm.max_teams
        });

      if (error) throw error;

      onCreateClose();
      setCreateForm({ club_id: '', category_id: '', season_id: '', max_teams: 1 });
      fetchClubCategories();
      setError('');
    } catch (error) {
      setError('Chyba při vytváření přiřazení');
      console.error('Error creating club category:', error);
    }
  };

  // Update club category assignment
  const handleUpdateClubCategory = async () => {
    try {
      if (!editForm.club_id || !editForm.category_id || !editForm.season_id) {
        setError('Prosím vyplňte všechna povinná pole');
        return;
      }

      const { error } = await supabase
        .from('club_categories')
        .update({
          club_id: editForm.club_id,
          category_id: editForm.category_id,
          season_id: editForm.season_id,
          max_teams: editForm.max_teams
        })
        .eq('id', editForm.id);

      if (error) throw error;

      onEditClose();
      setEditForm({ id: '', club_id: '', category_id: '', season_id: '', max_teams: 1 });
      fetchClubCategories();
      setError('');
    } catch (error) {
      setError('Chyba při aktualizaci přiřazení');
      console.error('Error updating club category:', error);
    }
  };

  // Delete club category assignment
  const handleDeleteClubCategory = async () => {
    if (!clubCategoryToDelete) return;

    try {
      const { error } = await supabase
        .from('club_categories')
        .delete()
        .eq('id', clubCategoryToDelete.id);

      if (error) throw error;

      onDeleteClose();
      setClubCategoryToDelete(null);
      fetchClubCategories();
      setError('');
    } catch (error) {
      setError('Chyba při mazání přiřazení');
      console.error('Error deleting club category:', error);
    }
  };

  // Open edit modal
  const openEditModal = (clubCategory: ClubCategory) => {
    setEditForm({
      id: clubCategory.id,
      club_id: clubCategory.club_id,
      category_id: clubCategory.category_id,
      season_id: clubCategory.season_id,
      max_teams: clubCategory.max_teams
    });
    onEditOpen();
  };

  // Open delete modal
  const openDeleteModal = (clubCategory: ClubCategory) => {
    setClubCategoryToDelete(clubCategory);
    onDeleteOpen();
  };

  // Filtered club categories
  const filteredClubCategories = clubCategories.filter(cc =>
    cc.club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cc.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cc.season.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch club categories when season changes
  useEffect(() => {
    if (selectedSeason) {
      fetchClubCategories();
    }
  }, [selectedSeason, fetchClubCategories]);

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Přiřazení klubů ke kategoriím</h2>
          </div>
          
          <Button 
            color="primary" 
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={onCreateOpen}
            size="sm"
          >
            Přiřadit klub
          </Button>
        </CardHeader>
        
        <CardBody>
          {/* Season selector */}
          <div className="mb-6">
            <div className="w-full max-w-md">
              <Select
                label="Sezóna"
                placeholder="Vyberte sezónu"
                selectedKeys={selectedSeason ? [selectedSeason] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setSelectedSeason(selectedKey || "");
                }}
                className="w-full"
              >
                {seasons.map((season) => (
                  <SelectItem key={season.id}>{season.name}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Hledat kluby, kategorie nebo sezóny..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="space-y-4">
              {filteredClubCategories.map((cc) => (
                <div key={cc.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold text-gray-800">{cc.club.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrophyIcon className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{cc.category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-700">{cc.season.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Max týmů: {cc.max_teams}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        variant="light"
                        startContent={<PencilIcon className="w-4 h-4" />}
                        onPress={() => openEditModal(cc)}
                      >
                        Upravit
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        startContent={<TrashIcon className="w-4 h-4" />}
                        onPress={() => openDeleteModal(cc)}
                      >
                        Smazat
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredClubCategories.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <BuildingOfficeIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    {searchTerm ? 'Žádná přiřazení nenalezena' : 'Žádná přiřazení'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Zkuste změnit vyhledávací termín' : 'Začněte přiřazením prvního klubu ke kategorii'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Club Category Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalContent>
          <ModalHeader>Přiřadit klub ke kategorii</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Klub *"
                placeholder="Vyberte klub"
                selectedKeys={createForm.club_id ? [createForm.club_id] : []}
                onSelectionChange={(keys) => {
                  const clubId = Array.from(keys)[0] as string;
                  setCreateForm({...createForm, club_id: clubId});
                }}
              >
                {clubs.map((club) => (
                  <SelectItem key={club.id}>{club.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Kategorie *"
                placeholder="Vyberte kategorii"
                selectedKeys={createForm.category_id ? [createForm.category_id] : []}
                onSelectionChange={(keys) => {
                  const categoryId = Array.from(keys)[0] as string;
                  setCreateForm({...createForm, category_id: categoryId});
                }}
              >
                {categories.map((category) => (
                  <SelectItem key={category.id}>{category.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Sezóna *"
                placeholder="Vyberte sezónu"
                selectedKeys={createForm.season_id ? [createForm.season_id] : []}
                onSelectionChange={(keys) => {
                  const seasonId = Array.from(keys)[0] as string;
                  setCreateForm({...createForm, season_id: seasonId});
                }}
              >
                {seasons.map((season) => (
                  <SelectItem key={season.id}>{season.name}</SelectItem>
                ))}
              </Select>
              <Input
                label="Maximální počet týmů"
                type="number"
                min="1"
                value={createForm.max_teams.toString()}
                onChange={(e) => setCreateForm({...createForm, max_teams: parseInt(e.target.value) || 1})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onCreateClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleCreateClubCategory}>
              Přiřadit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Club Category Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalContent>
          <ModalHeader>Upravit přiřazení klubu</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Klub *"
                placeholder="Vyberte klub"
                selectedKeys={editForm.club_id ? [editForm.club_id] : []}
                onSelectionChange={(keys) => {
                  const clubId = Array.from(keys)[0] as string;
                  setEditForm({...editForm, club_id: clubId});
                }}
              >
                {clubs.map((club) => (
                  <SelectItem key={club.id}>{club.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Kategorie *"
                placeholder="Vyberte kategorii"
                selectedKeys={editForm.category_id ? [editForm.category_id] : []}
                onSelectionChange={(keys) => {
                  const categoryId = Array.from(keys)[0] as string;
                  setEditForm({...editForm, category_id: categoryId});
                }}
              >
                {categories.map((category) => (
                  <SelectItem key={category.id}>{category.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Sezóna *"
                placeholder="Vyberte sezónu"
                selectedKeys={editForm.season_id ? [editForm.season_id] : []}
                onSelectionChange={(keys) => {
                  const seasonId = Array.from(keys)[0] as string;
                  setEditForm({...editForm, season_id: seasonId});
                }}
              >
                {seasons.map((season) => (
                  <SelectItem key={season.id}>{season.name}</SelectItem>
                ))}
              </Select>
              <Input
                label="Maximální počet týmů"
                type="number"
                min="1"
                value={editForm.max_teams.toString()}
                onChange={(e) => setEditForm({...editForm, max_teams: parseInt(e.target.value) || 1})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onEditClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateClubCategory}>
              Uložit změny
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md">
        <ModalContent>
          <ModalHeader>Potvrdit smazání přiřazení</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat přiřazení klubu <strong>{clubCategoryToDelete?.club.name}</strong> ke kategorii <strong>{clubCategoryToDelete?.category.name}</strong> v sezóně <strong>{clubCategoryToDelete?.season.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Tato akce je nevratná.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onDeleteClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={handleDeleteClubCategory}>
              Smazat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
