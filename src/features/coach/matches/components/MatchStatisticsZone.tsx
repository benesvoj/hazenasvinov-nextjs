'use client';

import React, {useState, useEffect, useMemo} from 'react';

import {Card, CardHeader, CardBody, Button, Tabs, Tab, Chip, Progress} from '@heroui/react';

import {
  ChartBarIcon,
  TrophyIcon,
  UserGroupIcon,
  FireIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import {useMatchLineupStats, PlayerMatchStats} from '@/hooks/entities/lineup/useMatchLineupStats';

import {LoadingSpinner} from '@/components';
import {useOptimizedOwnClubMatches} from '@/hooks';
import {Match, LineupPlayer} from '@/types';

interface MatchStatisticsZoneProps {
  categoryId: string;
  seasonId: string;
}

interface TeamStats {
  total_matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  win_percentage: number;
  average_goals_per_match: number;
  clean_sheets: number;
  most_goals_in_match: number;
  longest_win_streak: number;
  longest_loss_streak: number;
}

interface MatchStats {
  total_matches: number;
  home_matches: number;
  away_matches: number;
  average_attendance?: number;
  most_goals_match: {
    match: Match;
    total_goals: number;
  } | null;
  biggest_win: {
    match: Match;
    goal_difference: number;
  } | null;
  biggest_loss: {
    match: Match;
    goal_difference: number;
  } | null;
}

export default function MatchStatisticsZone({categoryId, seasonId}: MatchStatisticsZoneProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    allMatches,
    loading: matchesLoading,
    error: matchesError,
  } = useOptimizedOwnClubMatches(categoryId, seasonId);

  // Get player statistics from lineup data - memoize to prevent infinite loops
  const completedMatches = useMemo(() => {
    return (
      allMatches?.filter(
        (match) =>
          match.status === 'completed' &&
          (match.home_team_is_own_club || match.away_team_is_own_club)
      ) || []
    );
  }, [allMatches]);

  const {
    playerStats,
    loading: playerStatsLoading,
    error: playerStatsError,
  } = useMatchLineupStats(completedMatches);

  // Process match data to extract team and match statistics
  useEffect(() => {
    if (matchesLoading || !allMatches) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);

      console.log('Processing statistics for:', {
        totalMatches: allMatches.length,
        completedMatches: completedMatches.length,
        ourClubMatches: completedMatches.filter(
          (m) => m.home_team_is_own_club || m.away_team_is_own_club
        ).length,
      });

      // Process team statistics
      const teamStatsData: TeamStats = {
        total_matches: completedMatches.length,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        win_percentage: 0,
        average_goals_per_match: 0,
        clean_sheets: 0,
        most_goals_in_match: 0,
        longest_win_streak: 0,
        longest_loss_streak: 0,
      };

      // Process match statistics
      const matchStatsData: MatchStats = {
        total_matches: completedMatches.length,
        home_matches: completedMatches.filter((m) => m.home_team_is_own_club).length,
        away_matches: completedMatches.filter((m) => m.away_team_is_own_club).length,
        most_goals_match: null,
        biggest_win: null,
        biggest_loss: null,
      };

      // Calculate team statistics
      let currentWinStreak = 0;
      let currentLossStreak = 0;
      let maxWinStreak = 0;
      let maxLossStreak = 0;

      completedMatches.forEach((match) => {
        const homeScore = match.home_score || 0;
        const awayScore = match.away_score || 0;
        const isHomeTeam = match.home_team_is_own_club;
        const ourScore = isHomeTeam ? homeScore : awayScore;
        const opponentScore = isHomeTeam ? awayScore : homeScore;

        teamStatsData.goals_for += ourScore;
        teamStatsData.goals_against += opponentScore;

        if (ourScore > opponentScore) {
          teamStatsData.wins++;
          currentWinStreak++;
          currentLossStreak = 0;
          maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else if (ourScore < opponentScore) {
          teamStatsData.losses++;
          currentLossStreak++;
          currentWinStreak = 0;
          maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        } else {
          teamStatsData.draws++;
          currentWinStreak = 0;
          currentLossStreak = 0;
        }

        // Clean sheets
        if (opponentScore === 0) {
          teamStatsData.clean_sheets++;
        }

        // Most goals in a match (total goals in the match)
        const totalGoals = homeScore + awayScore;
        if (totalGoals > teamStatsData.most_goals_in_match) {
          teamStatsData.most_goals_in_match = totalGoals;
        }

        // Most goals match
        if (
          !matchStatsData.most_goals_match ||
          totalGoals > matchStatsData.most_goals_match.total_goals
        ) {
          matchStatsData.most_goals_match = {
            match,
            total_goals: totalGoals,
          };
        }

        // Biggest win/loss
        const goalDiff = ourScore - opponentScore;
        if (goalDiff > 0) {
          if (
            !matchStatsData.biggest_win ||
            goalDiff > matchStatsData.biggest_win.goal_difference
          ) {
            matchStatsData.biggest_win = {
              match,
              goal_difference: goalDiff,
            };
          }
        } else if (goalDiff < 0) {
          if (
            !matchStatsData.biggest_loss ||
            Math.abs(goalDiff) > Math.abs(matchStatsData.biggest_loss.goal_difference)
          ) {
            matchStatsData.biggest_loss = {
              match,
              goal_difference: Math.abs(goalDiff),
            };
          }
        }
      });

      // Calculate derived statistics
      teamStatsData.goal_difference = teamStatsData.goals_for - teamStatsData.goals_against;
      teamStatsData.win_percentage =
        teamStatsData.total_matches > 0
          ? (teamStatsData.wins / teamStatsData.total_matches) * 100
          : 0;
      teamStatsData.average_goals_per_match =
        teamStatsData.total_matches > 0 ? teamStatsData.goals_for / teamStatsData.total_matches : 0;
      teamStatsData.longest_win_streak = maxWinStreak;
      teamStatsData.longest_loss_streak = maxLossStreak;

      console.log('Calculated team stats:', teamStatsData);

      setTeamStats(teamStatsData);
      setMatchStats(matchStatsData);
    } catch (error) {
      console.error('Error processing match statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [allMatches, matchesLoading, completedMatches]);

  if (matchesLoading || loading || playerStatsLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Statistiky zápasů</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (matchesError) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Statistiky zápasů</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-red-600">
            <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
            <p>Chyba při načítání statistik</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (completedMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Statistiky zápasů</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            <TrophyIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Žádné dokončené zápasy</p>
            <p className="text-sm">Statistiky budou k dispozici po odehrání prvních zápasů</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>Celkem zápasů: {allMatches?.length || 0}</p>
              <p>
                Dokončené zápasy: {allMatches?.filter((m) => m.status === 'completed').length || 0}
              </p>
              <p>
                Naše zápasy:{' '}
                {allMatches?.filter((m) => m.home_team_is_own_club || m.away_team_is_own_club)
                  .length || 0}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Statistiky zápasů</h3>
        </div>
      </CardHeader>
      <CardBody>
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="w-full"
        >
          <Tab key="overview" title="Přehled">
            <OverviewTab teamStats={teamStats} matchStats={matchStats} />
          </Tab>
          <Tab key="players" title="Hráči">
            <PlayersTab playerStats={playerStats} />
          </Tab>
          <Tab key="matches" title="Zápasy">
            <MatchesTab matchStats={matchStats} />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

function OverviewTab({
  teamStats,
  matchStats,
}: {
  teamStats: TeamStats | null;
  matchStats: MatchStats | null;
}) {
  if (!teamStats || !matchStats) {
    return (
      <div className="text-center py-8 text-gray-500">Žádné statistiky nejsou k dispozici</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrophyIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Výhry</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {teamStats.wins}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-300">
            {teamStats.win_percentage.toFixed(1)}% úspěšnost
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FireIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">Góly</span>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {teamStats.goals_for}
          </div>
          <div className="text-xs text-green-600 dark:text-green-300">
            {teamStats.average_goals_per_match.toFixed(1)} průměrně
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserGroupIcon className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Zápasy</span>
          </div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {teamStats.total_matches}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-300">
            {matchStats.home_matches} doma, {matchStats.away_matches} venku
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Rozdíl</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {teamStats.goal_difference > 0 ? '+' : ''}
            {teamStats.goal_difference}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-300">
            {teamStats.clean_sheets} nul
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Výsledky</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Výhry</span>
              <div className="flex items-center gap-2">
                <Progress value={teamStats.win_percentage} className="w-20" color="success" />
                <span className="text-sm font-medium">{teamStats.wins}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Remízy</span>
              <div className="flex items-center gap-2">
                <Progress
                  value={(teamStats.draws / teamStats.total_matches) * 100}
                  className="w-20"
                  color="warning"
                />
                <span className="text-sm font-medium">{teamStats.draws}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Prohry</span>
              <div className="flex items-center gap-2">
                <Progress
                  value={(teamStats.losses / teamStats.total_matches) * 100}
                  className="w-20"
                  color="danger"
                />
                <span className="text-sm font-medium">{teamStats.losses}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Rekordy</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Nejvíce gólů v zápase
              </span>
              <span className="text-sm font-medium">{teamStats.most_goals_in_match}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Nejdelší série výher</span>
              <span className="text-sm font-medium">{teamStats.longest_win_streak}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Nejdelší série proher
              </span>
              <span className="text-sm font-medium">{teamStats.longest_loss_streak}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayersTab({playerStats}: {playerStats: PlayerMatchStats[]}) {
  if (playerStats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <UserGroupIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>Statistiky hráčů nejsou k dispozici</p>
        <p className="text-sm mt-1">Data o sestavách nejsou zatím dostupná</p>
      </div>
    );
  }

  // Players are already sorted by the hook
  const sortedPlayers = playerStats;

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Statistiky hráčů
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {playerStats.length} hráčů s daty
        </p>
      </div>

      <div className="space-y-2">
        {sortedPlayers.slice(0, 10).map((player, index) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {player.name} {player.surname}
                  </span>
                  {player.is_captain && (
                    <Chip size="sm" color="primary" variant="flat">
                      K
                    </Chip>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  #{player.jersey_number || player.registration_number}
                  {player.position && ` • ${player.position}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{player.goals}</div>
                <div className="text-xs text-gray-500">gólů</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{player.yellow_cards}</div>
                <div className="text-xs text-gray-500">žlutých</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{player.total_cards}</div>
                <div className="text-xs text-gray-500">karet</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{player.matches_played}</div>
                <div className="text-xs text-gray-500">zápasů</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchesTab({matchStats}: {matchStats: MatchStats | null}) {
  if (!matchStats) {
    return (
      <div className="text-center py-8 text-gray-500">
        Žádné statistiky zápasů nejsou k dispozici
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {matchStats.total_matches}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Celkem zápasů</div>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ClockIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {matchStats.home_matches}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Doma</div>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ClockIcon className="w-8 h-8 mx-auto mb-2 text-orange-600" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {matchStats.away_matches}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Venku</div>
        </div>
      </div>

      {matchStats.most_goals_match && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Rekordní zápasy</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FireIcon className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">Nejvíce gólů</span>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                {matchStats.most_goals_match.match.home_team?.name} vs{' '}
                {matchStats.most_goals_match.match.away_team?.name}
              </div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                {matchStats.most_goals_match.total_goals} gólů
              </div>
            </div>

            {matchStats.biggest_win && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrophyIcon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Největší výhra
                  </span>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {matchStats.biggest_win.match.home_team?.name} vs{' '}
                  {matchStats.biggest_win.match.away_team?.name}
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  +{matchStats.biggest_win.goal_difference} gólů
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
