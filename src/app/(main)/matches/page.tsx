'use client';

import React, { useState, useEffect, useMemo, useCallback, SyntheticEvent } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { 
  TrophyIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { Select, SelectItem } from "@heroui/react";
import MatchCard from "@/app/(main)/matches/components/MatchCard";
import Image from 'next/image';
import { formatMonth } from "@/helpers/formatMonth";
import { Match } from "@/types/types";

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [activeSeason, setActiveSeason] = useState<any>(null);

  // Check for category parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      if (categoryParam && categoryParam !== 'all') {
        setSelectedCategory(categoryParam);
      }
    }
  }, []);

  const supabase = createClient();

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
  }, [supabase]);

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
  }, [supabase]);



  // Fetch matches
  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id(name, logo_url, is_own_club),
          away_team:away_team_id(name, logo_url, is_own_club),
          category:categories(code, name, description),
          season:seasons(name)
        `)
        .order('date', { ascending: true });

      // Filter by active season if available
      if (activeSeason) {
        query = query.eq('season_id', activeSeason.id);
      }

      // Filter by category if selected
      if (selectedCategory !== "all") {
        const category = categories.find(cat => cat.code === selectedCategory);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      // Filter by team if selected
      if (selectedTeam && selectedTeam !== "all") {
        console.log('🔍 Filtering by team:', selectedTeam);
        console.log('🔍 Current query filters:', { selectedCategory, selectedTeam, activeSeason: activeSeason?.id });
        query = query.or(`home_team_id.eq.${selectedTeam},away_team_id.eq.${selectedTeam}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, activeSeason, selectedCategory, selectedTeam, categories]);

  // Initial data fetch
  useEffect(() => {
    fetchActiveSeason();
    fetchCategories();
  }, [fetchActiveSeason, fetchCategories]);

  // Fetch matches when dependencies change
  useEffect(() => {
    if (activeSeason) {
      fetchMatches();
    }
  }, [fetchMatches, activeSeason]);

  // Refetch teams when category changes
  useEffect(() => {
    if (activeSeason && categories.length > 0) {
      const fetchTeamsForCategory = async () => {
        try {
          if (selectedCategory === "all") {
            // If no category selected, show all teams
            const { data, error } = await supabase
              .from('teams')
              .select('id, name, short_name, logo_url, is_own_club')
              .eq('is_active', true)
              .order('is_own_club', { ascending: false })
              .order('name');

            if (error) throw error;
            
            // Remove duplicates based on team ID
            const uniqueTeams = data?.filter((team: any, index: number, self: any[]) => 
              index === self.findIndex((t: any) => t.id === team.id)
            ) || [];
            
            setTeams(uniqueTeams);
          } else {
            // If category selected, show only teams in that category
            const category = categories.find(cat => cat.code === selectedCategory);
            if (category) {
              const { data, error } = await supabase
                .from('team_categories')
                .select(`
                  team:teams(id, name, short_name, logo_url, is_own_club)
                `)
                .eq('category_id', category.id)
                .eq('is_active', true);

              if (error) throw error;
              
              // Extract team data, remove duplicates, and sort (own club first)
              const teamData = data?.map((tc: any) => tc.team).filter(Boolean) || [];
              
              // Remove duplicates based on team ID
              const uniqueTeams = teamData.filter((team: any, index: number, self: any[]) => 
                index === self.findIndex((t: any) => t.id === team.id)
              );
              
              uniqueTeams.sort((a: any, b: any) => {
                if (a.is_own_club && !b.is_own_club) return -1;
                if (!a.is_own_club && b.is_own_club) return 1;
                return a.name.localeCompare(b.name);
              });
              
              setTeams(uniqueTeams);
            }
          }
        } catch (error) {
          console.error('Error fetching teams:', error);
        }
      };

      fetchTeamsForCategory();
    }
  }, [activeSeason, selectedCategory, categories, supabase]);

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Všechny zápasy
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kompletní přehled všech zápasů
        </p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <Select
            selectedKeys={[selectedCategory]}
            onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
            className="w-48"
            placeholder="Vyberte kategorii"
            aria-label="Vyberte kategorii zápasů"
          >
            <SelectItem key="all">
              Všechny kategorie
            </SelectItem>
            <>
              {categories.map((category) => (
                <SelectItem key={category.code}>
                  {category.name}
                </SelectItem>
              ))}
            </>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <Button
            variant={filterType === "all" ? "solid" : "bordered"}
            color="primary"
            size="sm"
            onPress={() => setFilterType("all")}
            aria-label="Zobrazit všechny zápasy"
          >
            Všechny zápasy
          </Button>
          <Button
            variant={filterType === "past" ? "solid" : "bordered"}
            color="primary"
            size="sm"
            onPress={() => setFilterType("past")}
            aria-label="Zobrazit minulé zápasy"
          >
            Minulé
          </Button>
          <Button
            variant={filterType === "future" ? "solid" : "bordered"}
            color="primary"
            size="sm"
            onPress={() => setFilterType("future")}
            aria-label="Zobrazit budoucí zápasy"
          >
            Budoucí
          </Button>
        </div>
      </div>

      {/* Team Filter Buttons */}
      {teams.length > 0 && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Filtrovat podle týmu:
            </span>
            {!selectedTeam || selectedTeam === "all" ? (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                (zobrazeny všechny týmy)
              </span>
            ) : (
              <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                (filtrováno)
              </span>
            )}
          </div>
          <div className={`grid gap-3 ${teams.length > 6 ? 'grid-cols-6' : 'grid-cols-1'} justify-items-center`}>
            {/* Individual Team Buttons */}
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  console.log('🔍 Team clicked:', team.name, 'ID:', team.id);
                  // Toggle team selection - if same team clicked, unselect it
                  if (selectedTeam === team.id) {
                    setSelectedTeam("all");
                  } else {
                    setSelectedTeam(team.id);
                  }
                }}
                aria-label={`${selectedTeam === team.id ? 'Zrušit filtr pro tým' : 'Filtrovat zápasy pro tým'} ${team.name}`}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                  selectedTeam === team.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                }`}
              >
                {team.logo_url ? (
                  <Image
                    src={team.logo_url}
                    alt={`${team.name} logo`}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain rounded-full"
                    onError={(e: SyntheticEvent<HTMLImageElement, Event>) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-500">
                      {team.short_name ? team.short_name.charAt(0) : team.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center max-w-[80px]">
                  {team.short_name || team.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matches by Month */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Načítání zápasů...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredGroupedMatches)
            .sort(([a], [b]) => {
              const months = [ 'srpen', 'září', 'říjen', 'listopad', 'prosinec', 'leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec'];
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
                      <MatchCard key={match.id} match={match} />
                    ))}
                </div>
              </div>
            ))}

          {/* No Matches Message */}
          {Object.keys(filteredGroupedMatches).length === 0 && (
            <Card>
              <CardBody className="text-center py-12">
                <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Žádné zápasy
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Pro vybrané filtry nejsou k dispozici žádné zápasy.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
