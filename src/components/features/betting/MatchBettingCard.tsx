'use client';

import {Card, CardBody, CardHeader, Button, Chip, Image, Spinner} from '@heroui/react';

import {Calendar, MapPin, AlertCircle} from 'lucide-react';

import {formatDateWithTime} from '@/helpers';
import {useMatchOdds, useMatchTeamsForm} from '@/hooks';
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

// Fallback mock odds - used only when database odds are not available
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
  // Fetch real odds from database
  const {data: matchOdds, isLoading: loadingOdds} = useMatchOdds(match.id);

  // Fetch team form data
  const {
    homeForm,
    awayForm,
    isLoading: loadingForm,
  } = useMatchTeamsForm(match.home_team_id, match.away_team_id);

  // Use real odds if available, otherwise fall back to mock odds
  const odds = matchOdds || getMockOdds(match.id);
  const isUsingMockOdds = !matchOdds;

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

  // Show loading state
  if (loadingOdds) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="sm" />
          <p className="text-sm text-gray-500 mt-2">Loading odds...</p>
        </CardBody>
      </Card>
    );
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
        {isUsingMockOdds && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-3 h-3" />
            <span>Using estimated odds - Generate real odds for accurate pricing</span>
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
      </CardBody>
    </Card>
  );
}
