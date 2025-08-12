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
  ArrowTopRightOnSquareIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import Link from "@/components/Link";
import Image from 'next/image';

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
  matchweek?: number;
  category: { code: string; name: string };
  season: { name: string };
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

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [activeSeason, setActiveSeason] = useState<any>(null);

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

      const { data, error } = await query;

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, activeSeason, selectedCategory, categories]);

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
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">Všechny kategorie</option>
            {categories.map((category) => (
              <option key={category.code} value={category.code}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
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
      </div>

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
