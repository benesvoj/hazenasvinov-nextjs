'use client';

import {useState} from 'react';

import {Card, CardBody, CardHeader, Chip, Tabs, Tab, Spinner} from '@heroui/react';

import {Calendar, TrendingUp, TrendingDown} from 'lucide-react';

import {BetStatus, getBetStatusColor, getBetStatusLabel} from '@/types/features/betting/bet';
import {getBetTypeMetadata} from '@/types/features/betting/betType';
import {formatCurrency} from '@/types/features/betting/wallet';

import {useUserBets, useUserBetStats} from '@/hooks/features/betting/useBets';

import {formatOdds} from '@/services/features/betting/oddsCalculator';

import {translations} from '@/lib';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
          <Tab key="active" title="Active" />
          <Tab key="settled" title="Settled" />
          <Tab key="all" title="All" />
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
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <Chip size="sm" variant="flat">
                        {bet.structure}
                      </Chip>
                      <Chip size="sm" color={getBetStatusColor(bet.status)} variant="flat">
                        {getBetStatusLabel(bet.status)}
                      </Chip>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(bet.placed_at)}
                      </p>
                    </div>
                  </div>

                  {/* Bet Legs */}
                  <div className="space-y-2 mb-2">
                    {bet.legs.map((leg) => (
                      <div
                        key={leg.id}
                        className="text-sm pl-2 border-l-2 border-gray-200 dark:border-gray-700"
                      >
                        <p className="font-medium">
                          {leg.home_team || 'Home'} vs {leg.away_team || 'Away'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{getBetTypeMetadata(leg.bet_type).name}</span>
                          <span>&quot;</span>
                          <span>{leg.selection}</span>
                          <span>&quot;</span>
                          <span className="font-semibold">{formatOdds(leg.odds)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bet Summary */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500">{t.stake}</p>
                      <p className="text-sm font-semibold">{formatCurrency(bet.stake, 'POINTS')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t.odds}</p>
                      <p className="text-sm font-semibold">{formatOdds(bet.odds)}</p>
                    </div>
                    <div className="text-right">
                      {bet.status === 'PENDING' ? (
                        <>
                          <p className="text-xs text-gray-500">{t.potentialWin}</p>
                          <p className="text-sm font-semibold text-primary">
                            {formatCurrency(bet.potential_return, 'POINTS')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500">{t.payout}</p>
                          <div className="flex items-center gap-1">
                            {bet.status === 'WON' ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : bet.status === 'LOST' ? (
                              <TrendingDown className="w-4 h-4 text-danger" />
                            ) : null}
                            <p
                              className={`text-sm font-semibold ${
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
