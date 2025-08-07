'use client';

import React from "react";
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

// Sample match data for different categories - in a real app, this would come from a database
const categoryData = {
  men: {
    name: "Muži",
    upcomingMatches: [
      {
        id: 1,
        date: "2024-09-28",
        time: "15:00",
        homeTeam: "TJ Sokol Svinov",
        awayTeam: "TJ Sokol Ostrava",
        competition: "1. liga muži",
        venue: "Sportovní hala Svinov",
        isHome: true,
        status: "upcoming"
      },
      {
        id: 2,
        date: "2024-10-05",
        time: "14:30",
        homeTeam: "TJ Sokol Frýdek-Místek",
        awayTeam: "TJ Sokol Svinov",
        competition: "1. liga muži",
        venue: "Sportovní hala Frýdek-Místek",
        isHome: false,
        status: "upcoming"
      }
    ],
    recentResults: [
      {
        id: 1,
        date: "2024-09-21",
        homeTeam: "TJ Sokol Svinov",
        awayTeam: "TJ Sokol Poruba",
        homeScore: 18,
        awayScore: 12,
        competition: "1. liga muži",
        result: "win",
        status: "completed"
      },
      {
        id: 2,
        date: "2024-09-14",
        homeTeam: "TJ Sokol Klimkovice",
        awayTeam: "TJ Sokol Svinov",
        homeScore: 14,
        awayScore: 16,
        competition: "1. liga muži",
        result: "win",
        status: "completed"
      }
    ],
    teamStandings: [
      {
        position: 1,
        team: "TJ Sokol Svinov",
        matches: 3,
        wins: 2,
        draws: 1,
        losses: 0,
        goalsFor: 49,
        goalsAgainst: 41,
        points: 5
      },
      {
        position: 2,
        team: "TJ Sokol Ostrava",
        matches: 3,
        wins: 2,
        draws: 0,
        losses: 1,
        goalsFor: 45,
        goalsAgainst: 38,
        points: 4
      }
    ]
  },
  women: {
    name: "Ženy",
    upcomingMatches: [
      {
        id: 1,
        date: "2024-09-29",
        time: "16:00",
        homeTeam: "TJ Sokol Svinov",
        awayTeam: "TJ Sokol Poruba",
        competition: "1. liga ženy",
        venue: "Sportovní hala Svinov",
        isHome: true,
        status: "upcoming"
      }
    ],
    recentResults: [
      {
        id: 1,
        date: "2024-09-22",
        homeTeam: "TJ Sokol Svinov",
        awayTeam: "TJ Sokol Ostrava",
        homeScore: 16,
        awayScore: 14,
        competition: "1. liga ženy",
        result: "win",
        status: "completed"
      }
    ],
    teamStandings: [
      {
        position: 1,
        team: "TJ Sokol Svinov",
        matches: 2,
        wins: 2,
        draws: 0,
        losses: 0,
        goalsFor: 32,
        goalsAgainst: 28,
        points: 4
      }
    ]
  },
  juniorBoys: {
    name: "Dorostenci",
    upcomingMatches: [
      {
        id: 1,
        date: "2024-09-30",
        time: "17:00",
        homeTeam: "TJ Sokol Svinov",
        awayTeam: "TJ Sokol Karviná",
        competition: "Dorostenecká liga",
        venue: "Sportovní hala Svinov",
        isHome: true,
        status: "upcoming"
      }
    ],
    recentResults: [
      {
        id: 1,
        date: "2024-09-23",
        homeTeam: "TJ Sokol Frýdek-Místek",
        awayTeam: "TJ Sokol Svinov",
        homeScore: 12,
        awayScore: 15,
        competition: "Dorostenecká liga",
        result: "win",
        status: "completed"
      }
    ],
    teamStandings: [
      {
        position: 1,
        team: "TJ Sokol Svinov",
        matches: 2,
        wins: 2,
        draws: 0,
        losses: 0,
        goalsFor: 30,
        goalsAgainst: 22,
        points: 4
      }
    ]
  },
  juniorGirls: {
    name: "Dorostenky",
    upcomingMatches: [
      {
        id: 1,
        date: "2024-10-01",
        time: "18:00",
        homeTeam: "TJ Sokol Svinov",
        awayTeam: "TJ Sokol Bohumín",
        competition: "Dorostenecká liga žen",
        venue: "Sportovní hala Svinov",
        isHome: true,
        status: "upcoming"
      }
    ],
    recentResults: [
      {
        id: 1,
        date: "2024-09-24",
        homeTeam: "TJ Sokol Svinov",
        awayTeam: "TJ Sokol Klimkovice",
        homeScore: 14,
        awayScore: 10,
        competition: "Dorostenecká liga žen",
        result: "win",
        status: "completed"
      }
    ],
    teamStandings: [
      {
        position: 1,
        team: "TJ Sokol Svinov",
        matches: 2,
        wins: 2,
        draws: 0,
        losses: 0,
        goalsFor: 28,
        goalsAgainst: 18,
        points: 4
      }
    ]
  }
};

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

export const MatchSchedule = () => {
  const [selectedCategory, setSelectedCategory] = React.useState("men");
  const currentData = categoryData[selectedCategory as keyof typeof categoryData];

  return (
    <div className="space-y-8">
      {/* Main Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          VÝSLEDKY & AKTUÁLNÍ PROGRAM
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Sledujte výsledky našich týmů a program nadcházejících zápasů
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs 
        selectedKey={selectedCategory} 
        onSelectionChange={(key) => setSelectedCategory(key as string)}
        className="w-full"
        color="primary"
        variant="underlined"
      >
        <Tab key="men" title="Muži" />
        <Tab key="women" title="Ženy" />
        <Tab key="juniorBoys" title="Dorostenci" />
        <Tab key="juniorGirls" title="Dorostenky" />
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Matches */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-semibold">Nadcházející zápasy</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {currentData.upcomingMatches.map((match: any) => (
                <div key={match.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(match.date).toLocaleDateString('cs-CZ')} v {match.time}
                      </span>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${match.isHome ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {match.homeTeam}
                      </span>
                      <span className="text-gray-500">vs</span>
                      <span className={`font-semibold ${!match.isHome ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {match.awayTeam}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{match.venue}</span>
                    </div>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {match.competition}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <Button 
                color="primary" 
                variant="bordered"
                size="sm"
              >
                Zobrazit celý program
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              <h3 className="text-xl font-semibold">Poslední výsledky</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {currentData.recentResults.map((match: any) => (
                <div key={match.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(match.date).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                    {getResultBadge(match.result)}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{match.homeTeam}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {match.homeScore}
                        </span>
                        <span className="text-gray-500">:</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {match.awayScore}
                        </span>
                      </div>
                      <span className="font-semibold">{match.awayTeam}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {match.competition}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <Button 
                color="primary" 
                variant="bordered"
                size="sm"
              >
                Zobrazit všechny výsledky
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Team Standings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-green-500" />
            <h3 className="text-xl font-semibold">Tabulka - {currentData.name}</h3>
          </div>
        </CardHeader>
        <CardBody>
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
                {currentData.teamStandings.map((team: any) => (
                  <tr key={team.position} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2 px-2 font-semibold">{team.position}.</td>
                    <td className="py-2 px-2 font-medium">{team.team}</td>
                    <td className="py-2 px-2 text-center">{team.matches}</td>
                    <td className="py-2 px-2 text-center text-green-600">{team.wins}</td>
                    <td className="py-2 px-2 text-center text-yellow-600">{team.draws}</td>
                    <td className="py-2 px-2 text-center text-red-600">{team.losses}</td>
                    <td className="py-2 px-2 text-center">{team.goalsFor}:{team.goalsAgainst}</td>
                    <td className="py-2 px-2 text-center font-bold">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-center">
            <Button 
              color="primary" 
              variant="bordered"
              size="sm"
            >
              Zobrazit kompletní tabulku
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
