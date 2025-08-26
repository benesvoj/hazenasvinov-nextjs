'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { 
  CalendarIcon, 
  TrophyIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import Link from "@/components/Link";
import { MatchRow } from "@/components";
import Image from 'next/image';
import { translations } from "@/lib/translations";

// Create Supabase client OUTSIDE the component to prevent infinite loops
const supabase = createClient();

// Helper function to get short name for clubs
function getShortName(fullName: string): string {
  // Common patterns for Czech club names
  if (fullName.includes('TJ Sokol')) {
    return fullName.replace('TJ Sokol ', '');
  }
  if (fullName.includes('TJ ')) {
    return fullName.replace('TJ ', '');
  }
  if (fullName.includes('SK ')) {
    return fullName.replace('SK ', '');
  }
  if (fullName.includes('HC ')) {
    return fullName.replace('HC ', '');
  }
  if (fullName.includes('FK ')) {
    return fullName.replace('FK ', '');
  }
  // If no pattern matches, return first two words or full name if short
  const words = fullName.split(' ');
  if (words.length > 2) {
    return words.slice(0, 2).join(' ');
  }
  return fullName;
}

interface RawMatch {
  id: string;
  category_id: string;
  season_id: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  home_team: { name: string; logo_url?: string; is_own_club?: boolean };
  away_team: { name: string; logo_url?: string; is_own_club?: boolean };
  venue: string;
  competition: string;
  is_home: boolean;
  status: 'upcoming' | 'completed';
  home_score?: number;
  away_score?: number;
  result?: 'win' | 'loss' | 'draw';
  category: { code: string; name: string };
  matchweek?: number;
}

interface Match {
  id: string;
  category_id: string;
  season_id: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  home_team: string;
  away_team: string;
  home_team_logo?: string;
  away_team_logo?: string;
  venue: string;
  competition: string;
  is_home: boolean;
  status: 'upcoming' | 'completed';
  home_score?: number;
  away_score?: number;
  result?: 'win' | 'loss' | 'draw';
  category_code: string;
  matchweek?: number;
}

interface Standing {
  position: number;
  team: string;
  team_logo: string;
  is_own_club?: boolean;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

export default function MatchSchedule() {
  const [selectedCategory, setSelectedCategory] = useState<string>("men");
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; code: string; name: string }[]>([]);
  const [activeSeason, setActiveSeason] = useState<{ id: string; name: string } | null>(null);

  // Fetch active season first
  const fetchActiveSeason = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setActiveSeason(data);
    } catch (error) {
      console.error('Error fetching active season:', error);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, code, name')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Fetch matches and standings for selected category in active season
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we have active season and categories
      if (!activeSeason || categories.length === 0) {
        setMatches([]);
        setStandings([]);
        return;
      }

      // Get the category ID for the selected category code
      const selectedCategoryData = categories.find(cat => cat.code === selectedCategory);
      if (!selectedCategoryData) {
        setMatches([]);
        setStandings([]);
        return;
      }
      

      // Fetch matches for the selected category and active season
      
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
                      home_team:home_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url, is_own_club)
              )
            ),
            away_team:away_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url, is_own_club)
              )
            ),
          category:categories(code, name, description)
        `)
        .eq('category_id', selectedCategoryData.id)
        .eq('season_id', activeSeason.id)
        .order('date', { ascending: true });
      
      if (matchesError) throw matchesError;
      


      // Transform matches to include team names and club information
      const transformedMatchesData = (matchesData as any[])?.map(match => {
        // Create team names from club + suffix
        const homeTeamName = match.home_team?.club_category?.club 
          ? `${match.home_team.club_category.club.name} ${match.home_team.team_suffix}`
          : 'Neznámý tým';
        
        const awayTeamName = match.away_team?.club_category?.club 
          ? `${match.away_team.club_category.club.name} ${match.away_team.team_suffix}`
          : 'Neznámý tým';
        
        // Check if each team belongs to our club using the is_own_club field
        const homeTeamIsOwnClub = match.home_team?.club_category?.club?.is_own_club === true;
        const awayTeamIsOwnClub = match.away_team?.club_category?.club?.is_own_club === true;
        
        return {
          ...match,
          home_team: {
            name: homeTeamName,
            logo_url: match.home_team?.club_category?.club?.logo_url,
            is_own_club: homeTeamIsOwnClub
          },
          away_team: {
            name: awayTeamName,
            logo_url: match.away_team?.club_category?.club?.logo_url,
            is_own_club: awayTeamIsOwnClub
          }
        };
      }) || [];

      // Filter matches for own club teams
      const ownClubMatches = transformedMatchesData.filter(match => 
        match.home_team?.is_own_club === true || match.away_team?.is_own_club === true
      );
      
      console.log('Own club matches found:', ownClubMatches.length);
      

      
      // Always show only own club matches for the landing page
      let matchesToShow = ownClubMatches;
      if (ownClubMatches.length === 0) {
        console.log('No own club matches found - landing page will be empty');
        console.log('To see matches, mark a club as "own club" in admin/clubs');
        console.log('Debug: Check if the is_own_club field is properly set in the clubs table');
      }

      // Transform the data to flatten team names and include logos
      const transformedMatches = matchesToShow.map(match => ({
        ...match,
        home_team: match.home_team?.name || '',
        away_team: match.away_team?.name || '',
        home_team_logo: match.home_team?.logo_url || '',
        away_team_logo: match.away_team?.logo_url || '',
        home_team_is_own_club: match.home_team?.is_own_club || false,
        away_team_is_own_club: match.away_team?.is_own_club || false,
        category_code: match.category?.code || '',
        matchweek: match.matchweek || undefined,
        status: match.status || 'unknown' // Preserve the status field for filtering
      })) || [];

      // Fetch standings with team names for active season
      // Show complete standings table for the category
      console.log('Fetching standings for category:', selectedCategoryData.id, 'season:', activeSeason.id);
      
      const { data: standingsData, error: standingsError } = await supabase
        .from('standings')
        .select(`
          *,
          team:team_id(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url)
            )
          )
        `)
        .eq('category_id', selectedCategoryData.id)
        .eq('season_id', activeSeason.id)
        .order('position', { ascending: true });

      console.log('Standings query result:', { data: standingsData?.length, error: standingsError });
      if (standingsError) throw standingsError;

      // Transform standings data to flatten team names and logos
      const transformedStandings = (standingsData as any[])?.map(standing => {
        const team = standing.team;
        
        // Create team name from club + suffix
        const teamName = team?.club_category?.club 
          ? `${team.club_category.club.name} ${team.team_suffix}`
          : 'Neznámý tým';
        
        // Check if this is our club using the is_own_club field
        const isOwnClub = team?.club_category?.club?.is_own_club === true;
        
        return {
          ...standing,
          team: teamName,
          team_logo: team?.club_category?.club?.logo_url || '',
          is_own_club: isOwnClub || false
        };
      }) || [];

      setMatches(transformedMatches);
      setStandings(transformedStandings);
      
      // Debug: Log status values for filtering
      console.log('Match statuses found:', transformedMatches.map(m => ({ id: m.id, status: m.status, date: m.date })));
      
      // Log if no matches found
      if (transformedMatches.length === 0) {
        console.log('No matches found. This could be because:');
        console.log('1. No matches exist for the selected category and season');
        console.log('2. No teams are marked as "own club" (is_own_club = true)');
        console.log('3. The club management system needs to be set up');
        console.log('4. The database needs the is_own_club field added to clubs table');
      } else if (ownClubMatches.length === 0) {
        console.log('Showing all matches (no own club matches found)');
        console.log('To show only own club matches, mark a club as "own club" in admin/clubs');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', {
        activeSeason: activeSeason?.id,
        selectedCategory,
        categories: categories.map(c => ({ id: c.id, code: c.code })),
        selectedCategoryData: categories.find(cat => cat.code === selectedCategory)
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, categories, activeSeason]);

  // Fetch active season and categories on mount
  useEffect(() => {
    fetchActiveSeason();
    fetchCategories();
  }, [fetchActiveSeason, fetchCategories]);

  // Fetch data when category or active season changes
  useEffect(() => {
    if (categories.length > 0 && activeSeason) {
      fetchData();
    }
  }, [fetchData, activeSeason, categories.length]);

  // Filter upcoming and completed matches (only from own club matches)
  const now = new Date();
  
  const upcomingMatches = matches.filter(match => {
    if (!match.date) return false;
    const matchDate = new Date(match.date);
    return matchDate > now;
  }).slice(0, 3);
  
  const recentResults = matches.filter(match => {
    if (!match.date) return false;
    const matchDate = new Date(match.date);
    return matchDate <= now;
  }).slice(0, 3);
  
  // Ensure we only show own club matches
  const ownClubUpcomingMatches = upcomingMatches.filter((match: any) => 
    match.home_team_is_own_club || match.away_team_is_own_club
  );
  
  const ownClubRecentResults = recentResults.filter((match: any) => 
    match.home_team_is_own_club || match.away_team_is_own_club
  );
  
  console.log('Filtering results:', {
    totalMatches: matches.length,
    upcomingCount: upcomingMatches.length,
    recentCount: recentResults.length,
    ownClubUpcomingCount: ownClubUpcomingMatches.length,
    ownClubRecentCount: ownClubRecentResults.length,
    now: now.toISOString(),
    upcomingDates: upcomingMatches.map(m => m.date),
    recentDates: recentResults.map(m => m.date)
  });

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {translations.matchSchedule.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {translations.matchSchedule.description}
          </p>
          {matches.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Žádné zápasy nebyly nalezeny. Zkontrolujte:
              </p>
              <ul className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 list-disc list-inside">
                <li>Vybranou kategorii a sezónu</li>
                <li>Zda existují zápasy v databázi</li>
                <li>Zda je klub označen jako domácí v admin/kluby</li>
              </ul>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs 
          selectedKey={selectedCategory} 
          onSelectionChange={(key) => setSelectedCategory(key as string)}
          className="w-full mb-8"
          color="primary"
          variant="underlined"
        >
          {categories.map((category) => (
            <Tab key={category.code} title={category.name} />
          ))}
        </Tabs>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Matches and Results */}
          <div className="space-y-6">
            {/* Upcoming Matches */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
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
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center py-8">Načítání...</div>
                ) : (
                  <div className="space-y-4">
                    {ownClubUpcomingMatches.map((match) => (
                      <MatchRow key={match.id} match={match} />
                    ))}
                    {ownClubUpcomingMatches.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="mb-2">
                          {matches.length === 0 
                            ? translations.matches.noMatches 
                            : "Žádné nadcházející zápasy domácího klubu"
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Results */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-green-600" />
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
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center py-8">Načítání...</div>
                ) : (
                  <div className="space-y-4">
                    {ownClubRecentResults.map((match) => (
                      <MatchRow key={match.id} match={match} />
                    ))}
                    {ownClubRecentResults.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="mb-2">
                          {matches.length === 0 
                            ? translations.matches.noMatches 
                            : "Žádné výsledky domácího klubu"
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right Column - Standings */}
          <div>
            <Card>
              <CardHeader className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="text-xl font-semibold">Tabulka</h3>
                  </div>
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
                          <th className="text-left py-2 px-1 lg:px-2 text-xs lg:text-sm">Poz.</th>
                          <th className="text-left py-2 px-1 lg:px-2 text-xs lg:text-sm">Tým</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">Z</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">V</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">R</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">P</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">Skóre</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">Body</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((team, index) => (
                          <tr key={index} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            team.is_own_club 
                              ? 'bg-blue-50 dark:bg-blue-900/20' 
                              : ''
                          }`}>
                            <td className="py-2 px-1 lg:px-2 font-semibold text-xs lg:text-sm">{team.position}.</td>
                            <td className="py-2 px-1 lg:px-2 font-medium">
                              <div className="flex items-center gap-1 lg:gap-2">
                                {/* Logo - Hidden on mobile */}
                                {team.team_logo && (
                                  <div className="hidden lg:block">
                                    <Image 
                                      src={team.team_logo} 
                                      alt={`${team.team} logo`}
                                      width={24}
                                      height={24}
                                      className="w-6 h-6 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <span className={`text-xs lg:text-base ${team.is_own_club ? 'font-bold text-blue-700 dark:text-blue-300' : ''}`}>
                                  {/* Mobile: Short name, Desktop: Full name */}
                                  <span className="lg:hidden">{getShortName(team.team)}</span>
                                  <span className="hidden lg:inline">{team.team}</span>
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-1 lg:px-2 text-center text-xs lg:text-sm">{team.matches}</td>
                            <td className="py-2 px-1 lg:px-2 text-center text-green-600 text-xs lg:text-sm">{team.wins}</td>
                            <td className="py-2 px-1 lg:px-2 text-center text-yellow-600 text-xs lg:text-sm">{team.draws}</td>
                            <td className="py-2 px-1 lg:px-2 text-center text-red-600 text-xs lg:text-sm">{team.losses}</td>
                            <td className="py-2 px-1 lg:px-2 text-center text-xs lg:text-sm">{team.goals_for}:{team.goals_against}</td>
                            <td className={`py-2 px-1 lg:px-2 text-center font-bold text-xs lg:text-sm ${team.is_own_club ? 'text-blue-700 dark:text-blue-300' : ''}`}>{team.points}</td>
                          </tr>
                        ))}
                        {standings.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-gray-500">
                              <div className="mb-2">Žádná data pro tabulku</div>
                              <div className="text-sm text-gray-400">
                                Pro vybranou kategorii a sezónu nejsou k dispozici žádná data
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
