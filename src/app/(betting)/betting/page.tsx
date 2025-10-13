'use client';

import {useState} from 'react';

import {useRouter} from 'next/navigation';

import {Tabs, Tab, Button, Spinner} from '@heroui/react';

import {TrendingUp, History, Trophy, LogOut, Calendar} from 'lucide-react';

import {useUpcomingBettingMatches} from '@/hooks/features/betting/useMatches';

import {bettingLogout} from '@/utils/supabase/bettingAuth';

import {
  LeaderboardTable,
  BetHistory,
  BetSlip,
  MatchBettingCard,
  WalletBalance,
  BettingLogin,
} from '@/components';
import {useUser} from '@/contexts';
import {translations} from '@/lib';
import {BetSlipItem} from '@/types';

// Keep mock matches as fallback (remove once tested)
const mockMatches = [
  {
    id: '1',
    category_id: 'cat1',
    season_id: 'season1',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    time: '18:00',
    home_team_id: 'team1',
    away_team_id: 'team2',
    home_team: {
      team_suffix: 'A',
      club_category: {
        club: {
          id: 'club1',
          name: 'Team A',
          short_name: 'TMA',
          logo_url: null,
          is_own_club: true,
        },
      },
    },
    away_team: {
      team_suffix: 'B',
      club_category: {
        club: {
          id: 'club2',
          name: 'Team B',
          short_name: 'TMB',
          logo_url: null,
          is_own_club: false,
        },
      },
    },
    venue: 'Stadium A',
    competition: 'League Cup',
    is_home: true,
    status: 'upcoming' as const,
    category: {name: 'Category A', id: 'cat1'},
    season: {name: '2024/2025', id: 'season1'},
  },
  {
    id: '2',
    category_id: 'cat1',
    season_id: 'season1',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
    time: '20:00',
    home_team_id: 'team3',
    away_team_id: 'team4',
    home_team: {
      team_suffix: 'C',
      club_category: {
        club: {
          id: 'club3',
          name: 'Team C',
          short_name: 'TMC',
          logo_url: null,
          is_own_club: false,
        },
      },
    },
    away_team: {
      team_suffix: 'A',
      club_category: {
        club: {
          id: 'club1',
          name: 'Team A',
          short_name: 'TMA',
          logo_url: null,
          is_own_club: true,
        },
      },
    },
    venue: 'Stadium C',
    competition: 'League Cup',
    is_home: false,
    status: 'upcoming' as const,
    category: {name: 'Category A', id: 'cat1'},
    season: {name: '2024/2025', id: 'season1'},
  },
];

export default function BettingPage() {
  const router = useRouter();
  const {user} = useUser();
  const [selectedTab, setSelectedTab] = useState<string>('matches');
  const [betSlipItems, setBetSlipItems] = useState<BetSlipItem[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const t = translations.betting;

  const userId = user?.id || '';

  // Fetch real matches data
  const {
    data: realMatches,
    isLoading: matchesLoading,
    error: matchesError,
  } = useUpcomingBettingMatches({
    limit: 20,
    daysAhead: 30, // Fetch matches in the next 30 days
  });

  // Use real matches if available, fallback to mock data during development
  const matches = realMatches && realMatches.length > 0 ? realMatches : mockMatches;

  const handleAddToBetSlip = (item: BetSlipItem) => {
    // Check if item already exists
    const existingIndex = betSlipItems.findIndex(
      (existing) =>
        existing.match_id === item.match_id &&
        existing.bet_type === item.bet_type &&
        existing.selection === item.selection
    );

    if (existingIndex !== -1) {
      // Remove if already selected (toggle behavior)
      setBetSlipItems(betSlipItems.filter((_, index) => index !== existingIndex));
    } else {
      // Add new item
      setBetSlipItems([...betSlipItems, item]);
    }
  };

  const handleRemoveFromBetSlip = (index: number) => {
    setBetSlipItems(betSlipItems.filter((_, i) => i !== index));
  };

  const handleClearBetSlip = () => {
    setBetSlipItems([]);
  };

  const handleBetPlaced = () => {
    // Refresh data after bet is placed
    setBetSlipItems([]);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await bettingLogout();

      if (result && result.success) {
        // Small delay to show loading state, then force a hard redirect
        setTimeout(() => {
          // Force a hard redirect to ensure page reloads without auth state
          window.location.href = '/betting';
        }, 300);
      } else {
        // If there's an error, still try to redirect
        console.error('Logout error:', result?.error);
        setTimeout(() => {
          window.location.href = '/betting';
        }, 300);
      }
    } catch (error) {
      console.error('Logout exception:', error);
      // Still redirect even on exception
      setTimeout(() => {
        window.location.href = '/betting';
      }, 300);
    }
  };

  // Show login screen if user is not logged in
  if (!user) {
    return <BettingLogin onLoginSuccess={() => router.refresh()} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Logout */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">{t.appTitle}</h1>
          <p className="text-gray-300">{t.appDescription}</p>
        </div>
        <Button
          color="secondary"
          variant="solid"
          startContent={<LogOut className="w-4 h-4" />}
          onPress={handleLogout}
          isLoading={isLoggingOut}
          isDisabled={isLoggingOut}
        >
          {isLoggingOut ? t.logoutLoading : t.logout}
        </Button>
      </div>

      {/* Wallet Balance - Always visible */}
      <div className="mb-6">
        <WalletBalance userId={userId} showSummary={true} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            classNames={{
              tabList: 'w-full',
            }}
          >
            <Tab
              key="matches"
              title={
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>{t.tabs.matches}</span>
                </div>
              }
            >
              <div className="space-y-4 mt-4">
                {/* Loading State */}
                {matchesLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Spinner size="lg" color="primary" />
                    <p className="text-gray-400">{t.tabs.matchesLoading}</p>
                  </div>
                )}

                {/* Error State */}
                {matchesError && !matchesLoading && (
                  <div className="text-center py-12 text-red-400">
                    <p>Error loading matches: {matchesError.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Showing mock data for demonstration
                    </p>
                  </div>
                )}

                {/* No Matches */}
                {!matchesLoading && !matchesError && matches.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">No Upcoming Matches</p>
                    <p className="text-sm">Check back soon for new betting opportunities!</p>
                  </div>
                )}

                {/* Matches List */}
                {!matchesLoading &&
                  matches.length > 0 &&
                  matches.map((match) => (
                    <MatchBettingCard
                      key={match.id}
                      match={match as any}
                      onAddToBetSlip={handleAddToBetSlip}
                      selectedBets={betSlipItems}
                    />
                  ))}

                {/* Info when using real data */}
                {!matchesLoading && realMatches && realMatches.length > 0 && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-300">
                      ✓ Showing {realMatches.length} real upcoming match
                      {realMatches.length !== 1 ? 'es' : ''} from your database
                    </p>
                  </div>
                )}
              </div>
            </Tab>

            <Tab
              key="history"
              title={
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span>{t.tabs.myBets}</span>
                </div>
              }
            >
              <div className="mt-4">
                <BetHistory userId={userId} />
              </div>
            </Tab>

            <Tab
              key="leaderboard"
              title={
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>{t.tabs.leaderboard}</span>
                </div>
              }
            >
              <div className="mt-4">
                <LeaderboardTable userId={userId} />
              </div>
            </Tab>
          </Tabs>
        </div>

        {/* Right Column - Bet Slip (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <BetSlip
              userId={userId}
              items={betSlipItems}
              onRemoveItem={handleRemoveFromBetSlip}
              onClearAll={handleClearBetSlip}
              onBetPlaced={handleBetPlaced}
            />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="font-semibold mb-2 text-white">{t.howToPlay}</h3>
        <ul className="text-sm space-y-1 text-gray-300">
          <li>{t.howToPlayList.rule1}</li>
          <li>{t.howToPlayList.rule2}</li>
          <li>{t.howToPlayList.rule3}</li>
          <li>{t.howToPlayList.rule4}</li>
          <li>{t.howToPlayList.rule5}</li>
        </ul>
      </div>
    </div>
  );
}
