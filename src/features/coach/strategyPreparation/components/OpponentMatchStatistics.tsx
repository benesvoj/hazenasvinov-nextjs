'use client';

import React from 'react';

import {Card, CardHeader, CardBody} from '@heroui/react';

import {ChartBarIcon, TrophyIcon, FireIcon, ShieldCheckIcon} from '@heroicons/react/24/outline';

import {Match} from '@/types';

interface MatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  recentForm: ('W' | 'L' | 'D')[];
  homeRecord: {
    matches: number;
    wins: number;
    losses: number;
    draws: number;
  };
  awayRecord: {
    matches: number;
    wins: number;
    losses: number;
    draws: number;
  };
  halftimeLeads: number;
  halftimeLeadConversion: number;
  halftimeDeficits: number;
  comebackRate: number;
  secondHalfGoals: number;
  avgSecondHalfGoals: number;
  halftimeLeadWins: number;
  comebackWins: number;
}

interface OpponentMatchStatisticsProps {
  matches: Match[];
  opponentTeamName: string;
}

export default function OpponentMatchStatistics({
  matches,
  opponentTeamName,
}: OpponentMatchStatisticsProps) {
  // Calculate statistics from matches
  const calculateStats = (matches: Match[]): MatchStats => {
    if (matches.length === 0) {
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        goalsScored: 0,
        goalsConceded: 0,
        goalDifference: 0,
        avgGoalsScored: 0,
        avgGoalsConceded: 0,
        recentForm: [],
        homeRecord: {matches: 0, wins: 0, losses: 0, draws: 0},
        awayRecord: {matches: 0, wins: 0, losses: 0, draws: 0},
        halftimeLeads: 0,
        halftimeLeadConversion: 0,
        halftimeDeficits: 0,
        comebackRate: 0,
        secondHalfGoals: 0,
        avgSecondHalfGoals: 0,
        halftimeLeadWins: 0,
        comebackWins: 0,
      };
    }

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let goalsScored = 0;
    let goalsConceded = 0;
    let halftimeLeads = 0;
    let halftimeDeficits = 0;
    let halftimeLeadWins = 0;
    let comebackWins = 0;
    let secondHalfGoals = 0;
    const recentForm: ('W' | 'L' | 'D')[] = [];

    const homeRecord = {matches: 0, wins: 0, losses: 0, draws: 0};
    const awayRecord = {matches: 0, wins: 0, losses: 0, draws: 0};

    matches.forEach((match) => {
      if (match.status !== 'completed' || match.home_score == null || match.away_score == null) {
        return;
      }

      const isHomeTeam =
        match.home_team_id === matches[0]?.home_team_id ||
        match.home_team_id === matches[0]?.away_team_id;
      const opponentScore = isHomeTeam ? match.home_score : match.away_score;
      const opponentConceded = isHomeTeam ? match.away_score : match.home_score;

      goalsScored += opponentScore;
      goalsConceded += opponentConceded;

      // Calculate halftime scores and second half goals
      const opponentHalftimeScore = isHomeTeam
        ? match.home_score_halftime
        : match.away_score_halftime;
      const opponentHalftimeConceded = isHomeTeam
        ? match.away_score_halftime
        : match.home_score_halftime;

      // Calculate second half goals (total - halftime)
      if (opponentHalftimeScore != null) {
        const secondHalfGoalsThisMatch = opponentScore - opponentHalftimeScore;
        secondHalfGoals += Math.max(0, secondHalfGoalsThisMatch);
      }

      // Analyze halftime performance

      if (opponentHalftimeScore != null && opponentHalftimeConceded != null) {
        // Check if opponent was leading at halftime
        if (opponentHalftimeScore > opponentHalftimeConceded) {
          halftimeLeads++;
          // Check if they won the match (converted halftime lead)
          if (opponentScore > opponentConceded) {
            halftimeLeadWins++;
          }
        }
        // Check if opponent was behind at halftime
        else if (opponentHalftimeScore < opponentHalftimeConceded) {
          halftimeDeficits++;
          // Check if they won the match (comeback)
          if (opponentScore > opponentConceded) {
            comebackWins++;
          }
        }
      }

      // Determine result from opponent's perspective
      let result: 'W' | 'L' | 'D';
      if (opponentScore > opponentConceded) {
        wins++;
        result = 'W';
      } else if (opponentScore < opponentConceded) {
        losses++;
        result = 'L';
      } else {
        draws++;
        result = 'D';
      }

      recentForm.push(result);

      // Track home/away records
      if (isHomeTeam) {
        homeRecord.matches++;
        if (result === 'W') homeRecord.wins++;
        else if (result === 'L') homeRecord.losses++;
        else homeRecord.draws++;
      } else {
        awayRecord.matches++;
        if (result === 'W') awayRecord.wins++;
        else if (result === 'L') awayRecord.losses++;
        else awayRecord.draws++;
      }
    });

    const totalMatches = wins + losses + draws;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    const goalDifference = goalsScored - goalsConceded;
    const avgGoalsScored = totalMatches > 0 ? goalsScored / totalMatches : 0;
    const avgGoalsConceded = totalMatches > 0 ? goalsConceded / totalMatches : 0;
    const halftimeLeadConversion = halftimeLeads > 0 ? (halftimeLeadWins / halftimeLeads) * 100 : 0;
    const comebackRate = halftimeDeficits > 0 ? (comebackWins / halftimeDeficits) * 100 : 0;
    const avgSecondHalfGoals = totalMatches > 0 ? secondHalfGoals / totalMatches : 0;

    return {
      totalMatches,
      wins,
      losses,
      draws,
      winRate,
      goalsScored,
      goalsConceded,
      goalDifference,
      avgGoalsScored,
      avgGoalsConceded,
      recentForm: recentForm.slice(0, 10), // Last 10 matches
      homeRecord,
      awayRecord,
      halftimeLeads,
      halftimeLeadConversion,
      halftimeDeficits,
      comebackRate,
      secondHalfGoals,
      avgSecondHalfGoals,
      halftimeLeadWins,
      comebackWins,
    };
  };

  const stats = calculateStats(matches);

  if (stats.totalMatches === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Statistiky {opponentTeamName}</h3>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-gray-500 text-center py-4">
            Žádné statistiky nejsou k dispozici - tým nemá dokončené zápasy
          </p>
        </CardBody>
      </Card>
    );
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
    tooltip,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{className?: string}>;
    color?: string;
    tooltip?: string;
  }) => (
    <div
      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center relative group cursor-help"
      title={tooltip}
    >
      <Icon className={`w-6 h-6 mx-auto mb-2 text-${color}-600`} />
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>}

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      )}
    </div>
  );

  const FormIndicator = ({form}: {form: ('W' | 'L' | 'D')[]}) => (
    <div className="flex gap-1">
      {form.map((result, index) => (
        <div
          key={index}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            result === 'W'
              ? 'bg-green-500 text-white'
              : result === 'L'
                ? 'bg-red-500 text-white'
                : 'bg-gray-500 text-white'
          }`}
        >
          {result}
        </div>
      ))}
    </div>
  );

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Statistiky {opponentTeamName}</h3>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          {/* Overall Record */}
          <div>
            <h4 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">
              Celkový přehled
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Zápasy"
                value={stats.totalMatches}
                icon={ChartBarIcon}
                color="blue"
                tooltip="Celkový počet dokončených zápasů v této kategorii"
              />
              <StatCard
                title="Výhry"
                value={stats.wins}
                subtitle={`${stats.winRate.toFixed(1)}%`}
                icon={TrophyIcon}
                color="green"
                tooltip="Počet výher a procentuální úspěšnost týmu"
              />
              <StatCard
                title="Prohry"
                value={stats.losses}
                icon={FireIcon}
                color="red"
                tooltip="Počet proher v dokončených zápasech"
              />
              <StatCard
                title="Remízy"
                value={stats.draws}
                icon={ShieldCheckIcon}
                color="gray"
                tooltip="Počet remíz (nerozhodných výsledků)"
              />
            </div>
          </div>

          {/* Goals Statistics */}
          <div>
            <h4 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">Góly</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Vstřelené"
                value={stats.goalsScored}
                subtitle={`${stats.avgGoalsScored.toFixed(1)}/zápas`}
                icon={FireIcon}
                color="green"
                tooltip="Celkový počet vstřelených gólů a průměr na zápas"
              />
              <StatCard
                title="Obdržené"
                value={stats.goalsConceded}
                subtitle={`${stats.avgGoalsConceded.toFixed(1)}/zápas`}
                icon={ShieldCheckIcon}
                color="red"
                tooltip="Celkový počet obdržených gólů a průměr na zápas"
              />
              <StatCard
                title="Rozdíl"
                value={stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference}
                icon={ChartBarIcon}
                color={stats.goalDifference >= 0 ? 'green' : 'red'}
                tooltip="Rozdíl mezi vstřelenými a obdrženými góly (+ znamená lepší útočnou bilanci)"
              />
              <StatCard
                title="2. poločas góly"
                value={stats.secondHalfGoals}
                subtitle={`${stats.avgSecondHalfGoals.toFixed(1)}/zápas`}
                icon={FireIcon}
                color="orange"
                tooltip="Góly vstřelené ve druhém poločase (ukazuje kondici a taktické úpravy)"
              />
            </div>
          </div>

          {/* Halftime Analysis */}
          <div>
            <h4 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">
              Poločasová analýza
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Poločasové vedení"
                value={stats.halftimeLeads}
                subtitle={
                  stats.halftimeLeads > 0
                    ? `${stats.halftimeLeadConversion.toFixed(1)}% konverze`
                    : 'Žádné vedení'
                }
                icon={TrophyIcon}
                color="green"
                tooltip="Kolikrát vedl tým v poločase a jak často to převedl do výhry"
              />
              <StatCard
                title="Poločasové zaostávání"
                value={stats.halftimeDeficits}
                subtitle={
                  stats.halftimeDeficits > 0
                    ? `${stats.comebackRate.toFixed(1)}% comeback`
                    : 'Žádné zaostávání'
                }
                icon={FireIcon}
                color="red"
                tooltip="Kolikrát byl tým v poločase pozadu a jak často se dokázal vrátit do hry"
              />
              <StatCard
                title="2. poločas góly"
                value={stats.secondHalfGoals}
                subtitle={`${stats.avgSecondHalfGoals.toFixed(1)}/zápas`}
                icon={ChartBarIcon}
                color="blue"
                tooltip="Góly vstřelené pouze ve druhém poločase (ukazuje kondici a taktické změny)"
              />
              <StatCard
                title="Konverze vedení"
                value={
                  stats.halftimeLeads > 0 ? `${stats.halftimeLeadConversion.toFixed(0)}%` : 'N/A'
                }
                subtitle={
                  stats.halftimeLeads > 0
                    ? `${stats.halftimeLeadWins}/${stats.halftimeLeads} zápasů`
                    : 'Žádné vedení'
                }
                icon={ShieldCheckIcon}
                color="green"
                tooltip="Procentuální úspěšnost v udržení poločasového vedení až do konce zápasu"
              />
            </div>
          </div>

          {/* Recent Form */}
          <div>
            <h4 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">
              Poslední zápasy
            </h4>
            <div className="flex items-center justify-center gap-3">
              <FormIndicator form={stats.recentForm} />
            </div>
          </div>

          {/* Home/Away Records */}
          <div>
            <h4 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">
              Domácí vs Venkovní
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">🏠 Domácí</h5>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Zápasy:</span>
                    <span className="font-medium">{stats.homeRecord.matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Výhry:</span>
                    <span className="font-medium text-green-600">{stats.homeRecord.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prohry:</span>
                    <span className="font-medium text-red-600">{stats.homeRecord.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remízy:</span>
                    <span className="font-medium text-gray-600">{stats.homeRecord.draws}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">✈️ Venkovní</h5>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Zápasy:</span>
                    <span className="font-medium">{stats.awayRecord.matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Výhry:</span>
                    <span className="font-medium text-green-600">{stats.awayRecord.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prohry:</span>
                    <span className="font-medium text-red-600">{stats.awayRecord.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remízy:</span>
                    <span className="font-medium text-gray-600">{stats.awayRecord.draws}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
