'use client';

import {useState} from 'react';

import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Spinner,
} from '@heroui/react';

import {Trophy, TrendingUp, TrendingDown, Award} from 'lucide-react';

import {
  LeaderboardPeriod,
  LeaderboardSortBy,
  getPeriodDisplayName,
  formatRank,
  formatPercentage,
  getRankChangeIndicator,
} from '@/types/features/betting/leaderboard';
import {formatCurrency} from '@/types/features/betting/wallet';

import {useLeaderboard, useUserRank} from '@/hooks/features/betting/useLeaderboard';

interface LeaderboardTableProps {
  userId?: string;
  initialPeriod?: LeaderboardPeriod;
  initialSortBy?: LeaderboardSortBy;
}

export default function LeaderboardTable({
  userId,
  initialPeriod = 'ALL_TIME',
  initialSortBy = 'PROFIT',
}: LeaderboardTableProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>(initialSortBy);

  const {data: leaderboard = [], isLoading} = useLeaderboard(period, sortBy, 50, 0);
  const {data: userRank} = useUserRank(userId || '', period);

  const periods: LeaderboardPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'SEASON', 'ALL_TIME'];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />;
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Leaderboard
            </h3>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 flex-wrap">
            {periods.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'solid' : 'bordered'}
                color={period === p ? 'primary' : 'default'}
                onPress={() => setPeriod(p)}
              >
                {getPeriodDisplayName(p)}
              </Button>
            ))}
          </div>

          {/* User's Rank (if logged in) */}
          {userRank && (
            <Card className="bg-primary-50 dark:bg-primary-900/20">
              <CardBody className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">Your Rank</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {formatRank(userRank.current_rank)}
                      </span>
                      <Chip size="sm" variant="flat">
                        Top {formatPercentage(userRank.percentile)}
                      </Chip>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Net Profit</p>
                    <p
                      className={`text-lg font-bold ${
                        userRank.entry.net_profit > 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {formatCurrency(userRank.entry.net_profit, 'POINTS')}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </CardHeader>

      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No leaderboard data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Betting Leaderboard">
              <TableHeader>
                <TableColumn>RANK</TableColumn>
                <TableColumn>USER</TableColumn>
                <TableColumn>BETS</TableColumn>
                <TableColumn>WIN RATE</TableColumn>
                <TableColumn>PROFIT</TableColumn>
                <TableColumn>ROI</TableColumn>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => {
                  const isCurrentUser = entry.user_id === userId;
                  return (
                    <TableRow
                      key={entry.user_id}
                      className={isCurrentUser ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          <span className="font-semibold">{entry.rank}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.username}</span>
                          {isCurrentUser && (
                            <Chip size="sm" color="primary" variant="flat">
                              You
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{entry.total_bets}</p>
                          <p className="text-xs text-gray-500">
                            {entry.won_bets}W / {entry.lost_bets}L
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={
                            entry.win_rate >= 50
                              ? 'success'
                              : entry.win_rate >= 40
                                ? 'warning'
                                : 'danger'
                          }
                          variant="flat"
                        >
                          {formatPercentage(entry.win_rate)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {entry.net_profit > 0 ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : entry.net_profit < 0 ? (
                            <TrendingDown className="w-4 h-4 text-danger" />
                          ) : null}
                          <span
                            className={`font-semibold ${
                              entry.net_profit > 0
                                ? 'text-success'
                                : entry.net_profit < 0
                                  ? 'text-danger'
                                  : 'text-gray-600'
                            }`}
                          >
                            {entry.net_profit > 0 ? '+' : ''}
                            {formatCurrency(entry.net_profit, 'POINTS')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            entry.roi > 0
                              ? 'text-success'
                              : entry.roi < 0
                                ? 'text-danger'
                                : 'text-gray-600'
                          }`}
                        >
                          {entry.roi > 0 ? '+' : ''}
                          {formatPercentage(entry.roi)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
