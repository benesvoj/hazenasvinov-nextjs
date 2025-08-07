'use client';

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { Badge } from "@heroui/badge";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  TrophyIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";

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
  created_at: string;
  updated_at: string;
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

const categories = {
  men: { name: "Muži", competition: "1. liga muži" },
  women: { name: "Ženy", competition: "1. liga ženy" },
  juniorBoys: { name: "Dorostenci", competition: "Dorostenecká liga" },
  juniorGirls: { name: "Dorostenky", competition: "Dorostenecká liga žen" }
};

export default function MatchesAdminPage() {
  const [selectedCategory, setSelectedCategory] = useState("men");
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isAddMatchOpen, onOpen: onAddMatchOpen, onClose: onAddMatchClose } = useDisclosure();
  const { isOpen: isEditMatchOpen, onOpen: onEditMatchOpen, onClose: onEditMatchClose } = useDisclosure();
  const { isOpen: isAddResultOpen, onOpen: onAddResultOpen, onClose: onAddResultClose } = useDisclosure();
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    home_team: '',
    away_team: '',
    venue: '',
    is_home: true
  });
  const [resultData, setResultData] = useState({
    home_score: '',
    away_score: ''
  });

  const supabase = createClient();

  // Fetch matches
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('category', selectedCategory)
        .order('date', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      setError('Chyba při načítání zápasů');
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch standings
  const fetchStandings = async () => {
    try {
      const { data, error } = await supabase
        .from('standings')
        .select('*')
        .eq('category', selectedCategory)
        .order('position', { ascending: true });

      if (error) throw error;
      setStandings(data || []);
    } catch (error) {
      console.error('Error fetching standings:', error);
    }
  };

  // Calculate standings from matches
  const calculateStandings = async () => {
    try {
      const completedMatches = matches.filter(match => match.status === 'completed');
      const teams = new Map<string, Standing>();

      // Initialize teams
      completedMatches.forEach(match => {
        if (!teams.has(match.home_team)) {
          teams.set(match.home_team, {
            position: 0,
            team: match.home_team,
            matches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          });
        }
        if (!teams.has(match.away_team)) {
          teams.set(match.away_team, {
            position: 0,
            team: match.away_team,
            matches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          });
        }
      });

      // Calculate statistics
      completedMatches.forEach(match => {
        const homeTeam = teams.get(match.home_team)!;
        const awayTeam = teams.get(match.away_team)!;

        homeTeam.matches++;
        awayTeam.matches++;
        homeTeam.goals_for += match.home_score || 0;
        homeTeam.goals_against += match.away_score || 0;
        awayTeam.goals_for += match.away_score || 0;
        awayTeam.goals_against += match.home_score || 0;

        if (match.result === 'win') {
          homeTeam.wins++;
          awayTeam.losses++;
          homeTeam.points += 2;
        } else if (match.result === 'loss') {
          homeTeam.losses++;
          awayTeam.wins++;
          awayTeam.points += 2;
        } else if (match.result === 'draw') {
          homeTeam.draws++;
          awayTeam.draws++;
          homeTeam.points += 1;
          awayTeam.points += 1;
        }
      });

      // Sort by points, then goal difference
      const sortedTeams = Array.from(teams.values()).sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        const aGoalDiff = a.goals_for - a.goals_against;
        const bGoalDiff = b.goals_for - b.goals_against;
        if (aGoalDiff !== bGoalDiff) return bGoalDiff - aGoalDiff;
        return b.goals_for - a.goals_for;
      });

      // Update positions
      sortedTeams.forEach((team, index) => {
        team.position = index + 1;
      });

      // Save to database - use upsert to handle existing records
      const { error } = await supabase
        .from('standings')
        .upsert(sortedTeams.map(team => ({
          ...team,
          category: selectedCategory
        })), {
          onConflict: 'category,team'
        });

      if (error) throw error;
      setStandings(sortedTeams);
    } catch (error) {
      console.error('Error calculating standings:', error);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchStandings();
  }, [selectedCategory]);

  // Add new match
  const handleAddMatch = async () => {
    try {
      const { error } = await supabase
        .from('matches')
        .insert({
          category: selectedCategory,
          date: formData.date,
          time: formData.time,
          home_team: formData.home_team,
          away_team: formData.away_team,
          venue: formData.venue,
          competition: categories[selectedCategory as keyof typeof categories].competition,
          is_home: formData.is_home,
          status: 'upcoming'
        });

      if (error) throw error;
      
      onAddMatchClose();
      setFormData({
        date: '',
        time: '',
        home_team: '',
        away_team: '',
        venue: '',
        is_home: true
      });
      fetchMatches();
    } catch (error) {
      setError('Chyba při přidávání zápasu');
      console.error('Error adding match:', error);
    }
  };

  // Update match result
  const handleUpdateResult = async () => {
    if (!selectedMatch) return;

    try {
      const homeScore = parseInt(resultData.home_score);
      const awayScore = parseInt(resultData.away_score);
      let result: 'win' | 'loss' | 'draw';

      if (homeScore > awayScore) {
        result = 'win';
      } else if (homeScore < awayScore) {
        result = 'loss';
      } else {
        result = 'draw';
      }

      const { error } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          result: result,
          status: 'completed'
        })
        .eq('id', selectedMatch.id);

      if (error) throw error;
      
      onAddResultClose();
      setResultData({ home_score: '', away_score: '' });
      setSelectedMatch(null);
      fetchMatches();
      calculateStandings();
    } catch (error) {
      setError('Chyba při aktualizaci výsledku');
      console.error('Error updating result:', error);
    }
  };

  // Delete match
  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Opravdu chcete smazat tento zápas?')) return;

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;
      fetchMatches();
      calculateStandings();
    } catch (error) {
      setError('Chyba při mazání zápasu');
      console.error('Error deleting match:', error);
    }
  };

  const getResultBadge = (result: string) => {
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
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge color="primary" variant="flat">Nadcházející</Badge>;
      case 'completed':
        return <Badge color="default" variant="flat">Dokončeno</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Správa zápasů
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Spravujte zápasy, výsledky a tabulky pro všechny kategorie
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

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {categories[selectedCategory as keyof typeof categories].name} - 
          {categories[selectedCategory as keyof typeof categories].competition}
        </h2>
        <Button 
          color="primary" 
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={onAddMatchOpen}
        >
          Přidat zápas
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Matches List */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Seznam zápasů</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
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
                      {match.status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {match.home_score}
                          </span>
                          <span className="text-gray-500">:</span>
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {match.away_score}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {match.status === 'completed' && getResultBadge(match.result!)}
                      {getStatusBadge(match.status)}
                      <div className="flex gap-1">
                        {match.status === 'upcoming' && (
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<PencilIcon className="w-3 h-3" />}
                            onPress={() => {
                              setSelectedMatch(match);
                              onAddResultOpen();
                            }}
                          >
                            Výsledek
                          </Button>
                        )}
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          startContent={<TrashIcon className="w-3 h-3" />}
                          onPress={() => handleDeleteMatch(match.id)}
                        >
                          Smazat
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {matches.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Žádné zápasy nebyly nalezeny
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Standings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Tabulka</h3>
            <Button 
              color="secondary" 
              variant="flat"
              onPress={calculateStandings}
            >
              Přepočítat tabulku
            </Button>
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
          </div>
        </CardBody>
      </Card>

      {/* Add Match Modal */}
      <Modal isOpen={isAddMatchOpen} onClose={onAddMatchClose}>
        <ModalContent>
          <ModalHeader>Přidat nový zápas</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Datum"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
              <Input
                label="Čas"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
              <Input
                label="Domácí tým"
                value={formData.home_team}
                onChange={(e) => setFormData({...formData, home_team: e.target.value})}
              />
              <Input
                label="Hostující tým"
                value={formData.away_team}
                onChange={(e) => setFormData({...formData, away_team: e.target.value})}
              />
              <Input
                label="Místo konání"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onAddMatchClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleAddMatch}>
              Přidat zápas
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Result Modal */}
      <Modal isOpen={isAddResultOpen} onClose={onAddResultClose}>
        <ModalContent>
          <ModalHeader>Přidat výsledek</ModalHeader>
          <ModalBody>
            {selectedMatch && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">{selectedMatch.home_team} vs {selectedMatch.away_team}</h3>
                  <p className="text-sm text-gray-600">{new Date(selectedMatch.date).toLocaleDateString('cs-CZ')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    label={`Skóre ${selectedMatch.home_team}`}
                    type="number"
                    value={resultData.home_score}
                    onChange={(e) => setResultData({...resultData, home_score: e.target.value})}
                  />
                  <span className="text-2xl font-bold">:</span>
                  <Input
                    label={`Skóre ${selectedMatch.away_team}`}
                    type="number"
                    value={resultData.away_score}
                    onChange={(e) => setResultData({...resultData, away_score: e.target.value})}
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onAddResultClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateResult}>
              Uložit výsledek
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
