'use client';

import React, { useState, useEffect, useMemo, useCallback, SyntheticEvent } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { 
  TrophyIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { usePublicMatches } from "@/hooks/usePublicMatches";
import { useSeasons } from "@/hooks/useSeasons";
import { useCategories } from "@/hooks/useCategories";
import { Select, SelectItem } from "@heroui/react";
import MatchCard from "@/app/(main)/matches/components/MatchCard";
import ClubSelector from "@/app/(main)/matches/components/ClubSelector";
import Image from 'next/image';
import { formatMonth } from "@/helpers/formatMonth";
import { Match } from "@/types/match";

export default function MatchesPage() {
  const [filterType, setFilterType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedClub, setSelectedClub] = useState<string | undefined>(undefined);
  
  // Use the new public matches hook
  const { matches, loading, error } = usePublicMatches(selectedCategory);
  const { activeSeason, fetchActiveSeason, error: seasonError } = useSeasons();
  const { categories, fetchCategories, error: categoryError } = useCategories();

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
          {categoryError ? (
            <div className="text-red-600 dark:text-red-400 text-sm">
              Chyba: {categoryError}
            </div>
          ) : (
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
          )}
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

      {/* Environment Diagnostic */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          🔍 Environment Diagnostic
        </h3>
        <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
          <div>NODE_ENV: {process.env.NODE_ENV || 'undefined'}</div>
          <div>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
          <div>SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
        </div>
      </div>

      {/* Club Selector */}
      <ClubSelector
        selectedCategory={selectedCategory}
        selectedClub={selectedClub}
        onClubSelect={setSelectedClub}
        className="mb-6"
      />

      {/* Error Display */}
      {(error || seasonError || categoryError) && (
        <div className="text-center py-8">
          <div className="mb-4">
            <TrophyIcon className="w-16 h-16 text-red-400 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Chyba při načítání dat
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error && <p>Zápasy: {String(error)}</p>}
            {seasonError && <p>Sezóna: {String(seasonError)}</p>}
            {categoryError && <p>Kategorie: {String(categoryError)}</p>}
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              color="primary"
              size="sm"
              onPress={() => {
                if (error) window.location.reload();
                if (seasonError) fetchActiveSeason();
                if (categoryError) fetchCategories();
              }}
            >
              Zkusit znovu
            </Button>
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
                    .map((match) => {
                      // Debug: Log each match before passing to MatchCard
                      console.log('🔍 Rendering MatchCard for match:', match);
                      console.log('🔍 Home team:', match.home_team);
                      console.log('🔍 Away team:', match.away_team);
                      return <MatchCard key={match.id} match={match} />;
                    })}
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
