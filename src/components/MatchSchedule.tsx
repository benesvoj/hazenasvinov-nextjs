'use client';

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Tabs, Tab } from "@heroui/tabs";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  TrophyIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

// Category configuration
const categories = {
  men: { name: "Muži", competition: "1. liga muži" },
  women: { name: "Ženy", competition: "1. liga ženy" },
  juniorBoys: { name: "Dorostenci", competition: "Dorostenecká liga" },
  juniorGirls: { name: "Dorostenky", competition: "Dorostenecká liga žen" }
};

interface Match {
  id: string;
  category: string;
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  venue: string;
  competition: string;
  is_home: boolean;
  status: 'upcoming' | 'completed';
  home_score?: number;
  away_score?: number;
  result?: 'win' | 'loss' | 'draw';
}

interface Standing {
  position: number;
  team: string;
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

export default function MatchSchedule() {
  const [selectedCategory, setSelectedCategory] = useState("men");
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Fetch matches and standings for selected category
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .eq('category', selectedCategory)
          .order('date', { ascending: true });

        if (matchesError) throw matchesError;

        // Fetch standings
        const { data: standingsData, error: standingsError } = await supabase
          .from('standings')
          .select('*')
          .eq('category', selectedCategory)
          .order('position', { ascending: true });

        if (standingsError) throw standingsError;

        setMatches(matchesData || []);
        setStandings(standingsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  // Filter upcoming and completed matches
  const upcomingMatches = matches.filter(match => match.status === 'upcoming').slice(0, 3);
  const recentResults = matches.filter(match => match.status === 'completed').slice(0, 3);

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            VÝSLEDKY & AKTUÁLNÍ PROGRAM
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Sledujte aktuální výsledky a program zápasů našich týmů
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs 
          selectedKey={selectedCategory} 
          onSelectionChange={(key) => setSelectedCategory(key as string)}
          className="w-full mb-8"
          color="primary"
          variant="underlined"
        >
          <Tab key="men" title="Muži" />
          <Tab key="women" title="Ženy" />
          <Tab key="juniorBoys" title="Dorostenci" />
          <Tab key="juniorGirls" title="Dorostenky" />
        </Tabs>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Matches and Results */}
          <div className="space-y-6">
            {/* Upcoming Matches */}
            <Card>
              <CardHeader className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold">Nadcházející zápasy</h3>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center py-8">Načítání...</div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMatches.map((match) => (
                      <div key={match.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(match.date).toLocaleDateString('cs-CZ')} v {match.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={match.is_home ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                                {match.home_team}
                              </span>
                              <span className="text-gray-500">vs</span>
                              <span className={!match.is_home ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                                {match.away_team}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{match.venue}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {upcomingMatches.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Žádné nadcházející zápasy
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Results */}
            <Card>
              <CardHeader className="flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-semibold">Poslední výsledky</h3>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center py-8">Načítání...</div>
                ) : (
                  <div className="space-y-4">
                    {recentResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(result.date).toLocaleDateString('cs-CZ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={result.home_team.includes('Svinov') ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                                {result.home_team}
                              </span>
                              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {result.home_score}
                              </span>
                              <span className="text-gray-500">:</span>
                              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {result.away_score}
                              </span>
                              <span className={result.away_team.includes('Svinov') ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                                {result.away_team}
                              </span>
                            </div>
                          </div>
                          <div>
                            {getResultBadge(result.result!)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {recentResults.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Žádné výsledky
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right Column - Standings */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-semibold">Tabulka</h3>
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
                        {standings.map((team) => (
                          <tr key={team.team} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-2 px-2 font-semibold">{team.position}.</td>
                            <td className="py-2 px-2 font-medium">{team.team}</td>
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
                    {standings.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Žádná data v tabulce
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Button 
            color="primary" 
            size="lg"
            as={Link}
            href="/matches"
          >
            Zobrazit kompletní program
          </Button>
        </div>
      </div>
    </section>
  );
}
