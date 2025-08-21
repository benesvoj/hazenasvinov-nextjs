'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { Badge } from "@heroui/badge";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  TrophyIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";
import Image from 'next/image';
import LineupManager from './components/LineupManager';
import ExcelImportModal from './components/ExcelImportModal';
import { useExcelImport } from '@/hooks/useExcelImport';

interface Team {
  id: string;
  name: string;
  short_name?: string;
  city?: string;
  region?: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  founded_year?: number;
  home_venue?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  age_group?: string;
  gender?: string;
  season_id?: string;
  matchweek_count?: number;
  competition_type?: 'league' | 'league_playoff' | 'tournament';
  team_count?: number;
  allow_team_duplicates?: boolean;
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
}

interface Match {
  id: string;
  category_id: string;
  season_id: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  venue: string;
  competition: string;
  is_home: boolean;
  status: 'upcoming' | 'completed';
  home_score?: number;
  away_score?: number;
  result?: 'win' | 'loss' | 'draw';
  matchweek?: number;
  created_at: string;
  updated_at: string;
  home_team?: Team;
  away_team?: Team;
  category?: Category;
  season?: Season;
}

interface Standing {
  position: number;
  team: { name: string; logo_url?: string };
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
  category_id?: string;
  season_id?: string;
  team_id?: string;
}

// Helper function to get category info
const getCategoryInfo = (categoryId: string, categories: Category[]) => {
  const category = categories.find(c => c.id === categoryId);
  if (!category) return { name: "Neznámá kategorie", competition: "Neznámá soutěž" };
  
  return {
    name: category.name,
    competition: `${category.name} - ${category.description || 'Soutěž'}`
  };
};

export default function MatchesAdminPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  
  // Modal states
  const { isOpen: isAddMatchOpen, onOpen: onAddMatchOpen, onClose: onAddMatchClose } = useDisclosure();
  const { isOpen: isAddResultOpen, onOpen: onAddResultOpen, onClose: onAddResultClose } = useDisclosure();
  const { isOpen: isEditMatchOpen, onOpen: onEditMatchOpen, onClose: onEditMatchClose } = useDisclosure();
  const { isOpen: isBulkUpdateOpen, onOpen: onBulkUpdateOpen, onClose: onBulkUpdateClose } = useDisclosure();
  const { isOpen: isLineupModalOpen, onOpen: onLineupModalOpen, onClose: onLineupModalClose } = useDisclosure();
  const { isOpen: isExcelImportOpen, onOpen: onExcelImportOpen, onClose: onExcelImportClose } = useDisclosure();
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const { importMatches } = useExcelImport();

  // Reset matchToDelete when confirmation modal closes
  const handleDeleteConfirmClose = () => {
    onDeleteConfirmClose();
    setMatchToDelete(null);
  };

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    home_team_id: '',
    away_team_id: '',
    venue: '',
    category_id: '',
    season_id: '',
    matchweek: ''
  });

  const [resultData, setResultData] = useState({
    home_score: '',
    away_score: ''
  });

  const [editData, setEditData] = useState({
    date: '',
    time: '',
    home_team_id: '',
    away_team_id: '',
    venue: '',
    home_score: '',
    away_score: '',
    status: 'completed' as 'upcoming' | 'completed',
    matchweek: '',
    category_id: ''
  });

  const [bulkUpdateData, setBulkUpdateData] = useState({
    categoryId: '',
    matchweek: ''
  });

  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  const supabase = createClient();

  // Fetch teams assigned to selected category and season
  const fetchFilteredTeams = useCallback(async (categoryId: string, seasonId: string) => {
    if (!categoryId || !seasonId) {
      setFilteredTeams([]);
      return;
    }

    try {
      console.log('Fetching teams for category:', categoryId, 'season:', seasonId);
      
      const { data, error } = await supabase
        .from('team_categories')
        .select(`
          team_id,
          team:teams(*)
        `)
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .eq('is_active', true);

      if (error) throw error;

      const teamsData = data?.map((item: any) => item.team).filter(Boolean) || [];
      setFilteredTeams(teamsData);
      console.log('Filtered teams:', teamsData);
    } catch (error) {
      console.error('Error fetching filtered teams:', error);
      setFilteredTeams([]);
    }
  }, [supabase]);

  // Fetch members for lineup management
  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('surname', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  }, [supabase]);

  // Fetch all teams
  const fetchTeams = useCallback(async () => {
    try {
      console.log('🔍 Fetching teams...');
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      console.log('✅ Teams fetched:', data?.length || 0, 'teams');
      setTeams(data || []);
    } catch (error) {
      setError('Chyba při načítání týmů');
      console.error('Error fetching teams:', error);
    }
  }, [supabase]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      console.log('🔍 Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      console.log('✅ Categories fetched:', data?.length || 0, 'categories');
      setCategories(data || []);
      
      // Set first category as default if categories are loaded and no category is selected
      if (data && data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      setError('Chyba při načítání kategorií');
      console.error('Error fetching categories:', error);
    }
  }, [supabase, selectedCategory]);

  // Fetch seasons
  const fetchSeasons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('name', { ascending: false });

      if (error) throw error;
      setSeasons(data || []);
      
      // Set active season as default
      const activeSeason = data?.find((season: any) => season.is_active);
      if (activeSeason) {
        setSelectedSeason(activeSeason.id);
      }
    } catch (error) {
      setError('Chyba při načítání sezón');
      console.error('Error fetching seasons:', error);
    }
  }, [supabase]);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          category:categories(*),
          season:seasons(*)
        `)
        .order('date', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedSeason) {
        query = query.eq('season_id', selectedSeason);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      setError('Chyba při načítání zápasů');
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedCategory, selectedSeason]);

  // Fetch standings
  const fetchStandings = useCallback(async () => {
    try {
      let query = supabase
        .from('standings')
        .select(`
          *,
          team:team_id(name, logo_url)
        `)
        .order('position');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedSeason) {
        query = query.eq('season_id', selectedSeason);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStandings(data || []);
    } catch (error) {
      setError('Chyba při načítání tabulky');
      console.error('Error fetching standings:', error);
    }
  }, [supabase, selectedCategory, selectedSeason]);

  // Update filtered teams when category or season changes
  useEffect(() => {
    console.log('Category/Season changed:', { selectedCategory, selectedSeason });
    if (selectedCategory && selectedSeason) {
      fetchFilteredTeams(selectedCategory, selectedSeason);
    } else {
      setFilteredTeams([]);
    }
  }, [selectedCategory, selectedSeason, fetchFilteredTeams]);

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchSeasons();
    fetchTeams();
    fetchMembers();
  }, [fetchCategories, fetchSeasons, fetchTeams, fetchMembers]);

  // Fetch matches and standings when filters change
  useEffect(() => {
    fetchMatches();
    fetchStandings();
  }, [fetchMatches, fetchStandings]);

  // Calculate standings
  const calculateStandings = async () => {
    if (isSeasonClosed()) {
      setError('Nelze přepočítat tabulku pro uzavřenou sezónu');
      return;
    }

    try {
      // Get completed matches for the selected category and season
      const { data: completedMatches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('season_id', selectedSeason)
        .eq('status', 'completed');

      if (matchesError) throw matchesError;

      if (!completedMatches || completedMatches.length === 0) {
        setError('Žádné dokončené zápasy k výpočtu tabulky');
        return;
      }

      // Get teams for this category and season
      const { data: teamCategories, error: teamsError } = await supabase
        .from('team_categories')
        .select('team_id')
        .eq('category_id', selectedCategory)
        .eq('season_id', selectedSeason)
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      if (!teamCategories || teamCategories.length === 0) {
        setError('Žádné týmy v této kategorii a sezóně');
        return;
      }

      // Initialize standings for all teams
      const standingsMap = new Map();
      teamCategories.forEach((tc: any) => {
        standingsMap.set(tc.team_id, {
          team_id: tc.team_id,
          category_id: selectedCategory,
          season_id: selectedSeason,
          position: 0,
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0
        });
      });

      // Calculate standings from matches
      completedMatches.forEach((match: any) => {
        if (!match.home_score || !match.away_score) return;

        const homeStanding = standingsMap.get(match.home_team_id);
        const awayStanding = standingsMap.get(match.away_team_id);

        if (homeStanding && awayStanding) {
          // Update matches played
          homeStanding.matches++;
          awayStanding.matches++;

          // Update goals
          homeStanding.goals_for += match.home_score;
          homeStanding.goals_against += match.away_score;
          awayStanding.goals_for += match.away_score;
          awayStanding.goals_against += match.home_score;

          // Update points and wins/draws/losses
          if (match.home_score > match.away_score) {
            // Home team wins
            homeStanding.wins++;
            homeStanding.points += 2;
            awayStanding.losses++;
          } else if (match.home_score < match.away_score) {
            // Away team wins
            awayStanding.wins++;
            awayStanding.points += 2;
            homeStanding.losses++;
          } else {
            // Draw
            homeStanding.draws++;
            homeStanding.points += 1;
            awayStanding.draws++;
            awayStanding.points += 1;
          }
        }
      });

      // Convert to array and sort by points, then goal difference
      const standingsArray = Array.from(standingsMap.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aGoalDiff = a.goals_for - a.goals_against;
        const bGoalDiff = b.goals_for - b.goals_against;
        if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;
        return b.goals_for - a.goals_for;
      });

      // Update positions
      standingsArray.forEach((standing: any, index) => {
        standing.position = index + 1;
      });

      // Upsert standings to database
      const { error: upsertError } = await supabase
        .from('standings')
        .upsert(standingsArray, {
          onConflict: 'category_id,season_id,team_id'
        });

      if (upsertError) throw upsertError;

      // Refresh standings
      fetchStandings();
      setError('');
    } catch (error) {
      setError('Chyba při výpočtu tabulky');
      console.error('Error calculating standings:', error);
    }
  };

  // Check if selected season is closed
  const isSeasonClosed = () => {
    const season = seasons.find(s => s.id === selectedSeason);
    return season?.is_closed || false;
  };

  // Add new match
  const handleAddMatch = async () => {
    if (isSeasonClosed()) {
      setError('Nelze přidat zápas do uzavřené sezóny');
      return;
    }

    try {
      if (!formData.date || !formData.time || !formData.home_team_id || !formData.away_team_id || !formData.venue) {
        setError('Prosím vyplňte všechna povinná pole');
        return;
      }

      const insertData: any = {
        category_id: selectedCategory,
        season_id: selectedSeason,
        date: formData.date,
        time: formData.time,
        home_team_id: formData.home_team_id,
        away_team_id: formData.away_team_id,
        venue: formData.venue,
        competition: getCategoryInfo(selectedCategory, categories).competition,
        is_home: true,
        status: 'upcoming'
      };

      // Handle matchweek - allow setting to null if empty, or parse the value
      if (formData.matchweek === '') {
        insertData.matchweek = null;
      } else if (formData.matchweek) {
        insertData.matchweek = parseInt(formData.matchweek);
      }

      const { error } = await supabase
        .from('matches')
        .insert(insertData);

      if (error) throw error;
      
      onAddMatchClose();
      setFormData({
        date: '',
        time: '',
        home_team_id: '',
        away_team_id: '',
        venue: '',
        category_id: '',
        season_id: '',
        matchweek: ''
      });
      fetchMatches();
      setError('');
    } catch (error) {
      setError('Chyba při přidávání zápasu');
      console.error('Error adding match:', error);
    }
  };

  // Update match result
  const handleUpdateResult = async () => {
    if (isSeasonClosed()) {
      setError('Nelze upravit výsledek v uzavřené sezóně');
      return;
    }

    if (!selectedMatch) return;

    try {
      if (!resultData.home_score || !resultData.away_score) {
        setError('Prosím vyplňte oba skóre');
        return;
      }

      const homeScore = parseInt(resultData.home_score);
      const awayScore = parseInt(resultData.away_score);

      let result = 'draw';
      if (homeScore > awayScore) {
        result = 'win';
      } else if (homeScore < awayScore) {
        result = 'loss';
      }

      const { error } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          result: result,
          status: 'completed'
        })
        .eq('id', selectedMatch.id);

      if (error) throw error;
      
      onAddResultClose();
      setResultData({ home_score: '', away_score: '' });
      setSelectedMatch(null);
      fetchMatches();
      setError('');
    } catch (error) {
      setError('Chyba při aktualizaci výsledku');
      console.error('Error updating result:', error);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (match: Match) => {
    setMatchToDelete(match);
    onDeleteConfirmOpen();
  };

  // Delete match (after confirmation)
  const handleDeleteMatch = async () => {
    if (!matchToDelete) return;
    
    if (isSeasonClosed()) {
      setError('Nelze smazat zápas z uzavřené sezóny');
      return;
    }

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchToDelete.id);

      if (error) throw error;
      
      fetchMatches();
      setError('');
      handleDeleteConfirmClose();
    } catch (error) {
      setError('Chyba při mazání zápasu');
      console.error('Error deleting match:', error);
    }
  };

  // Open edit match modal
  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match);
    setEditData({
      date: match.date,
      time: match.time,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      venue: match.venue,
      home_score: match.home_score?.toString() || '',
      away_score: match.away_score?.toString() || '',
      status: match.status,
      matchweek: match.matchweek ? match.matchweek.toString() : '',
      category_id: match.category_id
    });
    onEditMatchOpen();
  };

  // Update match
  const handleUpdateMatch = async () => {
    if (isSeasonClosed()) {
      setError('Nelze upravit zápas v uzavřené sezóně');
      return;
    }

    if (!selectedMatch) return;

    try {
      // Validate required fields
      if (!editData.date || !editData.time || !editData.venue) {
        setError('Prosím vyplňte všechna povinná pole');
        return;
      }

      // Validate teams are different
      if (editData.home_team_id === editData.away_team_id) {
        setError('Domácí a hostující tým musí být různé');
        return;
      }

      // Calculate result if scores are provided
      let result = selectedMatch.result;
      if (editData.home_score && editData.away_score) {
        const homeScore = parseInt(editData.home_score);
        const awayScore = parseInt(editData.away_score);
        
        if (homeScore > awayScore) {
          result = 'win';
        } else if (homeScore < awayScore) {
          result = 'loss';
        } else {
          result = 'draw';
        }
      }

      const updateData: any = {
        date: editData.date,
        time: editData.time,
        home_team_id: editData.home_team_id,
        away_team_id: editData.away_team_id,
        venue: editData.venue,
        status: editData.status
      };

      // Handle matchweek - allow setting to null if empty, or parse the value
      if (editData.matchweek === '') {
        updateData.matchweek = null;
      } else if (editData.matchweek) {
        updateData.matchweek = parseInt(editData.matchweek);
      }

      // Only update scores if they are provided
      if (editData.home_score && editData.away_score) {
        updateData.home_score = parseInt(editData.home_score);
        updateData.away_score = parseInt(editData.away_score);
        updateData.result = result;
      }

      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', selectedMatch.id);

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      onEditMatchClose();
      setEditData({
        date: '',
        time: '',
        home_team_id: '',
        away_team_id: '',
        venue: '',
        home_score: '',
        away_score: '',
        status: 'completed',
        matchweek: '',
        category_id: ''
      });
      setSelectedMatch(null);
      fetchMatches();
      setError('');
    } catch (error) {
      console.error('Full error details:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        setError(`Chyba při aktualizaci zápasu: ${error.message}`);
      } else {
        setError('Chyba při aktualizaci zápasu');
      }
    }
  };

  // Bulk update matchweek for matches without matchweek
  const handleBulkUpdateMatchweek = async () => {
    if (!bulkUpdateData.categoryId || !bulkUpdateData.matchweek) {
      setError('Prosím vyberte kategorii a kolo');
      return;
    }

    try {
      // Find matches without matchweek for the selected category
      const matchesToUpdate = matches.filter(match => 
        match.category_id === bulkUpdateData.categoryId && 
        !match.matchweek
      );

      if (matchesToUpdate.length === 0) {
        setError('Nebyly nalezeny žádné zápasy bez kola pro vybranou kategorii');
        return;
      }

      const matchweekNumber = parseInt(bulkUpdateData.matchweek);
      
      // Update all matches in bulk
      const { error } = await supabase
        .from('matches')
        .update({ matchweek: matchweekNumber })
        .in('id', matchesToUpdate.map(match => match.id));

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      setError('');
      onBulkUpdateClose();
      setBulkUpdateData({ categoryId: '', matchweek: '' });
      fetchMatches(); // Refresh the matches list
      
    } catch (error) {
      console.error('Full error details:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        setError(`Chyba při hromadné aktualizaci: ${error.message}`);
      } else {
        setError('Chyba při hromadné aktualizaci');
      }
    }
  };

  // Helper function to generate matchweek options based on category
  const getMatchweekOptions = (categoryId?: string) => {
    const options = [];
    // Add "No matchweek" option
    options.push({ value: '', label: 'Bez kola' });
    
    // Find the category to get its matchweek_count
    const category = categories.find(cat => cat.id === categoryId);
    const maxMatchweeks = category?.matchweek_count || 20; // Default to 20 if not set
    
    // Add matchweek numbers based on category setting
    for (let i = 1; i <= maxMatchweeks; i++) {
      options.push({ value: i.toString(), label: `Kolo ${i}` });
    }
    return options;
  };

  // Helper functions for badges
  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win':
        return <Badge color="success">Výhra</Badge>;
      case 'loss':
        return <Badge color="danger">Prohra</Badge>;
      case 'draw':
        return <Badge color="warning">Remíza</Badge>;
      default:
        return <Badge color="default">N/A</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge color="primary">Připravuje se</Badge>;
      case 'completed':
        return <Badge color="success">Dokončeno</Badge>;
      default:
        return <Badge color="default">Neznámý</Badge>;
    }
  };

  const lineupManagerProps = useMemo(() => {
    if (!selectedMatch) return null;
    
    return {
      matchId: selectedMatch.id,
      homeTeamId: selectedMatch.home_team_id,
      awayTeamId: selectedMatch.away_team_id,
      homeTeamName: selectedMatch.home_team?.name || 'Neznámý tým',
      awayTeamName: selectedMatch.away_team?.name || 'Neznámý tým',
      members: members,
    };
  }, [selectedMatch, members]);

  const handleExcelImport = useCallback(async (matches: any[]) => {
    if (!selectedSeason) {
      setError('Vyberte prosím sezónu před importem.');
      return;
    }

    try {
      const result = await importMatches(matches, selectedSeason);
      
      if (result.success > 0) {
        // Refresh data
        await fetchMatches();
        await fetchStandings();
        setError('');
        
        // Show success message
        alert(`Import dokončen! Úspěšně importováno ${result.success} zápasů.${result.failed > 0 ? ` ${result.failed} zápasů selhalo.` : ''}`);
      }
      
      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
        setError(`Import dokončen s chybami. Úspěšně: ${result.success}, Selhalo: ${result.failed}. Zkontrolujte konzoli pro detaily.`);
      }
    } catch (error) {
      console.error('Excel import error:', error);
      setError(`Import selhal: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    }
  }, [selectedSeason, importMatches, fetchMatches, fetchStandings]);

  return (
    <div className="p-6">
      {/* Season closed warning */}
      {selectedSeason && isSeasonClosed() && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <strong>Upozornění:</strong> Tato sezóna je uzavřená. Nelze přidávat ani upravovat zápasy.
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Season selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vyberte sezónu:
        </label>
        <select
          className="w-full md:w-64 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
        >
          <option value="">Vyberte sezónu</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name} {season.is_closed ? '(Uzavřená)' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedSeason && (
        <>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Zápasy</h2>
              </div>
              <div className="flex gap-2">
                <Button 
                  color="primary" 
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={onAddMatchOpen}
                  isDisabled={isSeasonClosed()}
                >
                  Přidat zápas
                </Button>
                <Button 
                  color="warning" 
                  startContent={<ArrowPathIcon className="w-4 h-4" />}
                  onPress={onBulkUpdateOpen}
                  isDisabled={isSeasonClosed()}
                >
                  Hromadná úprava kol
                </Button>
                <Button 
                  color="secondary" 
                  onPress={calculateStandings}
                  isDisabled={isSeasonClosed()}
                >
                  Přepočítat tabulku
                </Button>
                <Button 
                  color="secondary" 
                  startContent={<DocumentArrowUpIcon className="w-4 h-4" />}
                  onPress={onExcelImportOpen}
                >
                  Import z Excelu
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-8">Načítání...</div>
              ) : (
                <Tabs 
                  aria-label="Categories"
                  selectedKey={selectedCategory}
                  onSelectionChange={(key) => {
                    console.log('Category selected:', key);
                    setSelectedCategory(key as string);
                  }}
                >
                  {categories.map((category) => (
                    <Tab key={category.id} title={category.name}>
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-4">
                          {category.name} - {getCategoryInfo(category.id, categories).competition}
                        </h3>
                        
                        {/* Matches for this category grouped by matchweek */}
                        <div className="space-y-6">
                          {(() => {
                            // Group matches by matchweek
                            const matchesForCategory = matches.filter(match => match.category_id === category.id);
                            const groupedMatches = new Map<number, Match[]>();
                            
                            // Group by matchweek, put matches without matchweek at the end
                            matchesForCategory.forEach(match => {
                              const matchweek = match.matchweek || 0;
                              if (!groupedMatches.has(matchweek)) {
                                groupedMatches.set(matchweek, []);
                              }
                              groupedMatches.get(matchweek)!.push(match);
                            });
                            
                            // Sort matchweeks and convert to array
                            const sortedMatchweeks = Array.from(groupedMatches.keys()).sort((a, b) => {
                              if (a === 0) return 1; // No matchweek goes last
                              if (b === 0) return -1;
                              return a - b;
                            });
                            
                            return sortedMatchweeks.map(matchweek => {
                              const weekMatches = groupedMatches.get(matchweek)!;
                              const weekTitle = matchweek === 0 ? 'Bez kola' : `Kolo ${matchweek}`;
                              
                              return (
                                <div key={matchweek} className="border rounded-lg p-4 bg-gray-50">
                                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                                    {weekTitle} ({weekMatches.length} zápas{weekMatches.length !== 1 ? 'ů' : ''})
                                  </h4>
                                  <div className="space-y-3">
                                    {weekMatches.map((match) => (
                                      <div key={match.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-4">
                                            <div className="text-sm text-gray-500">
                                              {new Date(match.date).toLocaleDateString('cs-CZ')} {match.time}
                                            </div>
                                            <div className="font-medium">
                                              {match.home_team?.name || 'Neznámý tým'} vs {match.away_team?.name || 'Neznámý tým'}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <MapPinIcon className="w-4 h-4 text-gray-400" />
                                              <span className="text-sm text-gray-600">{match.venue}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            {match.status === 'completed' ? (
                                              <div className="text-lg font-bold">
                                                {match.home_score} : {match.away_score}
                                              </div>
                                            ) : (
                                              <div className="text-sm text-gray-500">Skóre zatím není k dispozici</div>
                                            )}
                                            {/* {getStatusBadge(match.status)} */}
                                            {match.status === 'completed' && getResultBadge(match.result || '')}
                                          </div>
                                        </div>
                                        <div className="mt-3 flex justify-end space-x-2">
                                          {match.status === 'upcoming' && (
                                            <Button
                                              size="sm"
                                              color="primary"
                                              startContent={<EyeIcon className="w-4 h-4" />}
                                              onPress={() => {
                                                setSelectedMatch(match);
                                                onAddResultOpen();
                                              }}
                                              isDisabled={isSeasonClosed()}
                                            />
                                          )}
                                          <Button
                                            size="sm"
                                            color="warning"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => handleEditMatch(match)}
                                            isDisabled={isSeasonClosed()}
                                          />
                                          <Button
                                            size="sm"
                                            color="secondary"
                                            startContent={<UserGroupIcon className="w-4 h-4" />}
                                            onPress={() => {
                                              setSelectedMatch(match);
                                              onLineupModalOpen();
                                            }}
                                            isDisabled={isSeasonClosed()}
                                          />
                                          <Button
                                            size="sm"
                                            color="danger"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={() => handleDeleteClick(match)}
                                            isDisabled={isSeasonClosed()}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Standings for this category */}
                        <div className="mt-8">
                          <h4 className="text-lg font-semibold mb-4">Tabulka - {category.name}</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border px-4 py-2 text-left">Pozice</th>
                                  <th className="border px-4 py-2 text-left">Tým</th>
                                  <th className="border px-4 py-2 text-center">Z</th>
                                  <th className="border px-4 py-2 text-center">V</th>
                                  <th className="border px-4 py-2 text-center">R</th>
                                  <th className="border px-4 py-2 text-center">P</th>
                                  <th className="border px-4 py-2 text-center">Skóre</th>
                                  <th className="border px-4 py-2 text-center">Body</th>
                                </tr>
                              </thead>
                              <tbody>
                                {standings
                                  .filter(standing => {
                                    const match = matches.find(m => m.category_id === category.id);
                                    return match && standing.category_id === category.id;
                                  })
                                  .map((standing, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="border px-4 py-2 font-medium">{standing.position}</td>
                                      <td className="border px-4 py-2">
                                        <div className="flex items-center gap-2">
                                          {standing.team?.logo_url && (
                                            <Image 
                                              src={standing.team.logo_url} 
                                              alt={`${standing.team.name} logo`}
                                              width={24}
                                              height={24}
                                              className="w-6 h-6 object-contain"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                              }}
                                            />
                                          )}
                                          <span>{standing.team?.name || 'N/A'}</span>
                                        </div>
                                      </td>
                                      <td className="border px-4 py-2 text-center">{standing.matches}</td>
                                      <td className="border px-4 py-2 text-center">{standing.wins}</td>
                                      <td className="border px-4 py-2 text-center">{standing.draws}</td>
                                      <td className="border px-4 py-2 text-center">{standing.losses}</td>
                                      <td className="border px-4 py-2 text-center">{standing.goals_for}:{standing.goals_against}</td>
                                      <td className="border px-4 py-2 text-center font-bold">{standing.points}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </Tab>
                  ))}
                </Tabs>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* Add Match Modal */}
      <Modal isOpen={isAddMatchOpen} onClose={onAddMatchClose}>
        <ModalContent>
          <ModalHeader>Přidat nový zápas</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Datum"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
              <Input
                label="Čas"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
                              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domácí tým (přiřazené k vybrané kategorii a sezóně)
                  </label>
                  <div className="text-xs text-gray-500 mb-2">
                    Debug: Category: {selectedCategory}, Season: {selectedSeason}, Teams: {filteredTeams.length}
                  </div>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.home_team_id}
                    onChange={(e) => {
                      const selectedTeamId = e.target.value;
                      const selectedTeam = filteredTeams.find(team => team.id === selectedTeamId);
                      setFormData({
                        ...formData, 
                        home_team_id: selectedTeamId,
                        venue: selectedTeam?.home_venue || formData.venue
                      });
                    }}
                  >
                    <option value="">Vyberte domácí tým</option>
                    {filteredTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {filteredTeams.length === 0 && selectedCategory && selectedSeason && (
                    <p className="text-sm text-red-600 mt-1">
                      Žádné týmy nejsou přiřazeny k této kategorii a sezóně
                    </p>
                  )}
                </div>
                              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hostující tým (přiřazené k vybrané kategorii a sezóně)
                  </label>
                  <div className="text-xs text-gray-500 mb-2">
                    Debug: Category: {selectedCategory}, Season: {selectedSeason}, Teams: {filteredTeams.length}
                  </div>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.away_team_id}
                    onChange={(e) => setFormData({...formData, away_team_id: e.target.value})}
                  >
                    <option value="">Vyberte hostující tým</option>
                    {filteredTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {filteredTeams.length === 0 && selectedCategory && selectedSeason && (
                    <p className="text-sm text-red-600 mt-1">
                      Žádné týmy nejsou přiřazeny k této kategorii a sezóně
                    </p>
                  )}
                </div>
              <Input
                label="Místo konání"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kolo
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={formData.matchweek}
                  onChange={(e) => setFormData({...formData, matchweek: e.target.value})}
                >
                  {getMatchweekOptions(formData.category_id).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onAddMatchClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleAddMatch}>
              Přidat zápas
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Result Modal */}
      <Modal isOpen={isAddResultOpen} onClose={onAddResultClose}>
        <ModalContent>
          <ModalHeader>Přidat výsledek</ModalHeader>
          <ModalBody>
            {selectedMatch && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">{selectedMatch.home_team?.name || 'Neznámý tým'} vs {selectedMatch.away_team?.name || 'Neznámý tým'}</h3>
                  <p className="text-sm text-gray-600">{new Date(selectedMatch.date).toLocaleDateString('cs-CZ')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    label={`Skóre ${selectedMatch.home_team?.name || 'Domácí tým'}`}
                    type="number"
                    value={resultData.home_score}
                    onChange={(e) => setResultData({...resultData, home_score: e.target.value})}
                  />
                  <span className="text-2xl font-bold">:</span>
                  <Input
                    label={`Skóre ${selectedMatch.away_team?.name || 'Hostující tým'}`}
                    type="number"
                    value={resultData.away_score}
                    onChange={(e) => setResultData({...resultData, away_score: e.target.value})}
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onAddResultClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateResult}>
              Uložit výsledek
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Match Modal */}
      <Modal isOpen={isEditMatchOpen} onClose={onEditMatchClose} size="3xl">
        <ModalContent>
          <ModalHeader>Upravit zápas</ModalHeader>
          <ModalBody>
            {selectedMatch && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Základní údaje</h4>
                  <Input
                    label="Datum"
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({...editData, date: e.target.value})}
                  />
                  <Input
                    label="Čas"
                    type="time"
                    value={editData.time}
                    onChange={(e) => setEditData({...editData, time: e.target.value})}
                  />
                  <Input
                    label="Místo konání"
                    value={editData.venue}
                    onChange={(e) => setEditData({...editData, venue: e.target.value})}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kolo
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={editData.matchweek}
                      onChange={(e) => setEditData({...editData, matchweek: e.target.value})}
                    >
                                        {getMatchweekOptions(editData.category_id).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editData.status}
                      onChange={(e) => setEditData({...editData, status: e.target.value as 'upcoming' | 'completed'})}
                    >
                      <option value="upcoming">Nadcházející</option>
                      <option value="completed">Ukončený</option>
                    </select>
                  </div>
                </div>

                {/* Right Column - Teams & Scores */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Týmy & Skóre</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Domácí tým
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editData.home_team_id}
                      onChange={(e) => setEditData({...editData, home_team_id: e.target.value})}
                    >
                      <option value="">Vyberte domácí tým</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hostující tým
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editData.away_team_id}
                      onChange={(e) => setEditData({...editData, away_team_id: e.target.value})}
                    >
                      <option value="">Vyberte hostující tým</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Scores - only show if match is completed */}
                  {editData.status === 'completed' && (
                    <div className="space-y-4 pt-4 border-t">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100">Skóre</h5>
                      <div className="flex items-center space-x-4">
                        <Input
                          label="Domácí skóre"
                          type="number"
                          value={editData.home_score}
                          onChange={(e) => setEditData({...editData, home_score: e.target.value})}
                        />
                        <span className="text-2xl font-bold">:</span>
                        <Input
                          label="Hostující skóre"
                          type="number"
                          value={editData.away_score}
                          onChange={(e) => setEditData({...editData, away_score: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onEditMatchClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateMatch}>
              Uložit změny
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Update Matchweek Modal */}
      <Modal isOpen={isBulkUpdateOpen} onClose={onBulkUpdateClose} size="lg">
        <ModalContent>
          <ModalHeader>Hromadná úprava kol</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Tato funkce umožní nastavit stejné kolo pro všechny zápasy bez kola v dané kategorii.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategorie
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={bulkUpdateData.categoryId}
                  onChange={(e) => setBulkUpdateData({...bulkUpdateData, categoryId: e.target.value})}
                >
                  <option value="">Vyberte kategorii</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kolo
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={bulkUpdateData.matchweek}
                  onChange={(e) => setBulkUpdateData({...bulkUpdateData, matchweek: e.target.value})}
                >
                  <option value="">Vyberte kolo</option>
                  {getMatchweekOptions().slice(1).map((option) => ( // Skip the "Bez kola" option
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {bulkUpdateData.categoryId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Nalezeno {matches.filter(match => 
                      match.category_id === bulkUpdateData.categoryId && !match.matchweek
                    ).length} zápasů bez kola v kategorii &quot;{categories.find(c => c.id === bulkUpdateData.categoryId)?.name}&quot;
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onBulkUpdateClose}>
              Zrušit
            </Button>
            <Button 
              color="primary" 
              onPress={handleBulkUpdateMatchweek}
              isDisabled={!bulkUpdateData.categoryId || !bulkUpdateData.matchweek}
            >
              Hromadně upravit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Lineup Management Modal */}
      <Modal isOpen={isLineupModalOpen} onClose={onLineupModalClose} size="5xl">
        <ModalContent>
          <ModalHeader>
            Správa sestav - {selectedMatch?.home_team?.name} vs {selectedMatch?.away_team?.name}
          </ModalHeader>
          <ModalBody>
            {selectedMatch && lineupManagerProps && (
              <LineupManager 
                key={selectedMatch.id} 
                {...lineupManagerProps} 
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onLineupModalClose}>
              Zavřít
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal 
        isOpen={isExcelImportOpen} 
        onClose={onExcelImportClose} 
        onImport={handleExcelImport}
        categories={categories}
        teams={teams}
        selectedSeason={selectedSeason}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={handleDeleteConfirmClose}>
        <ModalContent>
          <ModalHeader>Potvrdit smazání zápasu</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat zápas{' '}
              <strong>
                {matchToDelete?.home_team?.name || 'Domácí tým'} vs {matchToDelete?.away_team?.name || 'Hostující tým'}
              </strong>
              {' '}ze dne {matchToDelete?.date}?
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Tato akce je nevratná a smaže všechny související údaje o zápasu.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onPress={handleDeleteConfirmClose}>
              Zrušit
            </Button>
            <Button 
              color="danger" 
              onPress={handleDeleteMatch}
            >
              Smazat zápas
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Debug info */}
      {isExcelImportOpen && (
        <div style={{ display: 'none' }}>
          Debug: categories={categories.length}, teams={teams.length}, season={selectedSeason}
        </div>
      )}
      
      {/* Console debug for modal props */}
      {isExcelImportOpen && (
        <script dangerouslySetInnerHTML={{
          __html: `
            console.log('🔍 Modal Props Debug:', {
              categoriesCount: ${categories.length},
              teamsCount: ${teams.length},
              selectedSeason: '${selectedSeason}',
              categories: ${JSON.stringify(categories)},
              teams: ${JSON.stringify(teams)}
            });
          `
        }} />
      )}
    </div>
  );
}
