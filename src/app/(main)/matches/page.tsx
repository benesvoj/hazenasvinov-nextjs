'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  TrophyIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { usePublicMatches, useSeasons, useCategories } from "@/hooks";
import { Select, SelectItem, Card, CardBody, Button } from "@heroui/react";
import MatchCard from "@/app/(main)/matches/components/MatchCard";
import ClubSelector from "@/app/(main)/matches/components/ClubSelector";
import { formatMonth } from "@/helpers";
import { Match, CategoryNew } from "@/types";
import { translations } from "@/lib/translations";
import { months as monthsConstants } from "@/constants";

export default function MatchesPage() {
  const [filterType, setFilterType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedClub, setSelectedClub] = useState<string | undefined>(undefined);
  const [clubTeamMap, setClubTeamMap] = useState<{ [clubId: string]: string[] }>({});


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


  // Initial data fetch
  useEffect(() => {
    fetchActiveSeason();
    fetchCategories();
  }, [fetchActiveSeason, fetchCategories]);

  // Reset club selection and filter type when category changes
  useEffect(() => {
    setSelectedClub(undefined);
    // Reset filter type to "all" when category changes to avoid invalid filter states
    if (filterType === "home" || filterType === "away") {
      setFilterType("all");
    }
  }, [selectedCategory, filterType]);

  // Update URL when category changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (selectedCategory === 'all') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', selectedCategory);
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedCategory]);

  // Helper function to get all teams from a club in a specific category
  const getClubTeamsInCategory = useCallback((clubId: string, categoryCode: string, allCategories: CategoryNew[]) => {
    // The ClubSelector now properly handles both "all" and specific category cases
    // Just return the teams for the selected club
    return clubTeamMap[clubId] || [];
  }, [clubTeamMap]);

  // Group matches by month and enrich with category information
  const groupedMatches = useMemo(() => {
    const grouped: { [key: string]: Match[] } = {};
    
    // Combine autumn and spring matches
    const allMatches = [...matches.autumn, ...matches.spring];
    
    // Create a map for quick category lookup
    const categoryMap = new Map();
    categories.forEach(category => {
      categoryMap.set(category.id, category);
    });
    
    // Enrich matches with category information
    const enrichedMatches = allMatches.map(match => {
      const categoryInfo = categoryMap.get(match.category_id);
      return {
        ...match,
        category: categoryInfo ? {
          id: categoryInfo.id,
          name: categoryInfo.name,
          description: categoryInfo.description
        } : {
          id: 'unknown',
          name: 'Neznámá kategorie',
          description: undefined
        }
      };
    });
    
    enrichedMatches.forEach(match => {
      const date = new Date(match.date);
      const monthKey = `${date.toLocaleDateString('cs-CZ', { month: 'long' }).toLowerCase()} ${date.getFullYear()}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(match);
    });

    return grouped;
  }, [matches, categories]);


  // Filter grouped matches
  const filteredGroupedMatches = useMemo(() => {
    const filtered: { [key: string]: Match[] } = {};
    
    Object.entries(groupedMatches).forEach(([month, monthMatches]) => {
      let filteredMonthMatches = monthMatches;

      // Filter by selected category (if not "all") - apply this first
      if (selectedCategory !== 'all') {
        filteredMonthMatches = filteredMonthMatches.filter(match => 
          match.category?.id === selectedCategory
        );
      }

      // Apply filter type (past, future, home, away)
      filteredMonthMatches = filteredMonthMatches.filter(match => {
        switch (filterType) {
          case "past":
            return match.status === "completed";
          case "future":
            return match.status === "upcoming";
          case "home":
            // Filter for home matches (club must be selected)
            if (!selectedClub || !clubTeamMap[selectedClub] || clubTeamMap[selectedClub].length === 0) return false;
            const homeClubTeams = getClubTeamsInCategory(selectedClub, selectedCategory, categories);
            return homeClubTeams.some((teamId: string) => match.home_team_id === teamId);
          case "away":
            // Filter for away matches (club must be selected)
            if (!selectedClub || !clubTeamMap[selectedClub] || clubTeamMap[selectedClub].length === 0) return false;
            const awayClubTeams = getClubTeamsInCategory(selectedClub, selectedCategory, categories);
            return awayClubTeams.some((teamId: string) => match.away_team_id === teamId);
          default:
            return true;
        }
      });

      // Filter by selected club if one is selected (for non-home/away filters)
      if (selectedClub && filterType !== "home" && filterType !== "away") {
        // Get all teams from the selected club in the selected category
        const clubTeams = getClubTeamsInCategory(selectedClub, selectedCategory, categories);
        
        filteredMonthMatches = filteredMonthMatches.filter(match => {
          // Check if the match involves any team from the selected club
          return clubTeams.some((teamId: string) => 
            match.home_team_id === teamId || match.away_team_id === teamId
          );
        });
      }
      
      if (filteredMonthMatches.length > 0) {
        filtered[month] = filteredMonthMatches;
      }
    });

    return filtered;
  }, [groupedMatches, filterType, selectedClub, selectedCategory, categories, getClubTeamsInCategory, clubTeamMap]);


  return (
    <div className="max-w-6xl mx-auto md:space-y-8 space-y-4">
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
                {translations.matches.allCategories}
              </SelectItem>
              <>
                {categories.map((category) => (
                  <SelectItem key={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </>
            </Select>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={filterType === "all" ? "solid" : "bordered"}
            color="primary"
            size="sm"
            onPress={() => setFilterType("all")}
            aria-label={translations.matches.allMatchesButtonDescription}
          >
            {translations.matches.allMatches}
          </Button>
          <Button
            variant={filterType === "past" ? "solid" : "bordered"}
            color="primary"
            size="sm"
            onPress={() => setFilterType("past")}
            aria-label={translations.matches.recentResultsButtonDescription}
          >
            {translations.matches.recentResultsButton}
          </Button>
          <Button
            variant={filterType === "future" ? "solid" : "bordered"}
            color="primary"
            size="sm"
            onPress={() => setFilterType("future")}
            aria-label={translations.matches.upcomingMatchesButtonDescription}
          >
            {translations.matches.upcomingMatchesButton}
          </Button>
          <Button
            variant={filterType === "home" ? "solid" : "bordered"}
            color="primary"
            size="sm"
            onPress={() => setFilterType("home")}
            aria-label={translations.matches.homeMatchesButtonDescription}
            isDisabled={!selectedClub || !clubTeamMap[selectedClub] || clubTeamMap[selectedClub].length === 0}
          >
            {translations.matches.homeMatchesButton}
          </Button>
          <Button
            variant={filterType === "away" ? "solid" : "bordered"}
            color="primary"
            size="sm"
            onPress={() => setFilterType("away")}
            aria-label={translations.matches.awayMatchesButtonDescription}
            isDisabled={!selectedClub || !clubTeamMap[selectedClub] || clubTeamMap[selectedClub].length === 0}
          >
            {translations.matches.awayMatchesButton}
          </Button>
        </div>
      </div>

      {/* Club Selector */}
      <ClubSelector
        selectedCategory={selectedCategory}
        selectedClub={selectedClub}
        onClubSelect={setSelectedClub}
        onClubDataChange={setClubTeamMap}
        className="mb-2 md:mb-6"
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
          {/* TODO: another spinner - blueone, better */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredGroupedMatches)
            .sort(([a], [b]) => {
              const months = monthsConstants;
              const aParts = a.split(' ');
              const bParts = b.split(' ');
              
              if (aParts.length < 2 || bParts.length < 2) return 0;
              
              const aMonth = aParts[0];
              const bMonth = bParts[0];
              const aYear = parseInt(aParts[1]);
              const bYear = parseInt(bParts[1]);
              
              // Handle invalid years
              if (isNaN(aYear) || isNaN(bYear)) return 0;
              
              // First sort by year
              if (aYear !== bYear) return aYear - bYear;
              
              // Then sort by month within the same year
              const aMonthIndex = months.indexOf(aMonth);
              const bMonthIndex = months.indexOf(bMonth);
              
              // Handle unknown months
              if (aMonthIndex === -1 || bMonthIndex === -1) return 0;
              
              return aMonthIndex - bMonthIndex;
            })
            .map(([month, matches]) => (
              <div key={month}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {formatMonth(month)}
                </h3>
                <div className="space-y-4">
                  {matches
                    .sort((a, b) => {
                      // First sort by date
                      const dateA = new Date(a.date);
                      const dateB = new Date(b.date);
                      const dateComparison = dateA.getTime() - dateB.getTime();
                      
                      // If dates are the same, sort by time
                      if (dateComparison === 0 && a.time && b.time) {
                        const timeA = new Date(`2000-01-01T${a.time}`);
                        const timeB = new Date(`2000-01-01T${b.time}`);
                        return timeA.getTime() - timeB.getTime();
                      }
                      
                      return dateComparison;
                    })
                    .map((match) => {
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
