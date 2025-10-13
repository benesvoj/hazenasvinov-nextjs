'use client';

import {Card, CardBody, CardHeader, Button, Spinner} from '@heroui/react';

import {Wallet, TrendingUp, TrendingDown} from 'lucide-react';

import {formatCurrency} from '@/types/features/betting/wallet';

import {useWalletBalance, useWalletSummary} from '@/hooks/features/betting/useWallet';

import {translations} from '@/lib';

interface WalletBalanceProps {
  userId: string;
  onAddFunds?: () => void;
  showSummary?: boolean;
}

export default function WalletBalance({
  userId,
  onAddFunds,
  showSummary = true,
}: WalletBalanceProps) {
  const {data: balance, isLoading: balanceLoading} = useWalletBalance(userId);
  const {data: summary, isLoading: summaryLoading} = useWalletSummary(userId);

  const t = translations.betting.wallet;

  if (balanceLoading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center py-8">
          <Spinner />
        </CardBody>
      </Card>
    );
  }

  const currentBalance = balance ?? 0;
  const netProfit = summary?.netProfit ?? 0;
  const isProfitable = netProfit > 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t.title}</h3>
        </div>
        {onAddFunds && (
          <Button size="sm" color="primary" onPress={onAddFunds}>
            Add Funds
          </Button>
        )}
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Current Balance */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.currentBalance}</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(currentBalance, 'POINTS')}
            </p>
          </div>

          {/* Summary Statistics */}
          {showSummary && !summaryLoading && summary && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.totalWagered}</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(summary.totalWagered, summary.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.totalWin}</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(summary.totalWon, summary.currency)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.netProfit}/{t.netLoss}
                </p>
                <div className="flex items-center gap-2">
                  {isProfitable ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-danger" />
                  )}
                  <p
                    className={`text-lg font-bold ${
                      isProfitable
                        ? 'text-success'
                        : netProfit < 0
                          ? 'text-danger'
                          : 'text-gray-700'
                    }`}
                  >
                    {isProfitable ? '+' : ''}
                    {formatCurrency(netProfit, summary.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
