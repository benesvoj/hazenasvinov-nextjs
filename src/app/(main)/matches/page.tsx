'use client';

import React, { useState, useEffect, useMemo, useCallback, SyntheticEvent } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { 
  TrophyIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { useFetchMatches } from "@/hooks/useFetchMatches";
import { createClient } from "@/utils/supabase/client";
import { Select, SelectItem } from "@heroui/react";
import MatchCard from "@/app/(main)/matches/components/MatchCard";
import Image from 'next/image';
import { formatMonth } from "@/helpers/formatMonth";
import { Match } from "@/types/types";

export default function MatchesPage() {
  const [filterType, setFilterType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  // Teams are now extracted from matches data
  const [activeSeason, setActiveSeason] = useState<any>(null);
  
  // Use the updated hook for fetching matches
  const { matches, loading, error } = useFetchMatches(selectedCategory);

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

  // Supabase client no longer needed - useFetchMatches handles data fetching

  // Fetch active season
  const fetchActiveSeason = useCallback(async () => {
    try {
      const supabase = createClient();
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

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const supabase = createClient();
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



  // Extract teams from matches for filtering
  const allTeams = useMemo(() => {
    const teamsSet = new Set();
    const teamsArray: any[] = [];
    
    matches.autumn.concat(matches.spring).forEach(match => {
      if (match.home_team) {
        const teamKey = `${match.home_team.id}-${match.home_team.name}`;
        if (!teamsSet.has(teamKey)) {
          teamsSet.add(teamKey);
          teamsArray.push(match.home_team);
        }
      }
      if (match.away_team) {
        const teamKey = `${match.away_team.id}-${match.away_team.name}`;
        if (!teamsSet.has(teamKey)) {
          teamsSet.add(teamKey);
          teamsArray.push(match.away_team);
        }
      }
    });
    
    return teamsArray;
  }, [matches]);

  // Initial data fetch
  useEffect(() => {
    fetchActiveSeason();
    fetchCategories();
  }, [fetchActiveSeason, fetchCategories]);

  // No need to fetch matches separately - useFetchMatches handles it

  // Teams are automatically updated when matches change
  // No need for separate teams fetching

  // Group matches by month
  const groupedMatches = useMemo(() => {
    const grouped: { [key: string]: Match[] } = {};
    
    // Combine autumn and spring matches
    const allMatches = [...matches.autumn, ...matches.spring];
    
    allMatches.forEach(match => {
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
    const allMatches = [...matches.autumn, ...matches.spring];
    
    switch (filterType) {
      case "past":
        return allMatches.filter(match => match.status === "completed");
      case "future":
        return allMatches.filter(match => match.status === "upcoming");
      default:
        return allMatches;
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
      {allTeams.length > 0 && (
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
                      <div className={`grid gap-3 ${allTeams.length > 6 ? 'grid-cols-6' : 'grid-cols-1'} justify-items-center`}>
            {/* Individual Team Buttons */}
            {allTeams.map((team) => (
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
