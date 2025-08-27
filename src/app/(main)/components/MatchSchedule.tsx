"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { translations } from "@/lib/translations";
import { useSeasons, useCategories, useFetchMatches } from "@/hooks";
import { Standing } from "@/types";
import CategoryStandingsTable from "@/app/(main)/components/CategoryStandingsTable";
import CategoryMatchesAndResults from "@/app/(main)/components/CategoryMatchesAndResults";

export default function MatchSchedule() {
  const [selectedCategory, setSelectedCategory] = useState<string>("men");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);

  const { activeSeason, fetchActiveSeason } = useSeasons();
  const { categories, fetchCategories } = useCategories();
  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
  } = useFetchMatches(selectedCategory);

  // Fetch standings for selected category in active season
  const fetchStandings = async () => {
    try {
      setStandingsLoading(true);

      // Check if we have active season and categories
      if (!activeSeason || categories.length === 0) {
        setStandings([]);
        return;
      }

      // Get the category ID for the selected category code
      const selectedCategoryData = categories.find(
        (cat) => cat.code === selectedCategory
      );
      if (!selectedCategoryData) {
        setStandings([]);
        return;
      }

      // Create a simple Supabase client for standings
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      // Fetch standings with team names for active season

      const { data: standingsData, error: standingsError } = await supabase
        .from("standings")
        .select(
          `
          *,
          team:team_id(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url)
            )
          )
        `
        )
        .eq("category_id", selectedCategoryData.id)
        .eq("season_id", activeSeason.id)
        .order("position", { ascending: true });

      if (standingsError) throw standingsError;

      // Transform standings data to flatten team names and logos
      const transformedStandings =
        (standingsData as any[])?.map((standing) => {
          const team = standing.team;

          // Create team name from club + suffix
          const teamName = team?.club_category?.club
            ? `${team.club_category.club.name} ${team.team_suffix}`
            : "Neznámý tým";

          // Check if this is our club using the is_own_club field
          const isOwnClub = team?.club_category?.club?.is_own_club === true;

          return {
            ...standing,
            team: teamName,
            team_logo: team?.club_category?.club?.logo_url || "",
            is_own_club: isOwnClub || false,
          };
        }) || [];

      setStandings(transformedStandings);
    } catch (error) {
      console.error("Error fetching standings:", error);
    } finally {
      setStandingsLoading(false);
    }
  };

  // Fetch active season and categories on mount
  useEffect(() => {
    fetchActiveSeason();
    fetchCategories();
  }, [fetchActiveSeason, fetchCategories]);

  // Fetch standings when category or active season changes
  useEffect(() => {
    if (categories.length > 0 && activeSeason) {
      fetchStandings();
    }
  }, [selectedCategory, activeSeason, categories.length]);

  // Combine autumn and spring matches and transform them for display
  const allMatches = useMemo(() => {
    const combined = [...(matches.autumn || []), ...(matches.spring || [])];

    // Transform the data to match the expected format for MatchRow
    return combined.map((match) => ({
      ...match,
      // Preserve the team structure that MatchRow expects
      home_team: {
        ...match.home_team,
        name: match.home_team?.name || "",
        short_name: match.home_team?.short_name || match.home_team?.name || "",
        logo_url: match.home_team?.logo_url || "",
      },
      away_team: {
        ...match.away_team,
        name: match.away_team?.name || "",
        short_name: match.away_team?.short_name || match.away_team?.name || "",
        logo_url: match.away_team?.logo_url || "",
      },
      // Add the flattened properties for backward compatibility
      home_team_logo: match.home_team?.logo_url || "",
      away_team_logo: match.away_team?.logo_url || "",
      home_team_is_own_club: match.home_team?.is_own_club || false,
      away_team_is_own_club: match.away_team?.is_own_club || false,
      // Ensure category information is available
      category: {
        code: selectedCategory,
        name:
          categories.find((cat) => cat.code === selectedCategory)?.name || "",
        description:
          categories.find((cat) => cat.code === selectedCategory)
            ?.description || "",
      },
      category_code: selectedCategory,
      matchweek: match.matchweek || undefined,
      status: match.status || "unknown",
      // Ensure other required properties are set
      is_home: match.is_home || false,
      venue: match.venue || "Neznámé místo",
      competition: match.competition || "Liga",
    }));
  }, [matches, selectedCategory, categories]);

  // Filter upcoming and completed matches
  const now = new Date();

  const upcomingMatches = allMatches
    .filter((match) => {
      if (!match.date) return false;
      const matchDate = new Date(match.date);
      return matchDate > now;
    })
    .slice(0, 3);

  const recentResults = allMatches
    .filter((match) => {
      if (!match.date) return false;
      const matchDate = new Date(match.date);
      return matchDate <= now;
    })
    .slice(0, 3);

  const loading = matchesLoading || standingsLoading;

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
          {matchesError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-700 dark:text-red-300">
                Chyba při načítání zápasů: {matchesError.message}
              </p>
            </div>
          )}
          {allMatches.length === 0 && !loading && !matchesError && (
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
          <CategoryMatchesAndResults
            loading={matchesLoading}
            selectedCategory={selectedCategory}
            allMatches={allMatches}
            upcomingMatches={upcomingMatches}
            recentResults={recentResults}
          />

          {/* Right Column - Standings */}
          <CategoryStandingsTable
            standings={standings}
            standingsLoading={standingsLoading}
          />
        </div>
      </div>
    </section>
  );
}
