'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { 
  MapPinIcon, 
  TrophyIcon,
  PlusIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  UserGroupIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";
import Image from 'next/image';
import { LineupManager, AddMatchModal, AddResultModal, EditMatchModal, BulkUpdateMatchweekModal, ExcelImportModal, MatchActionsMenu } from './components';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import MobileActionsMenu from '@/components/MobileActionsMenu';
import { useExcelImport } from '@/hooks/useExcelImport';
import { Match, Category, Team, Season, Standing } from "@/types/types";
import { getCategoryInfo } from "@/helpers/getCategoryInfo";


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
  const { isOpen: isDeleteAllConfirmOpen, onOpen: onDeleteAllConfirmOpen, onClose: onDeleteAllConfirmClose } = useDisclosure();
  const { isOpen: isMatchActionsOpen, onOpen: onMatchActionsOpen, onClose: onMatchActionsClose } = useDisclosure();
  const { isOpen: isMatchProcessOpen, onOpen: onMatchProcessOpen, onClose: onMatchProcessClose } = useDisclosure();
  const { importMatches } = useExcelImport();

  // Custom handlers for match process modal
  const handleMatchProcessOpen = () => {
    setMatchProcessStep(1); // Reset to first step
    onMatchProcessOpen();
  };

  const handleMatchProcessClose = () => {
    onMatchProcessClose();
    setMatchProcessStep(1); // Reset step when closing
  };

  // Reset matchToDelete when confirmation modal closes
  const handleDeleteConfirmClose = () => {
    onDeleteConfirmClose();
    setMatchToDelete(null);
  };

  // Toggle matchweek expansion
  const toggleMatchweek = (categoryId: string, matchweek: number) => {
    const key = `${categoryId}-${matchweek}`;
    setExpandedMatchweeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Check if matchweek is expanded
  const isMatchweekExpanded = (categoryId: string, matchweek: number) => {
    const key = `${categoryId}-${matchweek}`;
    return expandedMatchweeks.has(key);
  };

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    home_team_id: '',
    away_team_id: '',
    venue: '',
    category_id: '',
    season_id: '',
    matchweek: '',
    match_number: ''
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
    match_number: '',
    category_id: ''
  });

  const [bulkUpdateData, setBulkUpdateData] = useState({
    categoryId: '',
    matchweek: ''
  });

  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [expandedMatchweeks, setExpandedMatchweeks] = useState<Set<string>>(new Set());
  const [matchProcessStep, setMatchProcessStep] = useState<number>(1);

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
      console.log('🔍 Fetching standings...', {
        selectedCategory,
        selectedSeason
      });

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

      if (error) {
        console.error('❌ Error fetching standings:', error);
        throw error;
      }

      console.log('🔍 Standings fetched:', {
        standingsCount: data?.length || 0,
        standings: data
      });

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
      let { data: completedMatches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('season_id', selectedSeason)
        .eq('status', 'completed');

      if (matchesError) throw matchesError;

      // Note: We can generate standings even without completed matches
      if (!completedMatches) {
        completedMatches = [];
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

  // Smart standings function - generates or recalculates based on current state
  const handleStandingsAction = async () => {
    if (isSeasonClosed()) {
      setError('Nelze upravovat tabulku pro uzavřenou sezónu');
      return;
    }

    try {
      // Check if standings already exist for this category/season
      const existingStandings = standings.filter(s => 
        s.category_id === selectedCategory && s.season_id === selectedSeason
      );
      
      if (existingStandings.length === 0) {
        // No standings exist - generate initial ones
        await generateInitialStandings();
      } else {
        // Standings exist - recalculate them
        await calculateStandings();
      }
    } catch (error) {
      console.error('Error in standings action:', error);
    }
  };

  // Generate initial standings for teams without any matches
  const generateInitialStandings = async () => {
    if (isSeasonClosed()) {
      setError('Nelze generovat tabulku pro uzavřenou sezónu');
      return;
    }

    try {
      console.log('🔍 Starting initial standings generation...', {
        selectedCategory,
        selectedSeason
      });

      // Get teams for this category and season
      const { data: teamCategories, error: teamsError } = await supabase
        .from('team_categories')
        .select(`
          team_id,
          team:team_id(id, name, short_name)
        `)
        .eq('category_id', selectedCategory)
        .eq('season_id', selectedSeason)
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      console.log('🔍 Team categories found:', {
        teamCategoriesCount: teamCategories?.length || 0,
        teamCategories: teamCategories
      });

      if (!teamCategories || teamCategories.length === 0) {
        setError('Žádné týmy v této kategorii a sezóně');
        return;
      }

      // Check if standings already exist
      const { data: existingStandings, error: standingsError } = await supabase
        .from('standings')
        .select('id')
        .eq('category_id', selectedCategory)
        .eq('season_id', selectedSeason);

      if (standingsError) throw standingsError;

      console.log('🔍 Existing standings check:', {
        existingStandingsCount: existingStandings?.length || 0,
        existingStandings: existingStandings
      });

      // If standings already exist, don't overwrite them
      if (existingStandings && existingStandings.length > 0) {
        setError('Tabulka již existuje. Použijte "Přepočítat tabulku" pro aktualizaci.');
        return;
      }

      // Generate initial standings for all teams
      const initialStandings = teamCategories.map((tc: any, index: number) => ({
        team_id: tc.team_id,
        category_id: selectedCategory,
        season_id: selectedSeason,
        position: index + 1,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0
      }));

      console.log('🔍 Generated initial standings:', {
        initialStandingsCount: initialStandings.length,
        initialStandings: initialStandings
      });

      // Insert initial standings
      console.log('🔍 Attempting to insert standings...');
      
      // Try bulk insert first
      let { data: insertResult, error: insertError } = await supabase
        .from('standings')
        .insert(initialStandings)
        .select();

      if (insertError) {
        console.error('❌ Bulk insert failed, trying individual inserts...', insertError);
        
        // Fallback: Insert teams one by one
        const successfulInserts = [];
        const failedInserts = [];
        
        for (const standing of initialStandings) {
          try {
            const { data: singleResult, error: singleError } = await supabase
              .from('standings')
              .insert(standing)
              .select();
            
            if (singleError) {
              console.error(`❌ Failed to insert team ${standing.team_id}:`, singleError);
              failedInserts.push({ standing, error: singleError });
            } else {
              console.log(`✅ Successfully inserted team ${standing.team_id}:`, singleResult);
              successfulInserts.push(singleResult[0]);
            }
          } catch (singleError) {
            console.error(`❌ Exception inserting team ${standing.team_id}:`, singleError);
            failedInserts.push({ standing, error: singleError });
          }
        }
        
        console.log('🔍 Individual insert results:', {
          successfulInserts: successfulInserts.length,
          failedInserts: failedInserts.length,
          failedInsertDetails: failedInserts
        });
        
        if (successfulInserts.length === 0) {
          throw new Error(`Failed to insert any standings. ${failedInserts.length} failures.`);
        }
        
        // Use successful inserts as result
        insertResult = successfulInserts;
      }

      console.log('🔍 Final insert result:', {
        insertResultCount: insertResult?.length || 0,
        insertResultData: insertResult
      });

      // Refresh standings
      await fetchStandings();
      
      // Verify the standings were actually created
      const { data: verifyStandings, error: verifyError } = await supabase
        .from('standings')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('season_id', selectedSeason);

      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
      } else {
        console.log('🔍 Verification result:', {
          verifyStandingsCount: verifyStandings?.length || 0,
          verifyStandings: verifyStandings
        });
      }

      setError('');
    } catch (error) {
      console.error('❌ Error in generateInitialStandings:', error);
      setError(`Chyba při generování počáteční tabulky: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
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

      // Handle match_number - only add if provided
      if (formData.match_number && formData.match_number.trim()) {
        insertData.match_number = formData.match_number.trim();
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
        matchweek: '',
        match_number: ''
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

  // Delete all matches (after confirmation)
  const handleDeleteAllMatches = async () => {
    if (isSeasonClosed()) {
      setError('Nelze smazat zápasy z uzavřené sezóny');
      return;
    }

    try {
      // Delete all matches for the selected season
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('season_id', selectedSeason);

      if (error) throw error;
      
      fetchMatches();
      setError('');
      onDeleteAllConfirmClose();
      setSelectedCategory('');
    } catch (error) {
      setError('Chyba při mazání všech zápasů');
      console.error('Error deleting all matches:', error);
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
      match_number: match.match_number ? match.match_number.toString() : '',
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

      // Handle match_number - only add if provided
      if (editData.match_number && editData.match_number.trim()) {
        updateData.match_number = editData.match_number.trim();
      } else {
        updateData.match_number = null;
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
        match_number: '',
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
      options.push({ value: i.toString(), label: `${i}. kolo` });
    }
    return options;
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
    <div className="p-3 sm:p-4 lg:p-6">
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
        <div className="w-full max-w-md">
          <Select
            label={translations.season.title}
            placeholder={translations.season.selectSeason}
            selectedKeys={selectedSeason ? [selectedSeason] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              console.log('Season selection changed:', { keys, selectedKey });
              setSelectedSeason(selectedKey || "");
            }}
            className="w-full"
          >
            {seasons.map((season) => (
              <SelectItem key={season.id} textValue={season.name}>
                {season.name} {season.is_closed ? `(${translations.season.closed})` : ''}
              </SelectItem>
            ))}
          </Select>
          {seasons.length === 0 && (
            <p className="text-sm text-red-600 mt-1">
              {translations.season.noSeasons}
            </p>
          )}
        </div>
      </div>

      {selectedSeason && (
        <>


          <Card>
            <CardHeader className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div className="flex items-center justify-between w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">Zápasy</h2>
                </div>
                
                {/* Mobile: Show actions menu on same row as title */}
                <div className="lg:hidden">
                  <MobileActionsMenu
                    actions={[
                      {
                        key: 'add-match',
                        label: translations.matches.actions.addMatch,
                        description: translations.matches.actions.addMatchDescription,
                        color: 'primary',
                        variant: 'flat',
                        icon: <PlusIcon className="w-4 h-4" />,
                        onClick: onAddMatchOpen,
                        isDisabled: isSeasonClosed()
                      },
                      {
                        key: 'bulk-update',
                        label: translations.matches.actions.bulkUpdateMatchweek,
                        description: translations.matches.actions.bulkUpdateMatchweekDescription,
                        color: 'warning',
                        variant: 'flat',
                        icon: <ArrowPathIcon className="w-4 h-4" />,
                        onClick: onBulkUpdateOpen,
                        isDisabled: isSeasonClosed()
                      },
                      {
                        key: 'generate-standings',
                        label: standings.filter(s => s.season_id === selectedSeason).length === 0 
                          ? translations.matches.actions.generateStandings 
                          : translations.matches.actions.recalculateStandings,
                        description: standings.filter(s => s.season_id === selectedSeason).length === 0 
                          ? translations.matches.actions.generateStandingsDescription
                          : translations.matches.actions.recalculateStandingsDescription,
                        color: 'success',
                        variant: 'flat',
                        onClick: handleStandingsAction,
                        isDisabled: isSeasonClosed()
                      },
                      {
                        key: 'excel-import',
                        label: translations.matches.actions.import,
                        description: translations.matches.actions.importDescription,
                        color: 'secondary',
                        variant: 'flat',
                        icon: <DocumentArrowUpIcon className="w-4 h-4" />,
                        onClick: onExcelImportOpen
                      },
                      {
                        key: 'delete-all-matches',
                        label: translations.matches.actions.deleteAllMatches,
                        description: translations.matches.actions.deleteAllMatchesDescription,
                        color: 'danger',
                        variant: 'flat',
                        icon: <TrashIcon className="w-4 h-4" />,
                        onClick: onDeleteAllConfirmOpen,
                        isDisabled: isSeasonClosed() || !selectedSeason
                      }
                    ]}
                    description="Vyberte akci, kterou chcete provést se zápasy"
                    triggerColor="primary"
                    triggerVariant="light"
                    className="w-auto"
                  />
                </div>
              </div>
              
              {/* Desktop: Show all buttons horizontally */}
              <div className="hidden lg:flex flex-wrap gap-2">
                <Button 
                  color="primary" 
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={onAddMatchOpen}
                  isDisabled={isSeasonClosed()}
                  size="sm"
                >
                  {translations.matches.actions.addMatch}
                </Button>
                <Button 
                  color="warning" 
                  startContent={<ArrowPathIcon className="w-4 h-4" />}
                  onPress={onBulkUpdateOpen}
                  isDisabled={isSeasonClosed()}
                  size="sm"
                >
                  {translations.matches.actions.bulkUpdateMatchweek}
                </Button>
                <Button 
                  color="success" 
                  onPress={handleStandingsAction}
                  isDisabled={isSeasonClosed()}
                  size="sm"
                >
                  {standings.filter(s => s.category_id === selectedCategory && s.season_id === selectedSeason).length === 0 
                    ? translations.matches.actions.generateStandings 
                    : translations.matches.actions.recalculateStandings
                  }
                </Button>
                <Button 
                  color="secondary" 
                  startContent={<DocumentArrowUpIcon className="w-4 h-4" />}
                  onPress={onExcelImportOpen}
                  size="sm"
                >
                  {translations.matches.actions.import}
                </Button>
                <Button 
                  color="danger" 
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={onDeleteAllConfirmOpen}
                  isDisabled={isSeasonClosed() || !selectedSeason}
                  size="sm"
                >
                  {translations.matches.actions.deleteAllMatches}
                </Button>
              </div>
              

            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-8">{translations.loading}</div>
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
                            
                            // Sort matches within each matchweek by match_number
                            sortedMatchweeks.forEach(matchweek => {
                              const weekMatches = groupedMatches.get(matchweek)!;
                              weekMatches.sort((a, b) => {
                                // If both have match numbers, sort numerically
                                if (a.match_number && b.match_number) {
                                  const aNum = a.match_number;
                                  const bNum = b.match_number;
                                  return aNum - bNum;
                                }
                                // If only one has match number, prioritize the one with number
                                if (a.match_number && !b.match_number) return -1;
                                if (!a.match_number && b.match_number) return 1;
                                // If neither has match number, maintain original order
                                return 0;
                              });
                            });
                            
                            return sortedMatchweeks.map(matchweek => {
                              const weekMatches = groupedMatches.get(matchweek)!;
                              const weekTitle = matchweek === 0 ? 'Bez kola' : `${matchweek}. kolo`;
                              
                              return (
                                <div key={matchweek} className="border rounded-lg p-4 bg-gray-50">
                                  <div 
                                    className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer hover:bg-gray-100 transition-colors rounded p-2" 
                                    onClick={() => toggleMatchweek(category.id, matchweek)}
                                  >
                                    <h4 className="text-lg font-semibold text-gray-800">
                                      {weekTitle} ({weekMatches.length} zápas{weekMatches.length !== 1 ? 'ů' : ''})
                                    </h4>
                                    <div className="text-gray-600">
                                      {isMatchweekExpanded(category.id, matchweek) ? 
                                        <ChevronDownIcon className="w-4 h-4" /> : 
                                        <ChevronUpIcon className="w-4 h-4" />
                                      }
                                    </div>
                                  </div>
                                  
                                  {/* Collapsible Content */}
                                  {isMatchweekExpanded(category.id, matchweek) && (
                                    <>
                                      {/* Column Headers - Desktop only */}
                                      <div className="hidden lg:grid grid-cols-11 gap-4 mb-3 px-2 items-center">
                                        <div className="col-span-1 text-center text-sm font-medium text-gray-600">{translations.matches.matchNumber}</div>
                                        <div className="col-span-2 text-center text-sm font-medium text-gray-600">{translations.matches.matchDateTime}</div>
                                        <div className="col-span-6 text-start text-sm font-medium text-gray-600">{translations.matches.matchLocation}</div>
                                        <div className="col-span-2 text-center text-sm font-medium text-gray-600">{translations.matches.matchScore}</div>
                                      </div>
                                      
                                      <div className="space-y-3">
                                                                        {weekMatches.map((match) => (
                                      <div key={match.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                                        setSelectedMatch(match);
                                        onMatchActionsOpen();
                                      }}>
                                        {/* Desktop: Grid layout */}
                                        <div className="hidden lg:grid grid-cols-11 gap-4 items-center">
                                          {/* Match Number - First Column */}
                                          <div className="col-span-1">
                                            {match.match_number ? (
                                              <div className="text-center">
                                                <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                                  #{match.match_number}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="text-center">
                                                <div className="text-sm text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                                                  -
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Date and Time - Second Column */}
                                          <div className="col-span-2">
                                            <div className="text-center">
                                              <div className="text-sm text-gray-600 mb-1">
                                                {new Date(match.date).toLocaleDateString('cs-CZ')}
                                              </div>
                                              <div className="text-lg font-semibold text-gray-800">
                                                {match.time}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Teams and Venue - Third Column */}
                                          <div className="col-span-6">
                                            <div className="text-start">
                                              <div className="text-lg font-semibold text-gray-800 mb-2">
                                                {match.home_team?.name || 'Neznámý tým'} vs {match.away_team?.name || 'Neznámý tým'}
                                              </div>
                                              <div className="flex items-start space-x-2 text-sm text-gray-600">
                                                <MapPinIcon className="w-4 h-4 text-gray-400" />
                                                <span>{match.venue}</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Score - Fourth Column */}
                                          <div className="col-span-2">
                                            <div className="text-center">
                                              {match.status === 'completed' ? (
                                                <div className="text-2xl font-bold text-gray-800">
                                                  {match.home_score} : {match.away_score}
                                                </div>
                                              ) : (
                                                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                                  Skóre zatím není k dispozici
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Mobile: Stacked layout */}
                                        <div className="lg:hidden space-y-3">
                                          {/* Match Number */}
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">Číslo zápasu:</span>
                                            {match.match_number ? (
                                              <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                                #{match.match_number}
                                              </div>
                                            ) : (
                                              <div className="text-sm text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                                                -
                                              </div>
                                            )}
                                          </div>

                                          {/* Date and Time */}
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">Datum a čas:</span>
                                            <div className="text-right">
                                              <div className="text-sm text-gray-600">
                                                {new Date(match.date).toLocaleDateString('cs-CZ')}
                                              </div>
                                              <div className="text-lg font-semibold text-gray-800">
                                                {match.time}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Teams */}
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">Týmy:</span>
                                            <div className="text-right">
                                              <div className="text-lg font-semibold text-gray-800">
                                                {match.home_team?.name || 'Neznámý tým'} vs {match.away_team?.name || 'Neznámý tým'}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Venue */}
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">Místo:</span>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                              <MapPinIcon className="w-4 h-4 text-gray-400" />
                                              <span>{match.venue}</span>
                                            </div>
                                          </div>

                                          {/* Score */}
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">Skóre:</span>
                                            <div className="text-right">
                                              {match.status === 'completed' ? (
                                                <div className="text-xl font-bold text-gray-800">
                                                  {match.home_score} : {match.away_score}
                                                </div>
                                              ) : (
                                                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                                  Skóre zatím není k dispozici
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action indicator - Show that card is clickable */}
                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                          <div className="text-center">
                                            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                                              <span>Klikněte pro akce</span>
                                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                      </div>
                                      
                                      {/* Zone Actions - Below the matches list */}
                                      <div className="mt-6 pt-4 border-t border-gray-200">
                                        <div className="flex flex-wrap gap-2 justify-center">
                                          <Button
                                            size="sm"
                                            color="primary"
                                            variant="flat"
                                            startContent={<PlusIcon className="w-4 h-4" />}
                                            onPress={onAddMatchOpen}
                                            isDisabled={isSeasonClosed()}
                                          >
                                            Přidat zápas
                                          </Button>
                                          <Button
                                            size="sm"
                                            color="warning"
                                            variant="flat"
                                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                                            onPress={onBulkUpdateOpen}
                                            isDisabled={isSeasonClosed()}
                                          >
                                            Úprava kol
                                          </Button>
                                          <Button
                                            size="sm"
                                            color="success"
                                            variant="flat"
                                            onPress={handleStandingsAction}
                                            isDisabled={isSeasonClosed()}
                                          >
                                            {standings.filter(s => s.category_id === category.id && s.season_id === selectedSeason).length === 0 
                                              ? 'Generovat tabulku' 
                                              : 'Přepočítat tabulku'
                                            }
                                          </Button>
                                          <Button
                                            size="sm"
                                            color="secondary"
                                            variant="flat"
                                            startContent={<DocumentArrowUpIcon className="w-4 h-4" />}
                                            onPress={onExcelImportOpen}
                                          >
                                            Import
                                          </Button>
                                          <Button
                                            size="sm"
                                            color="danger"
                                            variant="flat"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            onPress={onDeleteAllConfirmOpen}
                                            isDisabled={isSeasonClosed() || !selectedSeason}
                                          >
                                            Smazat vše
                                          </Button>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Standings for this category */}
                        <div className="mt-8">
                          <h4 className="text-lg font-semibold mb-4">Tabulka - {category.name}</h4>
                          
                          {standings.filter(standing => standing.category_id === category.id).length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <div className="text-gray-500 mb-4">
                                <TrophyIcon className="w-12 h-12 mx-auto text-gray-400" />
                              </div>
                              <h5 className="text-lg font-medium text-gray-700 mb-2">Žádná tabulka</h5>
                              <p className="text-gray-500 mb-4">
                                Pro tuto kategorii ještě nebyla vygenerována tabulka.
                              </p>
                              <Button
                                color="secondary"
                                size="sm"
                                onPress={handleStandingsAction}
                                isDisabled={isSeasonClosed()}
                              >
                                {standings.filter(s => s.category_id === selectedCategory && s.season_id === selectedSeason).length === 0 
                                  ? 'Generovat tabulku' 
                                  : 'Přepočítat tabulku'
                                }
                              </Button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                              <div className="min-w-full inline-block align-middle">
                                <div className="overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pozice</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tým</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Z</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">V</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">R</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Skóre</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Body</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {standings
                                    .filter(standing => standing.category_id === category.id)
                                    .map((standing, index) => (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                                        <td className="px-3 py-4 whitespace-nowrap">
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
                                            <span className="text-sm text-gray-900">{standing.team?.name || 'N/A'}</span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.matches}</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.wins}</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.draws}</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.losses}</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.goals_for}:{standing.goals_against}</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">{standing.points}</td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                                </div>
                              </div>
                            </div>
                          )}
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
      <AddMatchModal
        isOpen={isAddMatchOpen}
        onClose={onAddMatchClose}
        onAddMatch={handleAddMatch}
        formData={formData}
        setFormData={setFormData}
        filteredTeams={filteredTeams}
        selectedCategory={selectedCategory}
        selectedSeason={selectedSeason}
        getMatchweekOptions={getMatchweekOptions}
      />

      {/* Add Result Modal */}
      <AddResultModal
        isOpen={isAddResultOpen}
        onClose={onAddResultClose}
        selectedMatch={selectedMatch}
        resultData={resultData}
        onResultDataChange={setResultData}
        onUpdateResult={handleUpdateResult}
        isSeasonClosed={isSeasonClosed()}
      />

      {/* Edit Match Modal */}
      <EditMatchModal
        isOpen={isEditMatchOpen}
        onClose={onEditMatchClose}
        selectedMatch={selectedMatch}
        editData={editData}
        onEditDataChange={setEditData}
        onUpdateMatch={handleUpdateMatch}
        teams={teams}
        getMatchweekOptions={getMatchweekOptions}
        isSeasonClosed={isSeasonClosed()}
      />

      {/* Bulk Update Matchweek Modal */}
      <BulkUpdateMatchweekModal
        isOpen={isBulkUpdateOpen}
        onClose={onBulkUpdateClose}
        bulkUpdateData={bulkUpdateData}
        onBulkUpdateDataChange={setBulkUpdateData}
        onBulkUpdate={handleBulkUpdateMatchweek}
        categories={categories}
        matches={matches}
        getMatchweekOptions={getMatchweekOptions}
        isSeasonClosed={isSeasonClosed()}
      />

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
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteMatch}
        title="Potvrdit smazání zápasu"
        message={`
          Opravdu chcete smazat zápas <strong>${matchToDelete?.home_team?.name || 'Domácí tým'} vs ${matchToDelete?.away_team?.name || 'Hostující tým'}</strong> ze dne ${matchToDelete?.date}?<br><br>
          <span class="text-sm text-gray-600">Tato akce je nevratná a smaže všechny související údaje o zápasu.</span>
        `}
      />

      {/* Match Actions Modal */}
      <Modal isOpen={isMatchActionsOpen} onClose={onMatchActionsClose} size="sm">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold">Akce pro zápas</h3>
            </div>
          </ModalHeader>
          <ModalBody className="px-4 py-4">
            <div className="space-y-2">
              {selectedMatch?.status === 'upcoming' && (
                <Button
                  color="primary"
                  variant="light"
                  size="lg"
                  startContent={<EyeIcon className="w-4 h-4" />}
                  onPress={() => {
                    onMatchActionsClose();
                    onAddResultOpen();
                  }}
                  className="w-full justify-start h-auto py-3 px-4"
                  isDisabled={isSeasonClosed()}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Přidat výsledek</span>
                    <span className="text-xs text-gray-500 mt-1">Zadat výsledek zápasu</span>
                  </div>
                </Button>
              )}
              
              <Button
                color="warning"
                variant="light"
                size="lg"
                startContent={<PencilIcon className="w-4 h-4" />}
                onPress={() => {
                  onMatchActionsClose();
                  handleEditMatch(selectedMatch!);
                }}
                className="w-full justify-start h-auto py-3 px-4"
                isDisabled={isSeasonClosed()}
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Upravit zápas</span>
                  <span className="text-xs text-gray-500 mt-1">Upravit informace o zápasu</span>
                </div>
              </Button>
              
              <Button
                color="secondary"
                variant="light"
                size="lg"
                startContent={<UserGroupIcon className="w-4 h-4" />}
                onPress={() => {
                  onMatchActionsClose();
                  onLineupModalOpen();
                }}
                className="w-full justify-start h-auto py-3 px-4"
                isDisabled={isSeasonClosed()}
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Správa sestav</span>
                  <span className="text-xs text-gray-500 mt-1">Spravovat sestavy týmů</span>
                </div>
              </Button>
              
              <Button
                color="danger"
                variant="light"
                size="lg"
                startContent={<TrashIcon className="w-4 h-4" />}
                onPress={() => {
                  onMatchActionsClose();
                  handleDeleteClick(selectedMatch!);
                }}
                className="w-full justify-start h-auto py-3 px-4"
                isDisabled={isSeasonClosed()}
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-left">
                    <span className="font-medium">Smazat zápas</span>
                    <span className="text-xs text-gray-500 mt-1 block">Trvale smazat zápas</span>
                  </span>
                </div>
              </Button>
              
              <Button
                color="success"
                variant="light"
                size="lg"
                startContent={<DocumentIcon className="w-4 h-4" />}
                onPress={() => {
                  onMatchActionsClose();
                  handleMatchProcessOpen();
                }}
                className="w-full justify-start h-auto py-3 px-4"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Kompletní proces</span>
                  <span className="text-xs text-gray-500 mt-1">Výsledek, fotky, článek</span>
                </div>
              </Button>
            </div>
          </ModalBody>
          <ModalFooter className="px-4 py-4">
            <Button
              color="default"
              variant="light"
              onPress={onMatchActionsClose}
              className="w-full"
            >
              Zavřít
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Match Process Wizard Modal */}
      <Modal isOpen={isMatchProcessOpen} onClose={handleMatchProcessClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-semibold">Kompletní proces zápasu</h3>
            </div>
          </ModalHeader>
          <ModalBody className="px-4 py-4">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Krok {matchProcessStep} z 5</span>
                <span className="text-sm text-gray-500">{Math.round((matchProcessStep / 5) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(matchProcessStep / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step Content */}
            {matchProcessStep === 1 && (
              <div className="border rounded-lg p-6 bg-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold">1</div>
                  <h4 className="text-xl font-semibold text-blue-800">Výsledek zápasu</h4>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Domácí tým</label>
                    <div className="text-xl font-bold text-gray-900">{selectedMatch?.home_team?.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hostující tým</label>
                    <div className="text-xl font-bold text-gray-900">{selectedMatch?.away_team?.name}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skóre domácího</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skóre hostujícího</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {matchProcessStep === 2 && (
              <div className="border rounded-lg p-6 bg-yellow-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-500 text-white rounded-full flex items-center justify-center text-lg font-bold">2</div>
                  <h4 className="text-xl font-semibold text-yellow-800">Fotka dokumentu zápasu</h4>
                </div>
                <div className="text-center">
                  <div className="border-2 border-dashed border-yellow-300 rounded-lg p-12 bg-yellow-100">
                    <div className="text-yellow-600 mb-3">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-yellow-700 font-medium text-lg mb-2">Klikněte pro pořízení fotky</p>
                    <p className="text-yellow-600">nebo přetáhněte soubor</p>
                  </div>
                </div>
              </div>
            )}

            {matchProcessStep === 3 && (
              <div className="border rounded-lg p-6 bg-green-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold">3</div>
                  <h4 className="text-xl font-semibold text-green-800">Fotky ze zápasu</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-100 text-center hover:bg-green-200 transition-colors cursor-pointer">
                      <div className="text-green-600 mb-2">
                        <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-green-700 font-medium">Fotka {i}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchProcessStep === 4 && (
              <div className="border rounded-lg p-6 bg-purple-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center text-lg font-bold">4</div>
                  <h4 className="text-xl font-semibold text-purple-800">Článek o zápasu</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nadpis článku</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                      placeholder="Nadpis článku o zápasu..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Obsah článku</label>
                    <textarea 
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                      placeholder="Popis zápasu, zajímavé momenty, výsledek..."
                    />
                  </div>
                </div>
              </div>
            )}

            {matchProcessStep === 5 && (
              <div className="border rounded-lg p-6 bg-orange-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center text-lg font-bold">5</div>
                  <h4 className="text-xl font-semibold text-orange-800">Distribuce příspěvku</h4>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">Vyberte, kde chcete zveřejnit obsah o zápasu:</p>
                  
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors">
                      <input type="checkbox" className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                      <div className="ml-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-600 rounded"></div>
                          <span className="font-medium text-gray-900">Web stránka</span>
                        </div>
                        <p className="text-sm text-gray-500">Publikovat článek na hlavní web stránce</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors">
                      <input type="checkbox" className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                      <div className="ml-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                          <span className="font-medium text-gray-900">Instagram</span>
                        </div>
                        <p className="text-sm text-gray-500">Sdílet na Instagram s fotkami ze zápasu</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors">
                      <input type="checkbox" className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                      <div className="ml-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-600 rounded"></div>
                          <span className="font-medium text-gray-900">Facebook</span>
                        </div>
                        <p className="text-sm text-gray-500">Publikovat na Facebook stránce klubu</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors">
                      <input type="checkbox" className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                      <div className="ml-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-600 rounded"></div>
                          <span className="font-medium text-gray-900">WhatsApp skupina</span>
                        </div>
                        <p className="text-sm text-gray-500">Poslat do WhatsApp skupiny členů</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="px-4 py-4">
            <div className="flex gap-3 w-full">
              {matchProcessStep > 1 && (
                <Button
                  color="default"
                  variant="light"
                  onPress={() => setMatchProcessStep(prev => prev - 1)}
                  className="flex-1"
                >
                  ← Zpět
                </Button>
              )}
              
              {matchProcessStep < 5 ? (
                <Button
                  color="primary"
                  variant="solid"
                  onPress={() => setMatchProcessStep(prev => prev + 1)}
                  className="flex-1"
                >
                  Další →
                </Button>
              ) : (
                <Button
                  color="success"
                  variant="solid"
                  onPress={() => {
                    // Mock: Show success message
                    alert('Proces dokončen! (Mock implementace)');
                    handleMatchProcessClose();
                  }}
                  className="flex-1"
                >
                  Dokončit proces
                </Button>
              )}
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete All Matches Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteAllConfirmOpen}
        onClose={onDeleteAllConfirmClose}
        onConfirm={handleDeleteAllMatches}
        title="Potvrdit smazání všech zápasů"
        message={`
          <div class="space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-center space-x-2">
                <span class="font-semibold text-red-800">⚠️ Varování!</span>
              </div>
              <p class="text-red-700 mt-2">
                Tato akce smaže <strong>VŠECHNY</strong> zápasy pro vybranou sezónu.
              </div>
            
            <div class="space-y-2">
              <p>
                Opravdu chcete smazat všechny zápasy pro sezónu <strong>${seasons.find(s => s.id === selectedSeason)?.name || 'Neznámá sezóna'}</strong>?
              </p>
              <p class="text-sm text-gray-600">
                Tato akce je <strong>nevratná</strong> a smaže:
              </p>
              <ul class="text-sm text-gray-600 list-disc list-inside ml-4 space-y-1">
                <li>Všechny zápasy v této sezóně</li>
                <li>Všechny výsledky a skóre</li>
                <li>Všechny sestavy a lineupy</li>
                <li>Všechny související údaje</li>
              </ul>
              <p class="text-sm text-gray-600 mt-2">
                <strong>Počet zápasů k smazání:</strong> ${matches.length}
              </p>
            </div>
          </div>
        `}
      />
      
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
