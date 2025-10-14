'use client';

import {useCallback, useMemo} from 'react';

import {Card, CardBody, CardHeader, Chip, Image, Spinner} from '@heroui/react';

import {Calendar, MapPin} from 'lucide-react';

import {
  BettingOptionButton,
  BettingOptionButtonProps,
} from '@/components/features/betting/BettingOptionButton';

import {formatDateWithTime} from '@/helpers';
import {useMatchOdds, useMatchTeamsForm} from '@/hooks';
import {translations} from '@/lib';
import {BetSelection, BetSlipItem, BetTypeId, MatchBettingData} from '@/types';

interface MatchBettingCardProps {
  match: MatchBettingData;
  onAddToBetSlip: (item: BetSlipItem) => void;
  selectedBets?: BetSlipItem[];
}

export default function MatchBettingCard({
  match,
  onAddToBetSlip,
  selectedBets = [],
}: MatchBettingCardProps) {
  // Fetch real odds from database
  const {data: matchOdds, isLoading: loadingOdds} = useMatchOdds(match.id);

  // Fetch team form data
  const {
    homeForm,
    awayForm,
    isLoading: loadingForm,
  } = useMatchTeamsForm(match.home_team_id, match.away_team_id);

  const t = translations.betting.matchBettingCard;

  // Helper to get color for form result
  const getFormColor = (result: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (result) {
      case 'W':
        return 'success';
      case 'D':
        return 'warning';
      case 'L':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Render form badges
  const renderForm = (form: string) => {
    if (!form) return null;

    return (
      <div className="flex gap-0.5">
        {form.split('').map((result, index) => (
          <Chip
            key={index}
            size="sm"
            color={getFormColor(result)}
            variant="flat"
            className="min-w-[20px] h-5 px-1 text-[10px] font-semibold"
          >
            {result}
          </Chip>
        ))}
      </div>
    );
  };

  const isSelected = useCallback(
    (betType: BetTypeId, selection: BetSelection) => {
      return selectedBets.some(
        (bet) =>
          bet.match_id === match.id && bet.bet_type === betType && bet.selection === selection
      );
    },
    [selectedBets, match.id]
  );

  const handleBetClick = useCallback(
    (betType: BetTypeId, selection: BetSelection, oddsValue: number) => {
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
    },
    [match, onAddToBetSlip]
  );

  // Prepare betting options (must be before early returns per Rules of Hooks)
  const matchOddsOptions = useMemo<BettingOptionButtonProps[]>(() => {
    if (!matchOdds) return [];
    return [
      {
        betType: '1X2',
        selection: '1',
        odds: matchOdds['1X2']['1'],
        isSelected: isSelected('1X2', '1'),
        onPress: () => handleBetClick('1X2', '1', matchOdds['1X2']['1']),
        label: '1',
      },
      {
        betType: 'DOUBLE_CHANCE',
        selection: '1X',
        odds: matchOdds['DOUBLE_CHANCE']?.['1X'] || 0,
        isSelected: isSelected('DOUBLE_CHANCE', '1X'),
        onPress: () =>
          handleBetClick('DOUBLE_CHANCE', '1X', matchOdds['DOUBLE_CHANCE']?.['1X'] || 0),
        label: '10',
        color: 'success',
      },
      {
        betType: '1X2',
        selection: 'X',
        odds: matchOdds['1X2']['X'],
        isSelected: isSelected('1X2', 'X'),
        onPress: () => handleBetClick('1X2', 'X', matchOdds['1X2']['X']),
        label: 'X',
      },
      {
        betType: 'DOUBLE_CHANCE',
        selection: 'X2',
        odds: matchOdds['DOUBLE_CHANCE']?.['X2'] || 0,
        isSelected: isSelected('DOUBLE_CHANCE', 'X2'),
        onPress: () =>
          handleBetClick('DOUBLE_CHANCE', 'X2', matchOdds['DOUBLE_CHANCE']?.['X2'] || 0),
        label: '02',
        color: 'success',
      },
      {
        betType: '1X2',
        selection: '2',
        odds: matchOdds['1X2']['2'],
        isSelected: isSelected('1X2', '2'),
        onPress: () => handleBetClick('1X2', '2', matchOdds['1X2']['2']),
        label: '2',
      },
    ];
  }, [
    handleBetClick,
    isSelected,
    match.away_team.club_category.club.short_name,
    match.home_team.club_category.club.short_name,
    matchOdds,
    t.draw,
  ]);

  // Only show matches that haven't started yet
  const matchDate = new Date(match.date);
  const isUpcoming = matchDate > new Date();

  if (!isUpcoming) {
    return null; // Don't show past matches
  }

  // Show loading state
  if (loadingOdds) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="sm" title={t.loadingOdds} />
        </CardBody>
      </Card>
    );
  }

  // Don't show match if no odds are available
  if (!matchOdds) {
    return null;
  }

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
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-3">
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

          {/* Team Form - Show only when loaded */}
          {!loadingForm && (homeForm || awayForm) && (
            <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-1 flex-1">
                {homeForm && (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-[10px]">{t.form}:</span>
                      {renderForm(homeForm.form)}
                    </div>
                    <div className="text-gray-500 text-[10px]">
                      {homeForm.wins}
                      {t.winKey}-{homeForm.draws}
                      {t.drawKey}-{homeForm.losses}
                      {t.lossKey} ({homeForm.points} {t.points})
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1 items-end">
                {awayForm && (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-[10px]">{t.form}:</span>
                      {renderForm(awayForm.form)}
                    </div>
                    <div className="text-gray-500 text-[10px]">
                      {awayForm.wins}
                      {t.winKey}-{awayForm.draws}
                      {t.drawKey}-{awayForm.losses}
                      {t.lossKey} ({awayForm.points} {t.points})
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Betting Options */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t.matchResult}</p>
          <div className="grid grid-cols-5 gap-2">
            {matchOddsOptions.map((item, index) => (
              <BettingOptionButton key={index} {...item} />
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
