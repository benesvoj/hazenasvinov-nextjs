'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { 
  PencilIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  TrophyIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { Club, Team, Category, Season } from "@/types/types";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AssignCategoryModal, TeamsTab, CategoriesTab } from './components';

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;
  
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [clubCategories, setClubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteTeamOpen, onOpen: onDeleteTeamOpen, onClose: onDeleteTeamClose } = useDisclosure();
  const { isOpen: isAssignCategoryOpen, onOpen: onAssignCategoryOpen, onClose: onAssignCategoryClose } = useDisclosure();
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    short_name: '',
    city: '',
    founded_year: '',
    logo_url: ''
  });
  

  

  
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  
  const supabase = createClient();

  // Fetch club data
  const fetchClub = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) throw error;
      setClub(data);
      
      // Set edit form
      setEditForm({
        name: data.name,
        short_name: data.short_name || '',
        city: data.city || '',
        founded_year: data.founded_year?.toString() || '',
        logo_url: data.logo_url || ''
      });
    } catch (error) {
      setError('Chyba při načítání klubu');
      console.error('Error fetching club:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, clubId]);

  // Fetch club teams from new structure
  const fetchClubTeams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('club_category_teams')
        .select(`
          *,
          club_category:club_categories(
            category:categories(name, sort_order),
            season:seasons(name)
          )
        `)
        .eq('club_category.club_id', clubId);

      if (error) {
        console.error('❌ Supabase error in fetchClubTeams:', error);
        throw error;
      }
      
      console.log('✅ Raw club teams data:', data);
      
      // Transform data to show teams with category and season info
      const teamsData = data?.map((item: any) => ({
        id: item.id,
        name: `${item.club_category?.category?.name || 'Neznámá kategorie'} ${item.team_suffix}`,
        team_suffix: item.team_suffix,
        category_name: item.club_category?.category?.name,
        category_sort_order: item.club_category?.category?.sort_order || 0,
        season_name: item.club_category?.season?.name,
        is_active: item.is_active,
        club_category_id: item.club_category_id
      })) || [];
      
      // Sort by category sort_order first, then by team_suffix
      const sortedTeamsData = teamsData.sort((a: any, b: any) => {
        if (a.category_sort_order !== b.category_sort_order) {
          return a.category_sort_order - b.category_sort_order;
        }
        return a.team_suffix.localeCompare(b.team_suffix);
      });
      
      setTeams(sortedTeamsData);
    } catch (error) {
      console.error('Error fetching club teams:', error);
    }
  }, [supabase, clubId]);

  // Fetch categories and seasons
  const fetchCategoriesAndSeasons = useCallback(async () => {
    try {
      const [categoriesResult, seasonsResult] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('name'),
        supabase.from('seasons').select('*').order('name', { ascending: false })
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (seasonsResult.error) throw seasonsResult.error;

      setCategories(categoriesResult.data || []);
      setSeasons(seasonsResult.data || []);
    } catch (error) {
      console.error('Error fetching categories and seasons:', error);
    }
  }, [supabase]);

  // Fetch club categories
  const fetchClubCategories = useCallback(async () => {
    try {
      console.log('🔍 Fetching club categories for club:', clubId);
      
      const { data, error } = await supabase
        .from('club_categories')
        .select(`
          *,
          category:categories(name),
          season:seasons(name)
        `)
        .eq('club_id', clubId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Club categories data:', data);
      
      // Get team counts for each club category
      const categoriesWithTeamCounts = await Promise.all(
        (data || []).map(async (clubCategory: any) => {
          const { count: teamCount } = await supabase
            .from('club_category_teams')
            .select('*', { count: 'exact', head: true })
            .eq('club_category_id', clubCategory.id);
          
          return {
            ...clubCategory,
            team_count: teamCount || 0
          };
        })
      );
      
      // Sort by category name in JavaScript
      const sortedData = categoriesWithTeamCounts.sort((a, b) => 
        (a.category?.name || '').localeCompare(b.category?.name || '')
      );
      
      console.log('🔄 Sorted club categories with team counts:', sortedData);
      setClubCategories(sortedData);
    } catch (error) {
      console.error('❌ Error fetching club categories:', error);
      setError(`Chyba při načítání kategorií: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    }
  }, [supabase, clubId]);

  // Update club
  const handleUpdateClub = async () => {
    try {
      if (!editForm.name.trim()) {
        setError('Název klubu je povinný');
        return;
      }

      const { error } = await supabase
        .from('clubs')
        .update({
          name: editForm.name.trim(),
          short_name: editForm.short_name.trim() || null,
          city: editForm.city.trim() || null,
          founded_year: editForm.founded_year ? parseInt(editForm.founded_year) : null,
          logo_url: editForm.logo_url.trim() || null
        })
        .eq('id', clubId);

      if (error) throw error;

      onEditClose();
      fetchClub();
      setError('');
    } catch (error) {
      setError('Chyba při aktualizaci klubu');
      console.error('Error updating club:', error);
    }
  };

  // Note: Teams are now generated automatically when assigning categories
  // The old manual team creation is no longer needed

  // Delete team from club
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      // Delete from club_category_teams (this is the new structure)
      const { error } = await supabase
        .from('club_category_teams')
        .delete()
        .eq('id', teamToDelete.id);

      if (error) throw error;

      onDeleteTeamClose();
      setTeamToDelete(null);
      fetchClubTeams();
      fetchClubCategories(); // Also refresh categories to update team counts
      setError('');
    } catch (error) {
      setError('Chyba při mazání týmu');
      console.error('Error deleting team:', error);
    }
  };

  // Assign club to category
  const handleAssignCategory = async (formData: {
    category_id: string;
    season_id: string;
    max_teams: number;
  }) => {
    try {
      if (!formData.category_id || !formData.season_id) {
        setError('Prosím vyberte kategorii a sezónu');
        return;
      }

      const { error } = await supabase
        .from('club_categories')
        .insert({
          club_id: clubId,
          category_id: formData.category_id,
          season_id: formData.season_id,
          max_teams: formData.max_teams
        });

      if (error) throw error;

      onAssignCategoryClose();
      fetchClubCategories(); // Refresh the list
      setError('');
    } catch (error) {
      setError('Chyba při přiřazování kategorie');
      console.error('Error assigning category:', error);
    }
  };

  // Generate teams for a club category
  const handleGenerateTeams = async (clubCategoryId: string) => {
    try {
      // Call the function to generate teams
      const { error } = await supabase.rpc('generate_teams_for_club_category', {
        p_club_category_id: clubCategoryId
      });

      if (error) throw error;

      // Refresh both teams and categories
      fetchClubTeams();
      fetchClubCategories();
      setError('');
    } catch (error) {
      setError('Chyba při generování týmů');
      console.error('Error generating teams:', error);
    }
  };

  // Delete club category
  const handleDeleteClubCategory = async (clubCategoryId: string) => {
    try {
      // Delete the club category (this will cascade delete teams)
      const { error } = await supabase
        .from('club_categories')
        .delete()
        .eq('id', clubCategoryId);

      if (error) throw error;

      // Refresh both teams and categories
      fetchClubTeams();
      fetchClubCategories();
      setError('');
    } catch (error) {
      setError('Chyba při mazání kategorie');
      console.error('Error deleting club category:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (clubId) {
      fetchClub();
      fetchClubTeams();
      fetchCategoriesAndSeasons();
      fetchClubCategories();
    }
  }, [clubId, fetchClub, fetchClubTeams, fetchCategoriesAndSeasons, fetchClubCategories]);

  if (loading) {
    return <div className="p-6 text-center">Načítání...</div>;
  }

  if (!club) {
    return <div className="p-6 text-center text-red-600">Klub nebyl nalezen</div>;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/clubs">
            <Button variant="light" size="sm">
              ← Zpět na kluby
            </Button>
          </Link>
          <Button 
            color="primary" 
            startContent={<PencilIcon className="w-4 h-4" />}
            onPress={onEditOpen}
            size="sm"
          >
            Upravit klub
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          {club.logo_url && (
            <img 
              src={club.logo_url} 
              alt={`${club.name} logo`}
              className="w-16 h-16 object-contain rounded"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{club.name}</h1>
            <div className="text-gray-600 space-y-1">
              {club.short_name && club.short_name !== club.name && (
                <p>Krátký název: {club.short_name}</p>
              )}
              {club.city && <p>Město: {club.city}</p>}
              {club.founded_year && <p>Založen: {club.founded_year}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs aria-label="Club management">
        <Tab key="teams" title={
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4" />
            Týmy ({teams.length})
          </div>
        }>
          <TeamsTab 
            teams={teams}
            onDeleteTeam={(team) => {
              setTeamToDelete(team);
              onDeleteTeamOpen();
            }}
          />
        </Tab>

        <Tab key="categories" title={
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-4 h-4" />
            Kategorie ({clubCategories.length})
          </div>
        }>
          <CategoriesTab
            clubCategories={clubCategories}
            categories={categories}
            onAssignCategory={onAssignCategoryOpen}
            onGenerateTeams={handleGenerateTeams}
            onDeleteClubCategory={handleDeleteClubCategory}
          />
        </Tab>
      </Tabs>

      {/* Edit Club Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalContent>
          <ModalHeader>Upravit klub</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Název klubu *"
                placeholder="např. Hazena Švínov"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
              <Input
                label="Krátký název"
                placeholder="např. Švínov"
                value={editForm.short_name}
                onChange={(e) => setEditForm({...editForm, short_name: e.target.value})}
              />
              <Input
                label="Město"
                placeholder="např. Švínov"
                value={editForm.city}
                onChange={(e) => setEditForm({...editForm, city: e.target.value})}
              />
              <Input
                label="Rok založení"
                type="number"
                placeholder="např. 1920"
                value={editForm.founded_year}
                onChange={(e) => setEditForm({...editForm, founded_year: e.target.value})}
              />
              <Input
                label="URL loga"
                placeholder="https://example.com/logo.png"
                value={editForm.logo_url}
                onChange={(e) => setEditForm({...editForm, logo_url: e.target.value})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onEditClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateClub}>
              Uložit změny
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>



      {/* Delete Team Modal */}
      <Modal isOpen={isDeleteTeamOpen} onClose={onDeleteTeamClose} size="md">
        <ModalContent>
          <ModalHeader>Potvrdit smazání týmu</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat tým <strong>{teamToDelete?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Tato akce je nevratná. Tým můžete znovu vygenerovat pomocí tlačítka "Generovat týmy" v kategorii.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onDeleteTeamClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={handleDeleteTeam}>
              Smazat tým
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Category Modal */}
      <AssignCategoryModal
        isOpen={isAssignCategoryOpen}
        onClose={onAssignCategoryClose}
        onAssignCategory={handleAssignCategory}
        clubId={clubId}
        assignedCategoryIds={clubCategories.map(cc => cc.category_id)}
      />
    </div>
  );
}
