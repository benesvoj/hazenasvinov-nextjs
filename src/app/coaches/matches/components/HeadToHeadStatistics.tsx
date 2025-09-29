'use client';

import React from 'react';

import {Card, CardHeader, CardBody} from '@heroui/react';

import {ChartBarIcon, TrophyIcon, FireIcon, ShieldCheckIcon} from '@heroicons/react/24/outline';

import {Match} from '@/types';

interface HeadToHeadStats {
  totalMatches: number;
  ourWins: number;
  ourLosses: number;
  draws: number;
  ourWinRate: number;
  ourGoalsScored: number;
  ourGoalsConceded: number;
  ourGoalDifference: number;
  avgOurGoalsScored: number;
  avgOurGoalsConceded: number;
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

interface HeadToHeadStatisticsProps {
  matches: Match[];
  ourClubTeamIds: string[];
  opponentTeamName: string;
}

export default function HeadToHeadStatistics({
  matches,
  ourClubTeamIds,
  opponentTeamName,
}: HeadToHeadStatisticsProps) {
  // Calculate statistics from head-to-head matches
  const calculateStats = (matches: Match[]): HeadToHeadStats => {
    if (matches.length === 0)
      return {
        totalMatches: 0,
        ourWins: 0,
        ourLosses: 0,
        draws: 0,
        ourWinRate: 0,
        ourGoalsScored: 0,
        ourGoalsConceded: 0,
        ourGoalDifference: 0,
        avgOurGoalsScored: 0,
        avgOurGoalsConceded: 0,
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

    let ourWins = 0;
    let ourLosses = 0;
    let draws = 0;
    let ourGoalsScored = 0;
    let ourGoalsConceded = 0;
    let halftimeLeads = 0;
    let halftimeDeficits = 0;
    let halftimeLeadWins = 0;
    let comebackWins = 0;
    let secondHalfGoals = 0;
    const recentForm: ('W' | 'L' | 'D')[] = [];

    const homeRecord = {matches: 0, wins: 0, losses: 0, draws: 0};
    const awayRecord = {matches: 0, wins: 0, losses: 0, draws: 0};

    matches.forEach((match) => {
      const homeIsOurClub = ourClubTeamIds.includes(match.home_team_id);
      const awayIsOurClub = ourClubTeamIds.includes(match.away_team_id);

      if (!homeIsOurClub && !awayIsOurClub) return; // Skip if neither team is ours

      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;
      const homeScoreHalftime = match.home_score_halftime || 0;
      const awayScoreHalftime = match.away_score_halftime || 0;

      // Calculate our team's goals and opponent's goals
      let ourScore: number;
      let opponentScore: number;
      let ourScoreHalftime: number;
      let opponentScoreHalftime: number;

      if (homeIsOurClub && awayIsOurClub) {
        // Both teams are ours - this shouldn't happen in head-to-head, but handle it
        return;
      } else if (homeIsOurClub) {
        ourScore = homeScore;
        opponentScore = awayScore;
        ourScoreHalftime = homeScoreHalftime;
        opponentScoreHalftime = awayScoreHalftime;
      } else {
        ourScore = awayScore;
        opponentScore = homeScore;
        ourScoreHalftime = awayScoreHalftime;
        opponentScoreHalftime = homeScoreHalftime;
      }

      ourGoalsScored += ourScore;
      ourGoalsConceded += opponentScore;

      // Calculate second half goals
      const ourSecondHalfGoals = ourScore - ourScoreHalftime;
      const opponentSecondHalfGoals = opponentScore - opponentScoreHalftime;
      secondHalfGoals += ourSecondHalfGoals;

      // Check halftime situations
      if (ourScoreHalftime > opponentScoreHalftime) {
        halftimeLeads++;
        if (ourScore > opponentScore) {
          halftimeLeadWins++;
        }
      } else if (ourScoreHalftime < opponentScoreHalftime) {
        halftimeDeficits++;
        if (ourScore > opponentScore) {
          comebackWins++;
        }
      }

      // Determine result from our perspective
      let result: 'W' | 'L' | 'D';
      if (ourScore > opponentScore) {
        ourWins++;
        result = 'W';
      } else if (ourScore < opponentScore) {
        ourLosses++;
        result = 'L';
      } else {
        draws++;
        result = 'D';
      }

      recentForm.push(result);

      // Track home/away records
      if (homeIsOurClub) {
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

    const totalMatches = ourWins + ourLosses + draws;
    const ourWinRate = totalMatches > 0 ? (ourWins / totalMatches) * 100 : 0;
    const ourGoalDifference = ourGoalsScored - ourGoalsConceded;
    const avgOurGoalsScored = totalMatches > 0 ? ourGoalsScored / totalMatches : 0;
    const avgOurGoalsConceded = totalMatches > 0 ? ourGoalsConceded / totalMatches : 0;
    const halftimeLeadConversion = halftimeLeads > 0 ? (halftimeLeadWins / halftimeLeads) * 100 : 0;
    const comebackRate = halftimeDeficits > 0 ? (comebackWins / halftimeDeficits) * 100 : 0;
    const avgSecondHalfGoals = totalMatches > 0 ? secondHalfGoals / totalMatches : 0;

    return {
      totalMatches,
      ourWins,
      ourLosses,
      draws,
      ourWinRate,
      ourGoalsScored,
      ourGoalsConceded,
      ourGoalDifference,
      avgOurGoalsScored,
      avgOurGoalsConceded,
      recentForm: recentForm.slice(0, 5), // Last 5 matches
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
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">Žádné statistiky nejsou k dispozici</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Record */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Celkový rekord proti {opponentTeamName}
            </h3>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.ourWins}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Výhry</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {stats.draws}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Remízy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.ourLosses}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Prohry</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.ourWinRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Úspěšnost</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Goals Statistics */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gólové statistiky
            </h3>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.ourGoalsScored}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Vstřelené góly ({stats.avgOurGoalsScored.toFixed(1)}/zápas)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.ourGoalsConceded}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Obdržené góly ({stats.avgOurGoalsConceded.toFixed(1)}/zápas)
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  stats.ourGoalDifference > 0
                    ? 'text-green-600 dark:text-green-400'
                    : stats.ourGoalDifference < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {stats.ourGoalDifference > 0 ? '+' : ''}
                {stats.ourGoalDifference}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Rozdíl gólů</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Home/Away Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FireIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doma</h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.homeRecord.wins}-{stats.homeRecord.draws}-{stats.homeRecord.losses}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stats.homeRecord.matches} zápasů
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Venku</h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.awayRecord.wins}-{stats.awayRecord.draws}-{stats.awayRecord.losses}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stats.awayRecord.matches} zápasů
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Form */}
      {stats.recentForm.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Poslední výsledky
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="flex justify-center gap-2">
              {stats.recentForm.map((result, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    result === 'W'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : result === 'L'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Advanced Statistics */}
      {(stats.halftimeLeads > 0 || stats.halftimeDeficits > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pokročilé statistiky
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.halftimeLeads > 0 && (
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {stats.halftimeLeadConversion.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Konverze vedení v poločase ({stats.halftimeLeadWins}/{stats.halftimeLeads})
                  </div>
                </div>
              )}
              {stats.halftimeDeficits > 0 && (
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.comebackRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Míra comebacků ({stats.comebackWins}/{stats.halftimeDeficits})
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.avgSecondHalfGoals.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Průměr gólů ve 2. poločase
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
