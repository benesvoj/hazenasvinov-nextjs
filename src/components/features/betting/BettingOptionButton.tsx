import {Button} from '@heroui/react';

import {formatOdds} from '@/services';
import {BetSelection, BetTypeId, getSelectionDisplayName} from '@/types';

export interface BettingOptionButtonProps {
  betType: BetTypeId;
  selection: BetSelection;
  odds: number;
  isSelected: boolean;
  onPress: () => void;
  homeTeamShortName?: string;
  awayTeamShortName?: string;
  color?: 'primary' | 'success' | 'default';
  label?: string;
}

export const BettingOptionButton = ({
  betType,
  selection,
  odds,
  isSelected,
  onPress,
  homeTeamShortName,
  awayTeamShortName,
  color = 'primary',
  label,
}: BettingOptionButtonProps) => {
  const displayLabel =
    label || getSelectionDisplayName(betType, selection, homeTeamShortName, awayTeamShortName);

  return (
    <Button
      size="sm"
      variant={isSelected ? 'faded' : 'bordered'}
      color={isSelected ? color : 'default'}
      onPress={onPress}
      className="flex flex-col py-6"
    >
      <span className="text-xs">{displayLabel}</span>
      <span className="font-bold text-xs">{formatOdds(odds)}</span>
    </Button>
  );
};
