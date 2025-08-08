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
  UserGroupIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import Link from "@/components/Link";
import { useParams, useRouter } from "next/navigation";

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

export default function MatchDetailPage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  
  const supabase = createClient();

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
            category:categories(code, name),
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Načítání zápasu...</p>
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
            href="/matches" 
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
          href="/matches" 
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
                {match.competition}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {match.season?.name} • {match.category?.name}
              </p>
              {match.matchweek && (
                <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                  Kolo {match.matchweek}
                </p>
              )}
            </div>

            {/* Teams */}
            <div className="flex items-center justify-center gap-8">
              {/* Home Team */}
              <div className="flex flex-col items-center space-y-3">
                {match.home_team.logo_url && (
                  <img 
                    src={match.home_team.logo_url} 
                    alt={`${match.home_team.name} logo`}
                    className="w-20 h-20 object-contain rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="text-center">
                  <h2 className={`text-xl font-bold ${match.is_home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
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
                  <img 
                    src={match.away_team.logo_url} 
                    alt={`${match.away_team.name} logo`}
                    className="w-20 h-20 object-contain rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="text-center">
                  <h2 className={`text-xl font-bold ${!match.is_home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
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
