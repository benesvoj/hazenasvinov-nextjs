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
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

// Sample match data organized by months - in a real app, this would come from a database
const matchScheduleData = {
  men: {
    name: "Muži",
    competition: "1. liga muži",
    matches: {
      "září 2024": [
        {
          id: 1,
          date: "2024-09-21",
          time: "15:00",
          homeTeam: "TJ Sokol Svinov",
          awayTeam: "TJ Sokol Ostrava",
          venue: "Sportovní hala Svinov",
          isHome: true,
          status: "completed",
          homeScore: 18,
          awayScore: 12,
          result: "win"
        },
        {
          id: 2,
          date: "2024-09-28",
          time: "16:30",
          homeTeam: "TJ Sokol Frýdek-Místek",
          awayTeam: "TJ Sokol Svinov",
          venue: "Sportovní hala Frýdek-Místek",
          isHome: false,
          status: "upcoming"
        }
      ],
      "říjen 2024": [
        {
          id: 3,
          date: "2024-10-05",
          time: "15:00",
          homeTeam: "TJ Sokol Svinov",
          awayTeam: "TJ Sokol Karviná",
          venue: "Sportovní hala Svinov",
          isHome: true,
          status: "upcoming"
        },
        {
          id: 4,
          date: "2024-10-12",
          time: "14:30",
          homeTeam: "TJ Sokol Poruba",
          awayTeam: "TJ Sokol Svinov",
          venue: "Sportovní hala Poruba",
          isHome: false,
          status: "upcoming"
        },
        {
          id: 5,
          date: "2024-10-19",
          time: "16:00",
          homeTeam: "TJ Sokol Svinov",
          awayTeam: "TJ Sokol Klimkovice",
          venue: "Sportovní hala Svinov",
          isHome: true,
          status: "upcoming"
        }
      ],
      "listopad 2024": [
        {
          id: 6,
          date: "2024-11-02",
          time: "15:30",
          homeTeam: "TJ Sokol Bohumín",
          awayTeam: "TJ Sokol Svinov",
          venue: "Sportovní hala Bohumín",
          isHome: false,
          status: "upcoming"
        },
        {
          id: 7,
          date: "2024-11-09",
          time: "15:00",
          homeTeam: "TJ Sokol Svinov",
          awayTeam: "TJ Sokol Havířov",
          venue: "Sportovní hala Svinov",
          isHome: true,
          status: "upcoming"
        }
      ]
    }
  },
  women: {
    name: "Ženy",
    competition: "1. liga ženy",
    matches: {
      "září 2024": [
        {
          id: 1,
          date: "2024-09-22",
          time: "16:00",
          homeTeam: "TJ Sokol Svinov",
          awayTeam: "TJ Sokol Ostrava",
          venue: "Sportovní hala Svinov",
          isHome: true,
          status: "completed",
          homeScore: 16,
          awayScore: 14,
          result: "win"
        }
      ],
      "říjen 2024": [
        {
          id: 2,
          date: "2024-10-06",
          time: "15:30",
          homeTeam: "TJ Sokol Poruba",
          awayTeam: "TJ Sokol Svinov",
          venue: "Sportovní hala Poruba",
          isHome: false,
          status: "upcoming"
        }
      ]
    }
  },
  juniorBoys: {
    name: "Dorostenci",
    competition: "Dorostenecká liga",
    matches: {
      "září 2024": [
        {
          id: 1,
          date: "2024-09-23",
          time: "17:00",
          homeTeam: "TJ Sokol Frýdek-Místek",
          awayTeam: "TJ Sokol Svinov",
          venue: "Sportovní hala Frýdek-Místek",
          isHome: false,
          status: "completed",
          homeScore: 12,
          awayScore: 15,
          result: "win"
        }
      ],
      "říjen 2024": [
        {
          id: 2,
          date: "2024-10-07",
          time: "18:00",
          homeTeam: "TJ Sokol Svinov",
          awayTeam: "TJ Sokol Karviná",
          venue: "Sportovní hala Svinov",
          isHome: true,
          status: "upcoming"
        }
      ]
    }
  },
  juniorGirls: {
    name: "Dorostenky",
    competition: "Dorostenecká liga žen",
    matches: {
      "září 2024": [
        {
          id: 1,
          date: "2024-09-24",
          time: "18:00",
          homeTeam: "TJ Sokol Svinov",
          awayTeam: "TJ Sokol Klimkovice",
          venue: "Sportovní hala Svinov",
          isHome: true,
          status: "completed",
          homeScore: 14,
          awayScore: 10,
          result: "win"
        }
      ],
      "říjen 2024": [
        {
          id: 2,
          date: "2024-10-08",
          time: "17:30",
          homeTeam: "TJ Sokol Bohumín",
          awayTeam: "TJ Sokol Svinov",
          venue: "Sportovní hala Bohumín",
          isHome: false,
          status: "upcoming"
        }
      ]
    }
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

export const MatchSchedulePage = () => {
  const [selectedCategory, setSelectedCategory] = React.useState("men");
  const [selectedSubTab, setSelectedSubTab] = React.useState("overview");
  const currentData = matchScheduleData[selectedCategory as keyof typeof matchScheduleData];
  const [filterType, setFilterType] = React.useState("all");

  const filteredMatches = React.useMemo(() => {
    const allMatches: any[] = [];
    Object.entries(currentData.matches).forEach(([month, matches]) => {
      matches.forEach((match: any) => {
        allMatches.push({ ...match, month });
      });
    });

    switch (filterType) {
      case "past":
        return allMatches.filter(match => match.status === "completed");
      case "future":
        return allMatches.filter(match => match.status === "upcoming");
      default:
        return allMatches;
    }
  }, [currentData, filterType]);

  const groupedMatches = React.useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    filteredMatches.forEach(match => {
      if (!grouped[match.month]) {
        grouped[match.month] = [];
      }
      grouped[match.month].push(match);
    });
    return grouped;
  }, [filteredMatches]);

  // Sample standings data for each category
  const standingsData = {
    men: [
      { position: 1, team: "TJ Sokol Svinov", matches: 3, wins: 2, draws: 1, losses: 0, goalsFor: 49, goalsAgainst: 41, points: 5 },
      { position: 2, team: "TJ Sokol Ostrava", matches: 3, wins: 2, draws: 0, losses: 1, goalsFor: 45, goalsAgainst: 38, points: 4 },
      { position: 3, team: "TJ Sokol Frýdek-Místek", matches: 3, wins: 1, draws: 1, losses: 1, goalsFor: 42, goalsAgainst: 40, points: 3 },
      { position: 4, team: "TJ Sokol Karviná", matches: 3, wins: 1, draws: 0, losses: 2, goalsFor: 38, goalsAgainst: 42, points: 2 },
      { position: 5, team: "TJ Sokol Poruba", matches: 3, wins: 0, draws: 2, losses: 1, goalsFor: 35, goalsAgainst: 37, points: 2 },
      { position: 6, team: "TJ Sokol Klimkovice", matches: 3, wins: 0, draws: 1, losses: 2, goalsFor: 32, goalsAgainst: 40, points: 1 },
      { position: 7, team: "TJ Sokol Bohumín", matches: 3, wins: 0, draws: 1, losses: 2, goalsFor: 30, goalsAgainst: 38, points: 1 },
      { position: 8, team: "TJ Sokol Havířov", matches: 3, wins: 0, draws: 0, losses: 3, goalsFor: 28, goalsAgainst: 45, points: 0 },
      { position: 9, team: "TJ Sokol Třinec", matches: 3, wins: 0, draws: 0, losses: 3, goalsFor: 25, goalsAgainst: 42, points: 0 },
      { position: 10, team: "TJ Sokol Opava", matches: 3, wins: 0, draws: 0, losses: 3, goalsFor: 22, goalsAgainst: 48, points: 0 },
      { position: 11, team: "TJ Sokol Krnov", matches: 3, wins: 0, draws: 0, losses: 3, goalsFor: 20, goalsAgainst: 50, points: 0 },
      { position: 12, team: "TJ Sokol Bruntál", matches: 3, wins: 0, draws: 0, losses: 3, goalsFor: 18, goalsAgainst: 52, points: 0 }
    ],
    women: [
      { position: 1, team: "TJ Sokol Svinov", matches: 2, wins: 2, draws: 0, losses: 0, goalsFor: 32, goalsAgainst: 28, points: 4 },
      { position: 2, team: "TJ Sokol Ostrava", matches: 2, wins: 1, draws: 1, losses: 0, goalsFor: 30, goalsAgainst: 25, points: 3 },
      { position: 3, team: "TJ Sokol Frýdek-Místek", matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 28, goalsAgainst: 26, points: 2 },
      { position: 4, team: "TJ Sokol Karviná", matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 26, goalsAgainst: 24, points: 2 },
      { position: 5, team: "TJ Sokol Poruba", matches: 2, wins: 0, draws: 1, losses: 1, goalsFor: 24, goalsAgainst: 26, points: 1 },
      { position: 6, team: "TJ Sokol Klimkovice", matches: 2, wins: 0, draws: 1, losses: 1, goalsFor: 22, goalsAgainst: 28, points: 1 },
      { position: 7, team: "TJ Sokol Bohumín", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 20, goalsAgainst: 30, points: 0 },
      { position: 8, team: "TJ Sokol Havířov", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 18, goalsAgainst: 32, points: 0 },
      { position: 9, team: "TJ Sokol Třinec", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 16, goalsAgainst: 34, points: 0 },
      { position: 10, team: "TJ Sokol Opava", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 14, goalsAgainst: 36, points: 0 },
      { position: 11, team: "TJ Sokol Krnov", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 12, goalsAgainst: 38, points: 0 },
      { position: 12, team: "TJ Sokol Bruntál", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 10, goalsAgainst: 40, points: 0 }
    ],
    juniorBoys: [
      { position: 1, team: "TJ Sokol Svinov", matches: 2, wins: 2, draws: 0, losses: 0, goalsFor: 30, goalsAgainst: 22, points: 4 },
      { position: 2, team: "TJ Sokol Ostrava", matches: 2, wins: 1, draws: 1, losses: 0, goalsFor: 28, goalsAgainst: 20, points: 3 },
      { position: 3, team: "TJ Sokol Frýdek-Místek", matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 26, goalsAgainst: 24, points: 2 },
      { position: 4, team: "TJ Sokol Karviná", matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 24, goalsAgainst: 22, points: 2 },
      { position: 5, team: "TJ Sokol Poruba", matches: 2, wins: 0, draws: 1, losses: 1, goalsFor: 22, goalsAgainst: 24, points: 1 },
      { position: 6, team: "TJ Sokol Klimkovice", matches: 2, wins: 0, draws: 1, losses: 1, goalsFor: 20, goalsAgainst: 26, points: 1 },
      { position: 7, team: "TJ Sokol Bohumín", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 18, goalsAgainst: 28, points: 0 },
      { position: 8, team: "TJ Sokol Havířov", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 16, goalsAgainst: 30, points: 0 },
      { position: 9, team: "TJ Sokol Třinec", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 14, goalsAgainst: 32, points: 0 },
      { position: 10, team: "TJ Sokol Opava", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 12, goalsAgainst: 34, points: 0 },
      { position: 11, team: "TJ Sokol Krnov", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 10, goalsAgainst: 36, points: 0 },
      { position: 12, team: "TJ Sokol Bruntál", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 8, goalsAgainst: 38, points: 0 }
    ],
    juniorGirls: [
      { position: 1, team: "TJ Sokol Svinov", matches: 2, wins: 2, draws: 0, losses: 0, goalsFor: 28, goalsAgainst: 18, points: 4 },
      { position: 2, team: "TJ Sokol Ostrava", matches: 2, wins: 1, draws: 1, losses: 0, goalsFor: 26, goalsAgainst: 16, points: 3 },
      { position: 3, team: "TJ Sokol Frýdek-Místek", matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 24, goalsAgainst: 20, points: 2 },
      { position: 4, team: "TJ Sokol Karviná", matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 22, goalsAgainst: 18, points: 2 },
      { position: 5, team: "TJ Sokol Poruba", matches: 2, wins: 0, draws: 1, losses: 1, goalsFor: 20, goalsAgainst: 22, points: 1 },
      { position: 6, team: "TJ Sokol Klimkovice", matches: 2, wins: 0, draws: 1, losses: 1, goalsFor: 18, goalsAgainst: 24, points: 1 },
      { position: 7, team: "TJ Sokol Bohumín", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 16, goalsAgainst: 26, points: 0 },
      { position: 8, team: "TJ Sokol Havířov", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 14, goalsAgainst: 28, points: 0 },
      { position: 9, team: "TJ Sokol Třinec", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 12, goalsAgainst: 30, points: 0 },
      { position: 10, team: "TJ Sokol Opava", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 10, goalsAgainst: 32, points: 0 },
      { position: 11, team: "TJ Sokol Krnov", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 8, goalsAgainst: 34, points: 0 },
      { position: 12, team: "TJ Sokol Bruntál", matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 6, goalsAgainst: 36, points: 0 }
    ]
  };

  const currentStandings = standingsData[selectedCategory as keyof typeof standingsData];

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
                <div><span className="font-medium">Kategorie:</span> {currentData.name}</div>
                <div><span className="font-medium">Soutěž:</span> {currentData.competition}</div>
                <div><span className="font-medium">Sezóna:</span> 2024/2025</div>
                <div><span className="font-medium">Trenér:</span> Jan Novák</div>
                <div><span className="font-medium">Asistent:</span> Petr Svoboda</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Statistiky sezóny</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Zápasy:</span> {currentStandings[0]?.matches || 0}</div>
                <div><span className="font-medium">Výhry:</span> {currentStandings[0]?.wins || 0}</div>
                <div><span className="font-medium">Remízy:</span> {currentStandings[0]?.draws || 0}</div>
                <div><span className="font-medium">Prohry:</span> {currentStandings[0]?.losses || 0}</div>
                <div><span className="font-medium">Skóre:</span> {currentStandings[0]?.goalsFor || 0}:{currentStandings[0]?.goalsAgainst || 0}</div>
                <div><span className="font-medium">Body:</span> {currentStandings[0]?.points || 0}</div>
              </div>
            </div>
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
            {filteredMatches
              .filter(match => match.status === "completed")
              .slice(0, 3)
              .map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(match.date).toLocaleDateString('cs-CZ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={match.isHome ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                        {match.homeTeam}
                      </span>
                      <span className="text-gray-500">vs</span>
                      <span className={!match.isHome ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                        {match.awayTeam}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {match.homeScore}
                      </span>
                      <span className="text-gray-500">:</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {match.awayScore}
                      </span>
                    </div>
                    {getResultBadge(match.result)}
                  </div>
                </div>
              ))}
          </div>
        </CardBody>
      </Card>

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
            {filteredMatches
              .filter(match => match.status === "upcoming")
              .slice(0, 3)
              .map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(match.date).toLocaleDateString('cs-CZ')} v {match.time}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={match.isHome ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                        {match.homeTeam}
                      </span>
                      <span className="text-gray-500">vs</span>
                      <span className={!match.isHome ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                        {match.awayTeam}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {match.venue}
                    </span>
                    {getStatusBadge(match.status)}
                  </div>
                </div>
              ))}
          </div>
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
      <div className="space-y-8">
        {Object.entries(groupedMatches)
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
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          {/* Date and Time */}
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-gray-500" />
                            <div>
                              <div className="font-semibold">
                                {new Date(match.date).toLocaleDateString('cs-CZ', { 
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                })}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {match.time}
                              </div>
                            </div>
                          </div>

                          {/* Teams */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-4">
                              <div className={`text-right ${match.isHome ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                                {match.homeTeam}
                              </div>
                              <div className="text-gray-500">vs</div>
                              <div className={`text-left ${!match.isHome ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                                {match.awayTeam}
                              </div>
                            </div>
                            {match.status === "completed" && (
                              <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {match.homeScore}
                                </span>
                                <span className="text-gray-500">:</span>
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {match.awayScore}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Venue and Status */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {match.venue}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {match.status === "completed" && getResultBadge(match.result)}
                              {getStatusBadge(match.status)}
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
      </div>

      {/* No Matches Message */}
      {Object.keys(groupedMatches).length === 0 && (
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
  );

  const renderStandings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-green-500" />
            <h3 className="text-xl font-semibold">Tabulka - {currentData.competition}</h3>
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
                {currentStandings.map((team) => (
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
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {currentData.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentData.competition}
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
};
