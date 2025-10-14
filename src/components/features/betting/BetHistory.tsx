'use client';

import {useState} from 'react';

import {Card, CardBody, CardHeader, Chip, Tabs, Tab, Spinner, Image} from '@heroui/react';

import {Calendar, TrendingUp, TrendingDown, Trophy} from 'lucide-react';

import {formatDateString, formatDateTimeFromString} from '@/helpers';
import {useUserBets, useUserBetStats} from '@/hooks';
import {translations} from '@/lib';
import {formatOdds} from '@/services';
import {
  BetStatus,
  getBetStatusColor,
  getBetStatusLabel,
  getBetTypeMetadata,
  formatCurrency,
} from '@/types';

interface BetHistoryProps {
  userId: string;
}

export default function BetHistory({userId}: BetHistoryProps) {
  const [selectedTab, setSelectedTab] = useState<'active' | 'settled' | 'all'>('active');

  const t = translations.betting.betHistory;

  // Build filters based on selected tab
  const filters =
    selectedTab === 'active'
      ? {status: ['PENDING'] as BetStatus[]}
      : selectedTab === 'settled'
        ? {status: ['WON', 'LOST', 'VOID'] as BetStatus[]}
        : undefined;

  const {data: bets = [], isLoading} = useUserBets(userId, filters, 50, 0);
  const {data: stats} = useUserBetStats(userId);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-2 w-full">
          <h3 className="text-lg font-semibold">Bet History</h3>

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-3 gap-2 text-center mt-2">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-500">Win Rate</p>
                <p className="text-sm font-bold">{stats.win_rate.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-500">Total Bets</p>
                <p className="text-sm font-bold">{stats.total_bets}</p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-500">ROI</p>
                <p
                  className={`text-sm font-bold ${stats.roi > 0 ? 'text-success' : 'text-danger'}`}
                >
                  {stats.roi > 0 ? '+' : ''}
                  {stats.roi.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody>
        {/* Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as any)}
          className="mb-4"
        >
          <Tab key="active" title={t.tabs.active} />
          <Tab key="settled" title={t.tabs.settled} />
          <Tab key="all" title={t.tabs.all} />
        </Tabs>

        {/* Bet List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : bets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{t.noBedsFound}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {bets.map((bet) => (
              <Card key={bet.id} className="shadow-sm">
                <CardBody className="p-3">
                  {/* Bet Header */}
                  <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2 items-center">
                      <Trophy className="w-4 h-4 text-primary" />
                      <Chip size="sm" variant="flat" color="default">
                        {bet.structure}
                      </Chip>
                      <Chip size="sm" color={getBetStatusColor(bet.status)} variant="solid">
                        {getBetStatusLabel(bet.status)}
                      </Chip>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateString(bet.placed_at)}
                      </p>
                    </div>
                  </div>

                  {/* Bet Legs */}
                  <div className="space-y-3 mb-3">
                    {bet.legs.map((leg) => {
                      const betTypeMetadata = getBetTypeMetadata(leg.bet_type);
                      return (
                        <div
                          key={leg.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-3 border-primary flex justify-between"
                        >
                          {/* Match Header with Teams */}
                          <div className="flex flex-col justify-between items-start gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-semibold text-sm">
                                {leg.home_team || 'Home'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className="font-semibold text-sm">
                                {leg.away_team || 'Away'}
                              </span>
                            </div>
                          </div>

                          {/* Match Date */}
                          <div className="flex flex-col items-end">
                            {leg.match_date && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                <Calendar className="w-3 h-3" />
                                {formatDateTimeFromString(leg.match_date)}
                              </div>
                            )}

                            {/* Bet Details */}
                            <div className="flex flex-col gap-2 items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                <Chip size="sm" variant="flat" color="primary">
                                  {betTypeMetadata.name}
                                </Chip>
                                <span className="text-xs font-medium">{leg.selection}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={getBetStatusColor(leg.status)}
                                >
                                  {getBetStatusLabel(leg.status)}
                                </Chip>
                                <span className="text-sm font-bold">{formatOdds(leg.odds)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bet Summary */}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300 dark:border-gray-600">
                    <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-gray-500 uppercase">{t.stake}</p>
                      <p className="text-sm font-bold">{formatCurrency(bet.stake, 'POINTS')}</p>
                    </div>
                    <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-gray-500 uppercase">{t.odds}</p>
                      <p className="text-sm font-bold text-primary">{formatOdds(bet.odds)}</p>
                    </div>
                    <div className="flex flex-col items-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 rounded-lg px-3 py-2">
                      {bet.status === 'PENDING' ? (
                        <>
                          <p className="text-[10px] text-gray-600 dark:text-gray-300 uppercase">
                            {t.potentialWin}
                          </p>
                          <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                            {formatCurrency(bet.potential_return, 'POINTS')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] text-gray-600 dark:text-gray-300 uppercase">
                            {t.payout}
                          </p>
                          <div className="flex items-center gap-1">
                            {bet.status === 'WON' ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : bet.status === 'LOST' ? (
                              <TrendingDown className="w-4 h-4 text-danger" />
                            ) : null}
                            <p
                              className={`text-sm font-bold ${
                                bet.status === 'WON'
                                  ? 'text-success'
                                  : bet.status === 'LOST'
                                    ? 'text-danger'
                                    : 'text-gray-600'
                              }`}
                            >
                              {formatCurrency(bet.payout || 0, 'POINTS')}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
