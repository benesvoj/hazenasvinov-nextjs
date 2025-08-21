'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Tabs, Tab } from "@heroui/tabs";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  TrophyIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import Link from "@/components/Link";
import Image from 'next/image';
import { translations } from "@/lib/translations";

// Create Supabase client OUTSIDE the component to prevent infinite loops
const supabase = createClient();

// Helper function to format time from HH:MM:SS to HH:MM
function formatTime(time: string): string {
  if (!time) return "";
  // If time is already in HH:MM format, return as is
  if (time.match(/^\d{2}:\d{2}$/)) return time;
  // If time is in HH:MM:SS format, extract HH:MM
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return time.substring(0, 5);
  }
  return time;
}

interface Match {
  id: string;
  category: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  home_team: { name: string; logo_url?: string };
  away_team: { name: string; logo_url?: string };
  venue: string;
  competition: string;
  is_home: boolean;
  status: 'upcoming' | 'completed';
  home_score?: number;
  away_score?: number;
  result?: 'win' | 'loss' | 'draw';
  matchweek?: number;
}

interface Standing {
  id: string;
  position: number;
  team: { name: string; logo_url?: string };
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

function getResultBadge(result: string) {
  switch (result) {
    case 'win':
      return <Badge color="success" variant="flat">Výhra</Badge>;
    case 'loss':
      return <Badge color="danger" variant="flat">Prohra</Badge>;
    case 'draw':
      return <Badge color="warning" variant="flat">Remíza</Badge>;
    default:
      return null;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'upcoming':
      return <Badge color="primary" variant="flat">Nadcházející</Badge>;
    case 'completed':
      return <Badge color="default" variant="flat">Dokončeno</Badge>;
    default:
      return null;
  }
}

function formatMonth(monthKey: string) {
  const [month, year] = monthKey.split(' ');
  const monthNames: { [key: string]: string } = {
    'září': 'Září',
    'říjen': 'Říjen',
    'listopad': 'Listopad',
    'prosinec': 'Prosinec',
    'leden': 'Leden',
    'únor': 'Únor',
    'březen': 'Březen',
    'duben': 'Duben',
    'květen': 'Květen',
    'červen': 'Červen',
    'červenec': 'Červenec',
    'srpen': 'Srpen'
  };
  return `${monthNames[month] || month} ${year}`;
}

export default function MatchSchedulePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubTab, setSelectedSubTab] = useState("overview");
  const [matches, setMatches] = useState<Match[]>([]);
  const [ownClubMatches, setOwnClubMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [ownClubCategories, setOwnClubCategories] = useState<any[]>([]);

  // ❌ REMOVED: const supabase = createClient(); - This was causing the infinite loop!

  // Fetch active season
  const fetchActiveSeason = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching active season:', error);
        return;
      }
      setActiveSeason(data);
    } catch (error) {
      console.error('Error fetching active season:', error);
    }
  }, []);

  // Fetch categories that own club participates in for the active season
  const fetchOwnClubCategories = useCallback(async () => {
    if (!activeSeason) return;
    
    try {
      // First, get the own club team
      const { data: ownClubTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('is_own_club', true)
        .single();

      if (teamError) {
        console.error('Error fetching own club team:', teamError);
        return;
      }

      if (!ownClubTeam) {
        console.log('No own club team found');
        setOwnClubCategories([]);
        return;
      }

      // Then, get categories assigned to the own club team for the active season
      const { data, error } = await supabase
        .from('team_categories')
        .select(`
          category:categories(id, code, name, description, sort_order)
        `)
        .eq('team_id', ownClubTeam.id)
        .eq('season_id', activeSeason.id)
        .eq('is_active', true);

      if (error) throw error;
      
      console.log('Own club categories data:', data);
      
      // Extract categories, remove duplicates, and sort them
      const categories = (data || [])
        .map((item: any) => item.category)
        .filter((category: any) => category) // Remove null values
        .filter((category: any, index: number, self: any[]) => 
          index === self.findIndex(c => (c as any).id === (category as any).id)
        ) // Remove duplicates based on category ID
        .sort((a: any, b: any) => a.sort_order - b.sort_order);
      
      console.log('Processed own club categories:', categories);
      setOwnClubCategories(categories);
      
      // Set the first category as selected if none is selected
      // REMOVED: This was causing the infinite loop
      // if (categories.length > 0 && !selectedCategory) {
      //   setSelectedCategory((categories[0] as any).code);
      // }
    } catch (error) {
      console.error('Error fetching own club categories:', error);
    }
  }, [activeSeason]); // ❌ REMOVED selectedCategory dependency

  // Fetch matches and standings for selected category
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Starting fetchData with:', {
        activeSeason: activeSeason?.id,
        selectedCategory,
        ownClubCategoriesCount: ownClubCategories.length
      });
      
      // Check if we have active season and own club categories
      if (!activeSeason || ownClubCategories.length === 0) {
        console.log('Missing active season or own club categories');
        setMatches([]);
        setStandings([]);
        return;
      }

      // Get the category ID for the selected category code
      const selectedCategoryData = ownClubCategories.find(cat => cat.code === selectedCategory);
      if (!selectedCategoryData) {
        console.log('Category not found for code:', selectedCategory);
        console.log('Available categories:', ownClubCategories.map(c => ({ code: c.code, name: c.name })));
        setMatches([]);
        setStandings([]);
        return;
      }
      
      console.log('Selected category data:', selectedCategoryData);

      // Fetch matches with team names and logos
      // We'll filter for own club matches in JavaScript after fetching
      console.log('Fetching matches for category:', selectedCategoryData.id, 'season:', activeSeason.id);
      
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id(name, logo_url, is_own_club),
          away_team:away_team_id(name, logo_url, is_own_club),
          category:categories(code, name, description)
        `)
        .eq('category_id', selectedCategoryData.id)
        .eq('season_id', activeSeason.id)
        .order('date', { ascending: true });

      console.log('Matches query result:', { data: matchesData?.length, error: matchesError });
      if (matchesError) throw matchesError;

      // Transform all matches data (no filtering for own club)
      const transformedMatches = (matchesData as any[])?.map(match => ({
        ...match,
        home_team: { name: match.home_team?.name || '', logo_url: match.home_team?.logo_url || '' },
        away_team: { name: match.away_team?.name || '', logo_url: match.away_team?.logo_url || '' },
        category_code: match.category?.code || '',
        matchweek: match.matchweek || undefined
      })) || [];
      
      console.log('All matches found:', transformedMatches.length);

      // Filter for own club matches for the overview tab
      const ownClubFilteredMatches = (matchesData as any[])?.filter(match => 
        match.home_team?.is_own_club === true || match.away_team?.is_own_club === true
      ).map(match => ({
        ...match,
        home_team: { name: match.home_team?.name || '', logo_url: match.home_team?.logo_url || '' },
        away_team: { name: match.away_team?.name || '', logo_url: match.away_team?.logo_url || '' },
        category_code: match.category?.code || '',
        matchweek: match.matchweek || undefined
      })) || [];
      
      console.log('Own club matches found:', ownClubFilteredMatches.length);

      // Fetch standings
      // Show complete standings table for the category
      console.log('Fetching standings for category:', selectedCategoryData.id, 'season:', activeSeason.id);
      
      const { data: standingsData, error: standingsError } = await supabase
        .from('standings')
        .select(`
          *,
          team:team_id(name, logo_url, is_own_club)
        `)
        .eq('category_id', selectedCategoryData.id)
        .eq('season_id', activeSeason.id)
        .order('position', { ascending: true });

      console.log('Standings query result:', { data: standingsData?.length, error: standingsError });
      if (standingsError) throw standingsError;

      setMatches(transformedMatches || []);
      setOwnClubMatches(ownClubFilteredMatches || []);
      setStandings(standingsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', {
        activeSeason: activeSeason?.id,
        selectedCategory,
        ownClubCategories: ownClubCategories.map(c => ({ id: c.id, code: c.code })),
        selectedCategoryData: ownClubCategories.find(cat => cat.code === selectedCategory)
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, activeSeason, ownClubCategories]);

  // Initial data fetch
  useEffect(() => {
    fetchActiveSeason();
  }, [fetchActiveSeason]);

  // Fetch own club categories when active season changes
  useEffect(() => {
    if (activeSeason) {
      fetchOwnClubCategories();
    }
  }, [fetchOwnClubCategories, activeSeason]);

  // Set initial selected category when own club categories are loaded
  useEffect(() => {
    if (ownClubCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(ownClubCategories[0].code);
    }
  }, [ownClubCategories, selectedCategory]);

  // Fetch matches when dependencies change
  useEffect(() => {
    if (activeSeason && ownClubCategories.length > 0 && selectedCategory) {
      fetchData();
    }
  }, [fetchData, activeSeason, ownClubCategories, selectedCategory]);

  // Group matches by month
  const groupedMatches = useMemo(() => {
    const grouped: { [key: string]: Match[] } = {};
    
    matches.forEach(match => {
      const date = new Date(match.date);
      const monthKey = `${date.toLocaleDateString('cs-CZ', { month: 'long' }).toLowerCase()} ${date.getFullYear()}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(match);
    });

    return grouped;
  }, [matches]);

  // Filter matches based on filter type
  const filteredMatches = useMemo(() => {
    switch (filterType) {
      case "past":
        return matches.filter(match => match.status === "completed");
      case "future":
        return matches.filter(match => match.status === "upcoming");
      default:
        return matches;
    }
  }, [matches, filterType]);

  // Filter grouped matches
  const filteredGroupedMatches = useMemo(() => {
    const filtered: { [key: string]: Match[] } = {};
    
    Object.entries(groupedMatches).forEach(([month, monthMatches]) => {
      const filteredMonthMatches = monthMatches.filter(match => {
        switch (filterType) {
          case "past":
            return match.status === "completed";
          case "future":
            return match.status === "upcoming";
          default:
            return true;
        }
      });
      
      if (filteredMonthMatches.length > 0) {
        filtered[month] = filteredMonthMatches;
      }
    });

    return filtered;
  }, [groupedMatches, filterType]);

  const currentCategory = ownClubCategories.find(cat => cat.code === selectedCategory);
  const currentStandings = standings;
  const currentCompetition = matches.length > 0 ? matches[0].competition : 'N/A';
  const currentSeason = activeSeason?.name;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Team Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-xl font-semibold">Informace o týmu</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Základní informace</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Kategorie:</span> {currentCategory?.name || 'N/A'}</div>
                <div><span className="font-medium">Soutěž:</span> {currentCompetition}</div>
                <div><span className="font-medium">Sezóna:</span> {currentSeason}</div>
                <div><span className="font-medium">Trenér:</span> Jan Novák</div>
                <div><span className="font-medium">Vedoucí:</span> Petr Svoboda</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Statistiky sezóny</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Zápasy:</span> {currentStandings[0]?.matches || 0}</div>
                <div><span className="font-medium">Výhry:</span> {currentStandings[0]?.wins || 0}</div>
                <div><span className="font-medium">Remízy:</span> {currentStandings[0]?.draws || 0}</div>
                <div><span className="font-medium">Prohry:</span> {currentStandings[0]?.losses || 0}</div>
                <div><span className="font-medium">Skóre:</span> {currentStandings[0]?.goals_for || 0}:{currentStandings[0]?.goals_against || 0}</div>
                <div><span className="font-medium">Body:</span> {currentStandings[0]?.points || 0}</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              <h3 className="text-xl font-semibold">Poslední výsledky</h3>
            </div>
            <Button 
              as={Link} 
              href={`/matches${selectedCategory && selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`}
              variant="light" 
              size="sm"
              color="primary"
              endContent={<ArrowRightIcon className="w-4 h-4" />}
            >
              Všechny zápasy
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="space-y-4">
              {ownClubMatches
                .filter(match => match.status === "completed")
                .slice(0, 3)
                .map((match) => (
                  <div key={match.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      {/* Date and Time - Left Side */}
                      <div className="flex flex-col items-start min-w-[120px]">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(match.date).toLocaleDateString('cs-CZ', { 
                            weekday: 'long'
                          })}
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {new Date(match.date).toLocaleDateString('cs-CZ', { 
                            day: 'numeric',
                            month: 'numeric'
                          })}
                        </div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatTime(match.time)}
                        </div>
                      </div>

                      {/* Teams and Info - Center */}
                      <div className="flex-1 flex flex-col items-center mx-4">
                        {/* Teams Row */}
                        <div className="flex items-center gap-4 mb-2">
                          {/* Home Team */}
                          <div className="flex items-center gap-3">
                            {match.home_team.logo_url && (
                              <Image 
                                src={match.home_team.logo_url} 
                                alt={`${match.home_team.name} logo`}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">
                              {match.home_team.name}
                            </span>
                          </div>
                          
                          <span className="text-gray-400 text-sm">x</span>
                          
                          {/* Away Team */}
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {match.away_team.name}
                            </span>
                            {match.away_team.logo_url && (
                              <Image 
                                src={match.away_team.logo_url} 
                                alt={`${match.away_team.name} logo`}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        </div>
                        
                        {/* Venue and League Info */}
                        <div className="text-center">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {match.venue}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {match.competition}
                          </div>
                        </div>
                      </div>

                      {/* Score and Action - Right Side */}
                      <div className="flex flex-col items-end min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {match.home_score !== undefined && match.away_score !== undefined 
                              ? `${match.home_score} : ${match.away_score}` 
                              : "-:-"}
                          </span>
                        </div>
                        
                        {/* Action Button */}
                        <Button 
                          as={Link} 
                          href={`/matches/${match.id}`}
                          variant="light" 
                          size="sm"
                          color="primary"
                          isIconOnly
                          className="mt-2"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              {ownClubMatches.filter(match => match.status === "completed").length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">Žádné výsledky pro náš klub</div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Upcoming Matches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-semibold">Nadcházející zápasy</h3>
            </div>
            <Button 
              as={Link} 
              href={`/matches${selectedCategory && selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`}
              variant="light" 
              size="sm"
              color="primary"
              endContent={<ArrowRightIcon className="w-4 h-4" />}
            >
              Všechny zápasy
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="space-y-4">
              {ownClubMatches
                .filter(match => match.status === "upcoming")
                .slice(0, 3)
                .map((match) => (
                  <div key={match.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      {/* Date and Time - Left Side */}
                      <div className="flex flex-col items-start min-w-[120px]">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(match.date).toLocaleDateString('cs-CZ', { 
                            weekday: 'long'
                          })}
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {new Date(match.date).toLocaleDateString('cs-CZ', { 
                            day: 'numeric',
                            month: 'numeric'
                          })}
                        </div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatTime(match.time)}
                        </div>
                      </div>

                      {/* Teams and Info - Center */}
                      <div className="flex-1 flex flex-col items-center mx-4">
                        {/* Teams Row */}
                        <div className="flex items-center gap-4 mb-2">
                          {/* Home Team */}
                          <div className="flex items-center gap-3">
                            {match.home_team.logo_url && (
                              <Image 
                                src={match.home_team.logo_url} 
                                alt={`${match.home_team.name} logo`}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className={`font-medium ${match.is_home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                              {match.home_team.name}
                            </span>
                          </div>
                          
                          <span className="text-gray-400 text-sm">x</span>
                          
                          {/* Away Team */}
                          <div className="flex items-center gap-3">
                            <span className={`font-medium ${!match.is_home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                              {match.away_team.name}
                            </span>
                            {match.away_team.logo_url && (
                              <Image 
                                src={match.away_team.logo_url} 
                                alt={`${match.away_team.name} logo`}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        </div>
                        
                        {/* Venue and League Info */}
                        <div className="text-center">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {match.venue}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {match.competition}
                          </div>
                        </div>
                      </div>

                      {/* Score and Action - Right Side */}
                      <div className="flex flex-col items-end min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-400">-:-</span>
                        </div>
                        
                        {/* Action Button */}
                        <Button 
                          as={Link} 
                          href={`/matches/${match.id}`}
                          variant="light" 
                          size="sm"
                          color="primary"
                          isIconOnly
                          className="mt-2"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              {ownClubMatches.filter(match => match.status === "upcoming").length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">{translations.matches.noMatches}</div>
                </div>
              )}
              
              {/* Show All Matches Button */}
              {ownClubMatches.filter(match => match.status === "upcoming").length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button 
                    as={Link} 
                    href={`/matches${selectedCategory && selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`}
                    variant="bordered" 
                    size="sm"
                    color="primary"
                    endContent={<ArrowRightIcon className="w-4 h-4" />}
                  >
                    Zobrazit všechny zápasy
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );

  const renderMatchSchedule = () => (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant={filterType === "all" ? "solid" : "bordered"}
          color="primary"
          size="sm"
          onPress={() => setFilterType("all")}
        >
          Všechny zápasy
        </Button>
        <Button
          variant={filterType === "past" ? "solid" : "bordered"}
          color="primary"
          size="sm"
          onPress={() => setFilterType("past")}
        >
          Minulé
        </Button>
        <Button
          variant={filterType === "future" ? "solid" : "bordered"}
          color="primary"
          size="sm"
          onPress={() => setFilterType("future")}
        >
          Budoucí
        </Button>
      </div>

      {/* Matches by Month */}
      {loading ? (
        <div className="text-center py-8">Načítání...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredGroupedMatches)
            .sort(([a], [b]) => {
              const months = ['září', 'říjen', 'listopad', 'prosinec', 'leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen'];
              const aMonth = a.split(' ')[0];
              const bMonth = b.split(' ')[0];
              const aYear = parseInt(a.split(' ')[1]);
              const bYear = parseInt(b.split(' ')[1]);
              
              if (aYear !== bYear) return aYear - bYear;
              return months.indexOf(aMonth) - months.indexOf(bMonth);
            })
            .map(([month, matches]) => (
              <div key={month}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {formatMonth(month)}
                </h3>
                <div className="space-y-4">
                  {matches
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((match) => (
                      <Card key={match.id} className="hover:shadow-lg transition-shadow">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            {/* Date and Time - Left Side */}
                            <div className="flex flex-col items-start min-w-[120px]">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(match.date).toLocaleDateString('cs-CZ', { 
                                  weekday: 'long'
                                })}
                              </div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {new Date(match.date).toLocaleDateString('cs-CZ', { 
                                  day: 'numeric',
                                  month: 'numeric'
                                })}
                              </div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatTime(match.time)}
                              </div>
                            </div>

                            {/* Teams and Info - Center */}
                            <div className="flex-1 flex flex-col items-center mx-4">
                              {/* Teams Row */}
                              <div className="flex items-center gap-4 mb-2">
                                {/* Home Team */}
                                <div className="flex items-center gap-3">
                                  {match.home_team.logo_url && (
                                    <Image 
                                      src={match.home_team.logo_url} 
                                      alt={`${match.home_team.name} logo`}
                                      width={32}
                                      height={32}
                                      className="w-8 h-8 object-contain rounded-full"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <span className={`font-medium ${match.is_home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                    {match.home_team.name}
                                  </span>
                                </div>
                                
                                <span className="text-gray-400 text-sm">x</span>
                                
                                {/* Away Team */}
                                <div className="flex items-center gap-3">
                                  <span className={`font-medium ${!match.is_home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                    {match.away_team.name}
                                  </span>
                                  {match.away_team.logo_url && (
                                    <Image 
                                      src={match.away_team.logo_url} 
                                      alt={`${match.away_team.name} logo`}
                                      width={32}
                                      height={32}
                                      className="w-8 h-8 object-contain rounded-full"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                              
                              {/* Venue and League Info */}
                              <div className="text-center">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  {match.venue}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {match.competition}
                                </div>
                              </div>
                            </div>

                            {/* Score and Action - Right Side */}
                            <div className="flex flex-col items-end min-w-[100px]">
                              {match.status === "completed" ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {match.home_score !== undefined ? match.home_score : "-"}
                                  </span>
                                  <span className="text-gray-400">:</span>
                                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {match.away_score !== undefined ? match.away_score : "-"}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-gray-400">-:-</span>
                                </div>
                              )}
                              
                              {/* Action Button */}
                              <Button 
                                as={Link} 
                                href={`/matches/${match.id}`}
                                variant="light" 
                                size="sm"
                                color="primary"
                                isIconOnly
                                className="mt-2"
                              >
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                </div>
              </div>
            ))}

          {/* No Matches Message */}
          {Object.keys(filteredGroupedMatches).length === 0 && (
            <Card>
              <CardBody className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Žádné zápasy
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Pro vybrané období nejsou k dispozici žádné zápasy.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const renderStandings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-green-500" />
            <h3 className="text-xl font-semibold">Tabulka - {currentCompetition}</h3>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2">Poz.</th>
                    <th className="text-left py-2 px-2">Tým</th>
                    <th className="text-center py-2 px-2">Z</th>
                    <th className="text-center py-2 px-2">V</th>
                    <th className="text-center py-2 px-2">R</th>
                    <th className="text-center py-2 px-2">P</th>
                    <th className="text-center py-2 px-2">Skóre</th>
                    <th className="text-center py-2 px-2">Body</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStandings.map((team) => (
                    <tr key={team.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-2 px-2 font-semibold">{team.position}.</td>
                      <td className="py-2 px-2 font-medium">
                        <div className="flex items-center gap-2">
                          {team.team?.logo_url && (
                            <Image 
                              src={team.team.logo_url} 
                              alt={`${team.team.name} logo`}
                              width={24}
                              height={24}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span>{team.team?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">{team.matches}</td>
                      <td className="py-2 px-2 text-center text-green-600">{team.wins}</td>
                      <td className="py-2 px-2 text-center text-yellow-600">{team.draws}</td>
                      <td className="py-2 px-2 text-center text-red-600">{team.losses}</td>
                      <td className="py-2 px-2 text-center">{team.goals_for}:{team.goals_against}</td>
                      <td className="py-2 px-2 text-center font-bold">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentStandings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Žádná data v tabulce
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {currentCategory?.name || 'Načítání...'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentCompetition}
        </p>
      </div>

      {/* Category Tabs */}
      {ownClubCategories.length > 0 ? (
        <Tabs 
          selectedKey={selectedCategory} 
          onSelectionChange={(key) => setSelectedCategory(key as string)}
          className="w-full"
          color="primary"
          variant="underlined"
        >
          {ownClubCategories.map((category) => (
            <Tab key={category.code} title={category.name} />
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="mb-2">Žádné kategorie pro náš klub</div>
          <div className="text-sm text-gray-400">
            Zkontrolujte, zda máte nastavený vlastní klub a přiřazené kategorie v administraci
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <Tabs 
        selectedKey={selectedSubTab} 
        onSelectionChange={(key) => setSelectedSubTab(key as string)}
        className="w-full"
        color="primary"
        variant="solid"
        size="lg"
      >
        <Tab key="overview" title="Přehled" />
        <Tab key="matches" title="Zápasy" />
        <Tab key="standings" title="Tabulka" />
      </Tabs>

      {/* Content based on selected sub tab */}
      {selectedSubTab === "overview" && renderOverview()}
      {selectedSubTab === "matches" && renderMatchSchedule()}
      {selectedSubTab === "standings" && renderStandings()}
    </div>
  );
}
