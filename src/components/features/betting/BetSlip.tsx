'use client';

import {useState} from 'react';

import {Card, CardBody, CardHeader, Button, Input, Chip, Divider} from '@heroui/react';

import {X, Trash2, Check} from 'lucide-react';

import {BetSlipItem, BetStructure} from '@/types/features/betting/bet';
import {getSelectionDisplayName, getBetTypeMetadata} from '@/types/features/betting/betType';
import {formatCurrency} from '@/types/features/betting/wallet';

import {useCreateBet} from '@/hooks/features/betting/useBets';
import {useWalletBalance} from '@/hooks/features/betting/useWallet';

import {
  calculateTotalOdds,
  calculateReturn,
  calculateProfit,
  formatOdds,
} from '@/services/features/betting/oddsCalculator';

import {showToast} from '@/components';
import {translations} from '@/lib';

interface BetSlipProps {
  userId: string;
  items: BetSlipItem[];
  onRemoveItem: (index: number) => void;
  onClearAll: () => void;
  onBetPlaced?: () => void;
}

export default function BetSlip({
  userId,
  items,
  onRemoveItem,
  onClearAll,
  onBetPlaced,
}: BetSlipProps) {
  const [stake, setStake] = useState<string>('10');

  const t = translations.betting.betSlip;

  const {data: balance = 0} = useWalletBalance(userId);
  const createBet = useCreateBet();

  const stakeAmount = parseFloat(stake) || 0;

  // Determine bet structure based on items count
  // When there are 2+ items, must be ACCUMULATOR (backend only allows single bets with 1 selection)
  const effectiveStructure: BetStructure = items.length <= 1 ? 'SINGLE' : 'ACCUMULATOR';

  // Calculate odds and potential returns
  const totalOdds = calculateTotalOdds(
    effectiveStructure,
    items.map((item) => ({
      match_id: item.match_id,
      bet_type: item.bet_type,
      selection: item.selection,
      odds: item.odds,
      parameter: item.parameter,
    }))
  );

  const potentialReturn = calculateReturn(stakeAmount, totalOdds);
  const potentialProfit = calculateProfit(stakeAmount, totalOdds);

  const canPlaceBet =
    items.length > 0 && stakeAmount > 0 && stakeAmount <= balance && !createBet.isPending;

  const handlePlaceBet = async () => {
    if (!canPlaceBet) return;

    if (effectiveStructure === 'ACCUMULATOR' && items.length < 2) {
      showToast.danger('Accumulator bets require at least 2 selections');
      return;
    }

    const result = await createBet.mutateAsync({
      user_id: userId,
      structure: effectiveStructure,
      stake: stakeAmount,
      legs: items.map((item) => ({
        match_id: item.match_id,
        bet_type: item.bet_type,
        selection: item.selection,
        odds: item.odds,
        parameter: item.parameter,
      })),
    });

    if (result) {
      showToast.success('Bet placed successfully!');
      setStake('10');
      onClearAll();
      onBetPlaced?.();
    } else {
      showToast.danger('Failed to place bet. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h3 className="text-lg font-semibold">{t.title}</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            <p>{t.emptyMessage}</p>
            <p className="text-sm mt-2">{t.emptyMessageDescription}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {t.title} <Chip size="sm">{items.length}</Chip>
        </h3>
        <Button size="sm" variant="light" color="danger" onPress={onClearAll} isIconOnly>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardBody className="gap-4">
        {/* Bet Items */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.map((item, index) => (
            <Card key={index} className="shadow-sm">
              <CardBody className="p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{item.competition}</p>
                    <p className="text-sm font-semibold">
                      {item.home_team} vs {item.away_team}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip size="sm" variant="flat">
                        {getBetTypeMetadata(item.bet_type).name}
                      </Chip>
                      <span className="text-xs text-gray-600">
                        {getSelectionDisplayName(
                          item.bet_type,
                          item.selection,
                          item.home_team,
                          item.away_team
                        )}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-primary mt-1">
                      {t.odds}: {formatOdds(item.odds)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    isIconOnly
                    onPress={() => onRemoveItem(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Divider />

        {/* Stake Input */}
        <div>
          <Input
            type="number"
            label={t.stake}
            placeholder={t.stakePlaceholder}
            value={stake}
            onValueChange={setStake}
            min="1"
            max={balance.toString()}
            startContent={<span className="text-sm text-gray-500">coins</span>}
          />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>
              {t.balance}: {formatCurrency(balance, 'POINTS')}
            </span>
            {stakeAmount > balance && <span className="text-danger">{t.insufficientBalance}</span>}
          </div>
        </div>

        {/* Bet Summary */}
        <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.totalOdds}:</span>
            <span className="text-sm font-bold">{formatOdds(totalOdds)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.potentialReturn}:</span>
            <span className="text-sm font-bold text-success">
              {formatCurrency(potentialReturn, 'POINTS')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.potentialWin}:</span>
            <span className="text-sm font-bold text-success">
              {formatCurrency(potentialProfit, 'POINTS')}
            </span>
          </div>
        </div>

        {/* Place Bet Button */}
        <Button
          color="primary"
          size="lg"
          className="w-full"
          onPress={handlePlaceBet}
          isDisabled={!canPlaceBet}
          isLoading={createBet.isPending}
          startContent={!createBet.isPending && <Check className="w-5 h-5" />}
        >
          {createBet.isPending ? t.placeBetLoading : t.placeBet}
        </Button>

        {stakeAmount > balance && (
          <p className="text-xs text-danger text-center">{t.insufficientBalanceDescription}</p>
        )}
      </CardBody>
    </Card>
  );
}
