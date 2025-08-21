'use client';

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  ArrowLeftIcon,
  TrophyIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import Link from "@/components/Link";
import { useParams } from "next/navigation";
import Image from 'next/image';
import { formatTime } from "@/helpers/formatTime";
import { Match } from "@/types/types";
import { translations } from "@/lib/translations";
import { useLineupData } from "@/hooks/useLineupData";

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

export default function MatchDetailPage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeLineup, setHomeLineup] = useState<any>(null);
  const [awayLineup, setAwayLineup] = useState<any>(null);
  const [lineupLoading, setLineupLoading] = useState(false);
  
  const params = useParams();
  const matchId = params.id as string;
  
  const supabase = createClient();
  const { fetchLineup, getLineupSummary } = useLineupData();

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(name, logo_url, is_own_club),
            away_team:away_team_id(name, logo_url, is_own_club),
            category:categories(code, name, description),
            season:seasons(name)
          `)
          .eq('id', matchId)
          .single();

        if (error) {
          console.error('Error fetching match:', error);
          setError('Zápas nebyl nalezen');
          return;
        }

        setMatch(data);
      } catch (error) {
        console.error('Error fetching match:', error);
        setError('Chyba při načítání zápasu');
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatch();
    }
  }, [matchId, supabase]);

  // Fetch lineup data when match is loaded
  useEffect(() => {
    const fetchLineupData = async () => {
      if (!match) return;
      
      try {
        setLineupLoading(true);
        
        // Fetch home team lineup
        const homeLineupData = await fetchLineup(match.id, match.home_team_id);
        setHomeLineup(homeLineupData);
        
        // Fetch away team lineup
        const awayLineupData = await fetchLineup(match.id, match.away_team_id);
        setAwayLineup(awayLineupData);
        
      } catch (error) {
        console.error('Error fetching lineup data:', error);
        // Don't set error state for lineup - it's optional data
      } finally {
        setLineupLoading(false);
      }
    };

    fetchLineupData();
  }, [match, fetchLineup]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{translations.matchDetail.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="mb-4">
            <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Zápas nebyl nalezen
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Požadovaný zápas neexistuje nebo byl odstraněn.'}
          </p>
          <Button 
            as={Link} 
            href={`/matches${match?.category?.code ? `?category=${match.category.code}` : ''}`}
            color="primary"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Zpět na zápasy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          as={Link} 
          href={`/matches${match?.category?.code ? `?category=${match.category.code}` : ''}`}
          variant="light" 
          color="primary"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Zpět na zápasy
        </Button>
        <div className="flex gap-2">
          {getStatusBadge(match.status)}
          {match.status === "completed" && getResultBadge(match.result!)}
        </div>
      </div>

      {/* Match Header */}
      <Card>
        <CardBody className="p-8">
          <div className="text-center space-y-6">
            {/* Competition Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {match.category.name} {match.category.description} {match.matchweek && (`- ${match.matchweek}. kolo`)}  
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {match.season?.name}
              </p>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-3 items-center gap-8">
              {/* Home Team */}
              <div className="flex flex-col items-center space-y-3">
                {match.home_team.logo_url && (
                  <Image 
                    src={match.home_team.logo_url} 
                    alt={`${match.home_team.name} logo`}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-contain rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="text-center">
                  <h2 className={`text-xl font-bold ${match.home_team.is_own_club ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {match.home_team.name}
                  </h2>
                  {match.home_team.is_own_club && (
                    <Badge color="primary" variant="flat" size="sm">Náš klub</Badge>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center space-y-2">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {match.status === "completed" 
                    ? `${match.home_score || 0} : ${match.away_score || 0}`
                    : "vs"
                  }
                </div>
                {match.status === "upcoming" && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Zápas ještě nezačal
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center space-y-3">
                {match.away_team.logo_url && (
                  <Image 
                    src={match.away_team.logo_url} 
                    alt={`${match.away_team.name} logo`}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-contain rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="text-center">
                  <h2 className={`text-xl font-bold ${match.away_team.is_own_club ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {match.away_team.name}
                  </h2>
                  {match.away_team.is_own_club && (
                    <Badge color="primary" variant="flat" size="sm">Náš klub</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Match Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date and Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Datum a čas</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-semibold">
                    {new Date(match.date).toLocaleDateString('cs-CZ', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(match.date).toLocaleDateString('cs-CZ', { 
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-semibold">
                    {formatTime(match.time)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Čas začátku
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Venue */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold">Místo konání</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-3">
              <MapPinIcon className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-semibold">
                  {match.venue}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Sportovní hala
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Match Statistics (if completed) */}
      {match.status === "completed" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Výsledek zápasu</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {match.home_score || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {match.home_team.name}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-2xl font-bold text-gray-400">:</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {match.away_score || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {match.away_team.name}
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              {getResultBadge(match.result!)}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Lineup Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Home Team Lineup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Sestava - {match.home_team.name}</h3>
            </div>
          </CardHeader>
          <CardBody>
            {lineupLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Načítání sestavy...</p>
              </div>
            ) : homeLineup && (homeLineup.players.length > 0 || homeLineup.coaches.length > 0) ? (
              <div className="space-y-4">
                {/* Players */}
                {homeLineup.players.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Hráči ({homeLineup.players.length})
                    </h4>
                    <div className="space-y-2">
                      {homeLineup.players.map((player: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {player.display_name || `${player.external_name || 'Neznámý'} ${player.external_surname || ''}`}
                            </span>
                            {player.is_external && (
                              <Badge color="warning" variant="flat" size="sm">Externí</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge 
                              color={player.position === 'goalkeeper' ? 'primary' : 'default'} 
                              variant="flat" 
                              size="sm"
                            >
                              {player.position === 'goalkeeper' ? 'Brankář' : 'Hráč v poli'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Coaches */}
                {homeLineup.coaches.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Trenéři ({homeLineup.coaches.length})
                    </h4>
                    <div className="space-y-2">
                      {homeLineup.coaches.map((coach: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm font-medium">
                            {coach.member ? `${coach.member.name} ${coach.member.surname}` : 'Neznámý trenér'}
                          </span>
                          <Badge 
                            color="secondary" 
                            variant="flat" 
                            size="sm"
                          >
                            {coach.role === 'head_coach' ? 'Hlavní trenér' : 
                             coach.role === 'assistant_coach' ? 'Asistent' : 
                             coach.role === 'goalkeeper_coach' ? 'Trenér brankářů' : coach.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {homeLineup.players.length === 0 && homeLineup.coaches.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Sestava zatím nebyla vytvořena
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Sestava zatím nebyla vytvořena
              </div>
            )}
          </CardBody>
        </Card>

        {/* Away Team Lineup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold">Sestava - {match.away_team.name}</h3>
            </div>
          </CardHeader>
          <CardBody>
            {lineupLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Načítání sestavy...</p>
              </div>
            ) : awayLineup && (awayLineup.players.length > 0 || awayLineup.coaches.length > 0) ? (
              <div className="space-y-4">
                {/* Players */}
                {awayLineup.players.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Hráči ({awayLineup.players.length})
                    </h4>
                    <div className="space-y-2">
                      {awayLineup.players.map((player: any, index: number) => (
                                                 <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-medium">
                               {player.display_name || `${player.external_name || 'Neznámý'} ${player.external_surname || ''}`}
                             </span>
                             {player.is_external && (
                               <Badge color="warning" variant="flat" size="sm">Externí</Badge>
                             )}
                           </div>
                           <div className="flex gap-2">
                             <Badge 
                               color={player.position === 'goalkeeper' ? 'primary' : 'default'} 
                               variant="flat" 
                               size="sm"
                             >
                               {player.position === 'goalkeeper' ? 'Brankář' : 'Hráč v poli'}
                             </Badge>
                           </div>
                         </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Coaches */}
                {awayLineup.coaches.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Trenéři ({awayLineup.coaches.length})
                    </h4>
                    <div className="space-y-2">
                      {awayLineup.coaches.map((coach: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm font-medium">
                            {coach.member ? `${coach.member.name} ${coach.member.surname}` : 'Neznámý trenér'}
                          </span>
                          <Badge 
                            color="secondary" 
                            variant="flat" 
                            size="sm"
                          >
                            {coach.role === 'head_coach' ? 'Hlavní trenér' : 
                             coach.role === 'assistant_coach' ? 'Asistent' : 
                             coach.role === 'goalkeeper_coach' ? 'Trenér brankářů' : coach.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {awayLineup.players.length === 0 && awayLineup.coaches.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Sestava zatím nebyla vytvořena
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Sestava zatím nebyla vytvořena
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button 
          as={Link} 
          href="/matches" 
          variant="bordered" 
          color="primary"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Zpět na zápasy
        </Button>
        {match.status === "upcoming" && (
          <Button 
            color="primary"
            endContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
          >
            Přidat do kalendáře
          </Button>
        )}
      </div>
    </div>
  );
}
