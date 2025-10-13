'use client';

import {Card, CardBody, CardHeader, Button, Chip, Image} from '@heroui/react';

import {Calendar, MapPin} from 'lucide-react';

import {formatDateWithTime} from '@/helpers';
import {translations} from '@/lib';
import {formatOdds} from '@/services';
import {
  BetTypeId,
  BetSelection,
  BetSlipItem,
  getSelectionDisplayName,
  MatchBettingData,
} from '@/types';

interface MatchBettingCardProps {
  match: MatchBettingData;
  onAddToBetSlip: (item: BetSlipItem) => void;
  selectedBets?: BetSlipItem[];
}

// Mock odds data - in production, this would come from an odds provider
const getMockOdds = (matchId: string) => ({
  '1X2': {
    '1': 2.1,
    X: 3.2,
    '2': 3.8,
  },
  BOTH_TEAMS_SCORE: {
    YES: 1.85,
    NO: 1.95,
  },
  OVER_UNDER: {
    OVER: 1.9,
    UNDER: 1.9,
  },
});

export default function MatchBettingCard({
  match,
  onAddToBetSlip,
  selectedBets = [],
}: MatchBettingCardProps) {
  const odds = getMockOdds(match.id);

  const t = translations.betting.matchBettingCard;
  const isHidden = true;

  const isSelected = (betType: BetTypeId, selection: BetSelection) => {
    return selectedBets.some(
      (bet) => bet.match_id === match.id && bet.bet_type === betType && bet.selection === selection
    );
  };

  const handleBetClick = (betType: BetTypeId, selection: BetSelection, oddsValue: number) => {
    const categoryDisplay = match.category?.description
      ? `${match.category.name} - ${match.category.description}`
      : match.category?.name || 'Unknown';

    const betSlipItem: BetSlipItem = {
      match_id: match.id,
      bet_type: betType,
      selection: selection,
      odds: oddsValue,
      home_team: match.home_team.club_category.club.name,
      away_team: match.away_team.club_category.club.name,
      match_date: match.date,
      competition: categoryDisplay,
    };
    onAddToBetSlip(betSlipItem);
  };

  const formatDate = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${timeString}`;
  };

  // Only show matches that haven't started yet
  const matchDate = new Date(match.date);
  const isUpcoming = matchDate > new Date();

  if (!isUpcoming) {
    return null; // Don't show past matches
  }

  console.log('match', match);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-2 pb-2">
        <div className="flex justify-between items-center w-full">
          <Chip size="sm" variant="flat" color="primary">
            {match.category?.name}
            {match.category?.description && ` - ${match.category.description}`}
          </Chip>
          <Chip size="sm" variant="flat" startContent={<Calendar className="w-3 h-3" />}>
            {formatDateWithTime(match.date, match.time)}
          </Chip>
        </div>
        {match.venue && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            {match.venue}
          </div>
        )}
      </CardHeader>

      <CardBody className="pt-0">
        {/* Teams Display */}
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 flex-1">
            {match.home_team.club_category.club.logo_url && (
              <Image
                src={match.home_team.club_category.club.logo_url}
                alt={match.home_team.club_category.club.name}
                className="w-8 h-8 object-contain"
              />
            )}
            <span className="font-semibold">{match.home_team.club_category.club.name}</span>
          </div>
          <span className="text-gray-400 mx-4">vs</span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="font-semibold">{match.away_team.club_category.club.name}</span>
            {match.away_team.club_category.club.logo_url && (
              <Image
                src={match.away_team.club_category.club.logo_url}
                alt={match.away_team.club_category.club.name}
                className="w-8 h-8 object-contain"
              />
            )}
          </div>
        </div>

        {/* 1X2 Betting Options */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t.matchResult}</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant={isSelected('1X2', '1') ? 'solid' : 'bordered'}
              color={isSelected('1X2', '1') ? 'primary' : 'default'}
              onPress={() => handleBetClick('1X2', '1', odds['1X2']['1'])}
              className="flex flex-col py-6"
            >
              <span className="text-xs">
                {getSelectionDisplayName(
                  '1X2',
                  '1',
                  match.home_team.club_category.club.short_name,
                  match.away_team.club_category.club.short_name
                )}
              </span>
              <span className="font-bold">{formatOdds(odds['1X2']['1'])}</span>
            </Button>
            <Button
              size="sm"
              variant={isSelected('1X2', 'X') ? 'solid' : 'bordered'}
              color={isSelected('1X2', 'X') ? 'primary' : 'default'}
              onPress={() => handleBetClick('1X2', 'X', odds['1X2']['X'])}
              className="flex flex-col py-6"
            >
              <span className="text-xs">{t.draw}</span>
              <span className="font-bold">{formatOdds(odds['1X2']['X'])}</span>
            </Button>
            <Button
              size="sm"
              variant={isSelected('1X2', '2') ? 'solid' : 'bordered'}
              color={isSelected('1X2', '2') ? 'primary' : 'default'}
              onPress={() => handleBetClick('1X2', '2', odds['1X2']['2'])}
              className="flex flex-col py-6"
            >
              <span className="text-xs">
                {getSelectionDisplayName(
                  '1X2',
                  '2',
                  match.home_team.club_category.club.short_name,
                  match.away_team.club_category.club.short_name
                )}
              </span>
              <span className="font-bold">{formatOdds(odds['1X2']['2'])}</span>
            </Button>
          </div>
        </div>

        {/* Both Teams Score */}
        {!isHidden && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Both Teams to Score</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={isSelected('BOTH_TEAMS_SCORE', 'YES') ? 'solid' : 'bordered'}
                color={isSelected('BOTH_TEAMS_SCORE', 'YES') ? 'primary' : 'default'}
                onPress={() => handleBetClick('BOTH_TEAMS_SCORE', 'YES', odds.BOTH_TEAMS_SCORE.YES)}
                className="flex flex-col py-2"
              >
                <span className="text-xs">Yes</span>
                <span className="font-bold">{formatOdds(odds.BOTH_TEAMS_SCORE.YES)}</span>
              </Button>
              <Button
                size="sm"
                variant={isSelected('BOTH_TEAMS_SCORE', 'NO') ? 'solid' : 'bordered'}
                color={isSelected('BOTH_TEAMS_SCORE', 'NO') ? 'primary' : 'default'}
                onPress={() => handleBetClick('BOTH_TEAMS_SCORE', 'NO', odds.BOTH_TEAMS_SCORE.NO)}
                className="flex flex-col py-2"
              >
                <span className="text-xs">No</span>
                <span className="font-bold">{formatOdds(odds.BOTH_TEAMS_SCORE.NO)}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Over/Under 2.5 Goals */}
        {!isHidden && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Total Goals (2.5)</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={isSelected('OVER_UNDER', 'OVER') ? 'solid' : 'bordered'}
                color={isSelected('OVER_UNDER', 'OVER') ? 'primary' : 'default'}
                onPress={() => handleBetClick('OVER_UNDER', 'OVER', odds.OVER_UNDER.OVER)}
                className="flex flex-col py-2"
              >
                <span className="text-xs">Over 2.5</span>
                <span className="font-bold">{formatOdds(odds.OVER_UNDER.OVER)}</span>
              </Button>
              <Button
                size="sm"
                variant={isSelected('OVER_UNDER', 'UNDER') ? 'solid' : 'bordered'}
                color={isSelected('OVER_UNDER', 'UNDER') ? 'primary' : 'default'}
                onPress={() => handleBetClick('OVER_UNDER', 'UNDER', odds.OVER_UNDER.UNDER)}
                className="flex flex-col py-2"
              >
                <span className="text-xs">Under 2.5</span>
                <span className="font-bold">{formatOdds(odds.OVER_UNDER.UNDER)}</span>
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
