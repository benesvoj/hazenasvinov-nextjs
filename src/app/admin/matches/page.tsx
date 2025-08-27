'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/react";
import { useDisclosure } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { 
  TrophyIcon,
  PlusIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";
import { AddMatchModal, AddResultModal, EditMatchModal, BulkUpdateMatchweekModal, ExcelImportModal, MatchActionsModal, MatchProcessWizardModal, LineupManagerModal, StandingsTable, CategoryMatches } from './components';
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
    matchweek: '',
    action: 'set' as 'set' | 'remove'
  });

  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [expandedMatchweeks, setExpandedMatchweeks] = useState<Set<string>>(new Set());


  const supabase = createClient();

    // Fetch teams assigned to selected category and season
  const fetchFilteredTeams = useCallback(async (categoryId: string, seasonId: string) => {
    if (!categoryId || !seasonId) {
      setFilteredTeams([]);
      return;
    }

    try {
      console.log('🔍 Fetching teams for category:', categoryId, 'season:', seasonId);
      
      const { data, error } = await supabase
        .from('club_categories')
        .select(`
          club_id,
          club:clubs(
            id,
            name,
            short_name,
            logo_url,
            venue
          ),
          club_category_teams(
            id,
            team_suffix,
            is_active
          )
        `)
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error fetching club categories:', error);
        setFilteredTeams([]);
        return;
      }

      console.log('✅ Club categories data:', data);
      
      const teamsData = data?.flatMap((item: any) => {
        // Check if this club has multiple teams in this category
        const teamCount = item.club_category_teams?.length || 0;
        
        return item.club_category_teams?.map((ct: any) => {
          // Only show suffix if club has multiple teams in this category
          const shouldShowSuffix = teamCount > 1;
          const displayName = shouldShowSuffix 
            ? `${item.club.name} ${ct.team_suffix}`
            : item.club.name;
          
          return {
            id: ct.id,
            name: displayName,
            club_id: item.club.id,
            club_name: item.club.name,
            team_suffix: ct.team_suffix,
            display_name: displayName,
            is_active: ct.is_active,
            venue: item.club.venue
          };
        }) || [];
      }) || [];

      console.log('🔄 Transformed teams data:', teamsData);
      setFilteredTeams(teamsData);
    } catch (error) {
      console.error('❌ Error fetching filtered teams:', error);
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
      console.log('🔍 Fetching matches...', { selectedCategory, selectedSeason });
      
      let query = supabase
        .from('matches')
        .select(`
          *,
          home_team:club_category_teams!home_team_id(
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url)
            )
          ),
          away_team:club_category_teams!away_team_id(
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url)
            )
          ),
          category:categories(name),
          season:seasons(name)
        `)
        .order('date', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedSeason) {
        query = query.eq('season_id', selectedSeason);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase error in fetchMatches:', error);
        throw error;
      }
      
      console.log('✅ Raw matches data:', data);

      // First, get team counts for all clubs in this category to avoid async calls in map
      const getTeamCountsForCategory = async () => {
        if (!selectedCategory) return new Map();
        
        try {
          const { data: clubCategoryData, error } = await supabase
            .from('club_categories')
            .select(`
              club_id,
              club_category_teams(id)
            `)
            .eq('category_id', selectedCategory)
            .eq('is_active', true);
          
          if (error) {
            console.error('Error fetching club category teams:', error);
            return new Map();
          }
          
          const teamCounts = new Map<string, number>();
          clubCategoryData?.forEach((cc: any) => {
            teamCounts.set(cc.club_id, cc.club_category_teams?.length || 0);
          });
          
          return teamCounts;
        } catch (error) {
          console.error('Error fetching team counts:', error);
          return new Map();
        }
      };

      // Get team counts first
      const teamCounts = await getTeamCountsForCategory();
      
      // Enhance matches with club information and apply smart suffix logic
      const enhancedMatches = (data || []).map((match: any) => {
        const homeTeam = match.home_team;
        const awayTeam = match.away_team;

        // Get club information for smart suffix logic
        const homeClubId = homeTeam?.club_category?.club?.id;
        const awayClubId = awayTeam?.club_category?.club?.id;

        // Get team counts from the pre-fetched data
        const homeClubTeamCount = homeClubId ? (teamCounts.get(homeClubId) || 0) : 0;
        const awayClubTeamCount = awayClubId ? (teamCounts.get(awayClubId) || 0) : 0;

        // Apply smart suffix logic
        const getDisplayName = (team: any, clubTeamCount: number) => {
          if (!team?.club_category?.club) return 'Neznámý tým';
          
          const clubName = team.club_category.club.name;
          const teamSuffix = team.team_suffix || 'A';
          
          // Only show suffix if club has multiple teams in this category
          const displayName = clubTeamCount > 1 ? `${clubName} ${teamSuffix}` : clubName;
          
          console.log(`Team ${team.id}: Club "${clubName}" has ${clubTeamCount} teams in category ${selectedCategory} -> Display: "${displayName}"`);
          
          return displayName;
        };

        return {
          ...match,
          home_team: {
            ...homeTeam,
            club_id: homeClubId || null,
            club_name: homeTeam?.club_category?.club?.name || 'Neznámý klub',
            team_suffix: homeTeam?.team_suffix || 'A',
            display_name: getDisplayName(homeTeam, homeClubTeamCount)
          },
          away_team: {
            ...awayTeam,
            club_id: awayClubId || null,
            club_name: awayTeam?.club_category?.club?.name || 'Neznámý klub',
            team_suffix: awayTeam?.team_suffix || 'A',
            display_name: getDisplayName(awayTeam, awayClubTeamCount)
          }
        };
      });
      
      console.log('🔄 Enhanced matches:', enhancedMatches);

      setMatches(enhancedMatches);
    } catch (error) {
      setError('Chyba při načítání zápasů');
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedCategory, selectedSeason]);


  // TODO: extract to separate file
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
          team:club_category_teams(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url)
            )
          )
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

      // Enhance standings with club information
      const enhancedStandings = (data || []).map((standing: any) => {
        const team = standing.team;
        
        return {
          ...standing,
          team: team ? {
            ...team,
            team_suffix: team.team_suffix || 'A',
            club_name: team.club_category?.club?.name || 'Neznámý klub',
            club_id: team.club_category?.club?.id || null
          } : null,
          // Add club information for backward compatibility
          club: team?.club_category?.club ? {
            id: team.club_category.club.id,
            name: team.club_category.club.name,
            short_name: team.club_category.club.short_name,
            logo_url: team.club_category.club.logo_url
          } : null
        };
      });

      console.log('🔍 Standings fetched:', {
        standingsCount: enhancedStandings.length,
        standings: enhancedStandings,
        rawData: data
      });
      
      // Debug: Check if standings have team data
      enhancedStandings.forEach((standing: any, index: number) => {
        console.log(`🔍 Standing ${index}:`, {
          id: standing.id,
          team_id: standing.team_id,
          team: standing.team,
          club: standing.club,
          category_id: standing.category_id,
          season_id: standing.season_id
        });
      });

      setStandings(enhancedStandings);
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




  // TODO: extract to utils/supabase/calculateStandings.ts
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
      let teamCategories;
      let teamsError;

      // Try club_categories first, fallback to team_categories
      try {
        const clubResult = await supabase
          .from('club_categories')
          .select(`
            club_id,
            club:clubs(
              id,
              name
            ),
            club_category_teams(
              id,
              team_suffix
            )
          `)
          .eq('category_id', selectedCategory)
          .eq('season_id', selectedSeason)
          .eq('is_active', true);

        if (clubResult.data && clubResult.data.length > 0) {
          // New club-based system
          teamCategories = clubResult.data.flatMap((cc: any) => 
            cc.club_category_teams?.map((ct: any) => ({
              team_id: ct.id,
              club_id: cc.club_id
            })) || []
          );
        } else {
          // Fallback to old system
          const fallbackResult = await supabase
            .from('team_categories')
            .select('team_id')
            .eq('category_id', selectedCategory)
            .eq('season_id', selectedSeason)
            .eq('is_active', true);
          
          if (fallbackResult.error) throw fallbackResult.error;
          teamCategories = fallbackResult.data;
        }
      } catch (error) {
        teamsError = error;
      }

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
          club_id: tc.club_id,
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

  // TODO: extract to utils/supabase/generateInitialStandings.ts
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
      let teamCategories;
      let teamsError;

      // Try club_categories first, fallback to team_categories
      try {
        const clubResult = await supabase
          .from('club_categories')
          .select(`
            club_id,
            club:clubs(
              id,
              name
            ),
            club_category_teams(
              id,
              team_suffix
            )
          `)
          .eq('category_id', selectedCategory)
          .eq('season_id', selectedSeason)
          .eq('is_active', true);

        if (clubResult.data && clubResult.data.length > 0) {
          // New club-based system
          teamCategories = clubResult.data.flatMap((cc: any) => {
            // Check if this club has multiple teams in this category
            const teamCount = cc.club_category_teams?.length || 0;
            
            return cc.club_category_teams?.map((ct: any) => {
              // Only show suffix if club has multiple teams in this category
              const shouldShowSuffix = teamCount > 1;
              const displayName = shouldShowSuffix 
                ? `${cc.club.name} ${ct.team_suffix}`
                : cc.club.name;
              
              return {
                team_id: ct.id,
                club_id: cc.club_id,
                team: { id: ct.id, name: displayName }
              };
            }) || [];
          });
        } else {
          // Fallback to old system
          const fallbackResult = await supabase
            .from('team_categories')
            .select(`
              team_id,
              team:team_id(id, name, short_name)
            `)
            .eq('category_id', selectedCategory)
            .eq('season_id', selectedSeason)
            .eq('is_active', true);
          
          if (fallbackResult.error) throw fallbackResult.error;
          teamCategories = fallbackResult.data;
        }
      } catch (error) {
        teamsError = error;
      }

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
        club_id: tc.club_id,
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

  // Check and fix standings data integrity
  const checkStandingsIntegrity = useCallback(async () => {
    try {
      console.log('🔍 Checking standings data integrity...');
      
      const { data: standingsData, error: standingsError } = await supabase
        .from('standings')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('season_id', selectedSeason);

      if (standingsError) throw standingsError;

      if (!standingsData || standingsData.length === 0) {
        console.log('ℹ️ No standings found for this category/season');
        return;
      }

      console.log('🔍 Found standings:', standingsData.length);
      
      // Check if standings have valid team relationships
      const { data: validTeams, error: teamsError } = await supabase
        .from('club_category_teams')
        .select('id')
        .in('id', standingsData.map((s: any) => s.team_id).filter(Boolean));

      if (teamsError) throw teamsError;

      const validTeamIds = new Set(validTeams?.map((t: any) => t.id) || []);
      const invalidStandings = standingsData.filter((s: any) => !validTeamIds.has(s.team_id));

      if (invalidStandings.length > 0) {
        console.log('⚠️ Found invalid standings:', invalidStandings.length);
        console.log('⚠️ Invalid team IDs:', invalidStandings.map((s: any) => s.team_id));
        
        // Delete invalid standings
        const { error: deleteError } = await supabase
          .from('standings')
          .delete()
          .in('id', invalidStandings.map((s: any) => s.id));
        
        if (deleteError) {
          console.error('❌ Error deleting invalid standings:', deleteError);
        } else {
          console.log('✅ Deleted invalid standings, regenerating...');
          // Regenerate standings
          await generateInitialStandings();
        }
      } else {
        console.log('✅ All standings have valid team relationships');
      }
    } catch (error) {
      console.error('❌ Error checking standings integrity:', error);
    }
  }, [supabase, selectedCategory, selectedSeason, generateInitialStandings]);

  // Check and fix matches data integrity
  const checkMatchesIntegrity = useCallback(async () => {
    try {
      console.log('🔍 Checking matches data integrity...');
      
      if (!selectedCategory || !selectedSeason) {
        console.log('⚠️ No category or season selected');
        return;
      }

      // Check if filteredTeams is properly loaded
      console.log('🔍 Current filteredTeams state:', {
        count: filteredTeams.length,
        teams: filteredTeams.map(t => ({ id: t.id, name: t.name, club_id: t.club_id }))
      });

      // Check if matches have valid team references
      const categoryMatches = matches.filter(m => m.category_id === selectedCategory);
      console.log('🔍 Matches for category:', {
        categoryId: selectedCategory,
        matchCount: categoryMatches.length,
        matches: categoryMatches.map(m => ({
          id: m.id,
          home_team_id: m.home_team_id,
          away_team_id: m.away_team_id,
          home_team_name: m.home_team?.display_name || 'N/A',
          away_team_name: m.away_team?.display_name || 'N/A'
        }))
      });

      // Check if team IDs in matches exist in filteredTeams
      const validTeamIds = new Set(filteredTeams.map(t => t.id));
      const invalidMatches = categoryMatches.filter(m => 
        !validTeamIds.has(m.home_team_id) || !validTeamIds.has(m.away_team_id)
      );

      if (invalidMatches.length > 0) {
        console.log('⚠️ Found matches with invalid team references:', invalidMatches.length);
        console.log('⚠️ Invalid matches:', invalidMatches);
        
        // Check if these are old team IDs that need migration
        console.log('🔍 Checking if these are old team IDs that need migration...');
        
        // Get all old team IDs from the matches
        const oldTeamIds = new Set([
          ...invalidMatches.map(m => m.home_team_id),
          ...invalidMatches.map(m => m.away_team_id)
        ].filter(Boolean));
        
        console.log('🔍 Old team IDs found:', Array.from(oldTeamIds));
        
        // Check if these IDs exist in the old teams table
        const { data: oldTeams, error: oldTeamsError } = await supabase
          .from('teams')
          .select('id, name')
          .in('id', Array.from(oldTeamIds));
        
        if (oldTeamsError) {
          console.error('❌ Error checking old teams:', oldTeamsError);
        } else if (oldTeams && oldTeams.length > 0) {
          console.log('✅ Found old teams that need migration:', oldTeams);
          
          // This confirms we have old team IDs that need to be migrated
          console.log('⚠️ Database inconsistency detected: matches still reference old team IDs');
          console.log('⚠️ You need to run the team ID migration script to fix this');
          
          // Show user-friendly error
          setError('Nalezena nekonzistence v databázi: zápasy stále odkazují na staré ID týmů. Spusťte skript pro migraci týmů.');
        } else {
          console.log('ℹ️ No old teams found, these might be completely invalid IDs');
        }
        
        // Force refresh of filtered teams
        console.log('🔄 Forcing refresh of filtered teams...');
        await fetchFilteredTeams(selectedCategory, selectedSeason);
        
        // Also refresh matches
        console.log('🔄 Refreshing matches...');
        await fetchMatches();
      } else {
        console.log('✅ All matches have valid team references');
      }

      // Check if filteredTeams is now properly loaded
      console.log('🔍 After integrity check - filteredTeams:', {
        count: filteredTeams.length,
        teams: filteredTeams.map(t => ({ id: t.id, name: t.name, club_id: t.club_id }))
      });

    } catch (error) {
      console.error('❌ Error checking matches integrity:', error);
    }
  }, [supabase, selectedCategory, selectedSeason, matches, filteredTeams, fetchFilteredTeams, fetchMatches]);

  // Comprehensive database migration check
  const checkDatabaseMigration = useCallback(async () => {
    try {
      console.log('🔍 Checking database migration status...');
      
      // Check if old teams table still has data
      const { data: oldTeams, error: oldTeamsError } = await supabase
        .from('teams')
        .select('id, name')
        .limit(10);
      
      if (oldTeamsError) {
        console.error('❌ Error checking old teams table:', oldTeamsError);
      } else {
        console.log('🔍 Old teams table status:', {
          hasData: oldTeams && oldTeams.length > 0,
          count: oldTeams?.length || 0,
          sample: oldTeams?.slice(0, 3) || []
        });
      }

      // Check if new club_category_teams table has data
      const { data: newTeams, error: newTeamsError } = await supabase
        .from('club_category_teams')
        .select('id, team_suffix, club_category:club_categories(club:clubs(name))')
        .limit(10);
      
      if (newTeamsError) {
        console.error('❌ Error checking new teams table:', newTeamsError);
      } else {
        console.log('🔍 New teams table status:', {
          hasData: newTeams && newTeams.length > 0,
          count: newTeams?.length || 0,
          sample: newTeams?.slice(0, 3) || []
        });
      }

      // Check matches table for old team references
      const { data: matchesWithOldTeams, error: matchesError } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, category:categories(name)')
        .limit(20);
      
      if (matchesError) {
        console.error('❌ Error checking matches:', matchesError);
      } else {
        console.log('🔍 Matches table status:', {
          count: matchesWithOldTeams?.length || 0,
          sample: matchesWithOldTeams?.slice(0, 5) || []
        });
      }

      // Check foreign key constraints
      console.log('🔍 Foreign key constraints should reference club_category_teams.id');
      console.log('🔍 If matches still have old team IDs, migration is incomplete');
      
    } catch (error) {
      console.error('❌ Error checking database migration:', error);
    }
  }, [supabase]);

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
    console.log('🔍 handleEditMatch called with match:', match);
    console.log('🔍 Current filteredTeams state:', {
      count: filteredTeams.length,
      teams: filteredTeams.map(t => ({ id: t.id, name: t.name }))
    });
    console.log('🔍 Match category_id:', match.category_id);
    console.log('🔍 Selected category:', selectedCategory);
    
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
    
    // Ensure filteredTeams is loaded for this category
    if (match.category_id && selectedSeason && filteredTeams.length === 0) {
      console.log('🔄 filteredTeams is empty, forcing refresh...');
      fetchFilteredTeams(match.category_id, selectedSeason);
    }
    
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

  // Bulk update matchweek for matches
  const handleBulkUpdateMatchweek = async () => {
    if (!bulkUpdateData.categoryId) {
      setError('Prosím vyberte kategorii');
      return;
    }

    if (bulkUpdateData.action === 'set' && !bulkUpdateData.matchweek) {
      setError('Prosím vyberte kolo pro nastavení');
      return;
    }

    try {
      let matchesToUpdate: Match[];
      let updateData: any;

      if (bulkUpdateData.action === 'set') {
        // Find matches without matchweek for the selected category
        matchesToUpdate = matches.filter(match => 
          match.category_id === bulkUpdateData.categoryId && 
          !match.matchweek
        );

        if (matchesToUpdate.length === 0) {
          setError('Nebyly nalezeny žádné zápasy bez kola pro vybranou kategorii');
          return;
        }

        const matchweekNumber = parseInt(bulkUpdateData.matchweek);
        updateData = { matchweek: matchweekNumber };
      } else {
        // Find matches with matchweek for the selected category
        matchesToUpdate = matches.filter(match => 
          match.category_id === bulkUpdateData.categoryId && 
          match.matchweek !== null && match.matchweek !== undefined
        );

        if (matchesToUpdate.length === 0) {
          setError('Nebyly nalezeny žádné zápasy s kolem pro vybranou kategorii');
          return;
        }

        updateData = { matchweek: null };
      }

      // Update all matches in bulk
      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .in('id', matchesToUpdate.map(match => match.id));

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      const actionText = bulkUpdateData.action === 'set' ? 'nastaveno' : 'odebráno';
      setError('');
      onBulkUpdateClose();
      setBulkUpdateData({ categoryId: '', matchweek: '', action: 'set' });
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
                  aria-label="Přidat nový zápas"
                >
                  {translations.matches.actions.addMatch}
                </Button>
                <Button 
                  color="warning" 
                  startContent={<ArrowPathIcon className="w-4 h-4" />}
                  onPress={onBulkUpdateOpen}
                  isDisabled={isSeasonClosed()}
                  size="sm"
                  aria-label="Hromadná aktualizace matchweek"
                >
                  {translations.matches.actions.bulkUpdateMatchweek}
                </Button>
                <Button 
                  color="success" 
                  onPress={handleStandingsAction}
                  isDisabled={isSeasonClosed()}
                  size="sm"
                  aria-label="Generovat nebo přepočítat tabulku"
                >
                  {standings.filter(s => s.category_id === selectedCategory && s.season_id === selectedSeason).length === 0 
                    ? translations.matches.actions.generateStandings 
                    : translations.matches.actions.recalculateStandings
                  }
                </Button>
                <Button 
                  color="secondary" 
                  startContent={<ArrowPathIcon className="w-4 h-4" />}
                  onPress={checkMatchesIntegrity}
                  isDisabled={isSeasonClosed()}
                  size="sm"
                  aria-label="Zkontrolovat integritu zápasů"
                >
                  Zkontrolovat integritu zápasů
                </Button>
                <Button 
                  color="warning" 
                  startContent={<ArrowPathIcon className="w-4 h-4" />}
                  onPress={checkDatabaseMigration}
                  isDisabled={isSeasonClosed()}
                  size="sm"
                  aria-label="Zkontrolovat migraci databáze"
                >
                  Zkontrolovat migraci DB
                </Button>
                <Button 
                  color="secondary" 
                  startContent={<DocumentArrowUpIcon className="w-4 h-4" />}
                  onPress={onExcelImportOpen}
                  size="sm"
                  aria-label="Import zápasů z Excel souboru"
                >
                  {translations.matches.actions.import}
                </Button>
                <Button 
                  color="danger" 
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={onDeleteAllConfirmOpen}
                  isDisabled={isSeasonClosed() || !selectedSeason}
                  size="sm"
                  aria-label="Smazat všechny zápasy"
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
                        <CategoryMatches
                          matches={matches}
                          category={category}
                          expandedMatchweeks={expandedMatchweeks}
                          toggleMatchweek={toggleMatchweek}
                          isMatchweekExpanded={isMatchweekExpanded}
                          onAddResult={(match) => {
                            setSelectedMatch(match);
                            onAddResultOpen();
                          }}
                          onEditMatch={handleEditMatch}
                          onLineupModalOpen={(match) => {
                            setSelectedMatch(match);
                            onLineupModalOpen();
                          }}
                          onDeleteClick={handleDeleteClick}
                          isSeasonClosed={isSeasonClosed()}
                        />


                        {/* Standings for this category */}
                        <StandingsTable
                          standings={standings}
                          categoryId={category.id}
                          categoryName={category.name}
                          isSeasonClosed={isSeasonClosed()}
                          onGenerateStandings={handleStandingsAction}
                          onCheckIntegrity={checkStandingsIntegrity}
                          hasStandings={standings.filter(standing => standing.category_id === category.id).length > 0}
                        />
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
        teams={filteredTeams}
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
      <LineupManagerModal
        isOpen={isLineupModalOpen}
        onClose={onLineupModalClose}
        selectedMatch={selectedMatch}
        members={members}
      />

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
          Opravdu chcete smazat zápas <strong>${matchToDelete?.home_team?.display_name || matchToDelete?.home_team?.name || 'Domácí tým'} vs ${matchToDelete?.away_team?.display_name || matchToDelete?.away_team?.name || 'Hostující tým'}</strong> ze dne ${matchToDelete?.date}?<br><br>
          <span class="text-sm text-gray-600">Tato akce je nevratná a smaže všechny související údaje o zápasu.</span>
        `}
      />

      {/* Match Actions Modal */}
      <MatchActionsModal
        isOpen={isMatchActionsOpen}
        onClose={onMatchActionsClose}
        match={selectedMatch}
        onAddResult={onAddResultOpen}
        onEditMatch={handleEditMatch}
        onLineupModalOpen={onLineupModalOpen}
        onDeleteClick={handleDeleteClick}
        onMatchProcessOpen={onMatchProcessOpen}
        isSeasonClosed={isSeasonClosed}
        
      />

      {/* Match Process Wizard Modal */}
      <MatchProcessWizardModal
        isOpen={isMatchProcessOpen}
        onClose={onMatchProcessClose}
        match={selectedMatch}
      />


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
