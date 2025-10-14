'use client';

import {useState} from 'react';

import {useRouter} from 'next/navigation';

import {Tabs, Tab, Button, Spinner, Chip, ButtonGroup} from '@heroui/react';

import {
  TrendingUp,
  History,
  Trophy,
  LogOut,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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

// Helper to get Monday of current week
function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

// Helper to get Sunday of current week
function getSunday(d: Date) {
  const monday = getMonday(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

export default function BettingPage() {
  const router = useRouter();
  const {user} = useUser();
  const [selectedTab, setSelectedTab] = useState<string>('matches');
  const [betSlipItems, setBetSlipItems] = useState<BetSlipItem[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, 1 = next week, etc.

  const t = translations.betting;

  const userId = user?.id || '';

  // Calculate current week's Monday and Sunday
  const currentWeekMonday = getMonday(new Date());
  currentWeekMonday.setDate(currentWeekMonday.getDate() + weekOffset * 7);
  const currentWeekSunday = getSunday(currentWeekMonday);

  // Only fetch matches if user is logged in
  const {
    data: realMatches,
    isLoading: matchesLoading,
    error: matchesError,
  } = useUpcomingBettingMatches(
    {
      limit: 100,
      daysAhead: 365, // Fetch all upcoming matches
    },
    !!user // Only enable if user exists
  );

  // Filter matches by current week and category
  const filteredMatches = (realMatches || []).filter((match) => {
    const matchDate = new Date(match.date);
    const isInWeek = matchDate >= currentWeekMonday && matchDate <= currentWeekSunday;
    const matchesCategory = selectedCategory === 'all' || match.category_id === selectedCategory;
    return isInWeek && matchesCategory;
  });

  // Get unique categories from matches
  const categories = realMatches
    ? Array.from(
        new Map(
          realMatches.map((match) => [
            match.category_id,
            {id: match.category_id, name: match.category.name},
          ])
        ).values()
      )
    : [];

  // Use only real matches (no mock data)
  const matches = filteredMatches;

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
                {/* Week Navigation */}
                <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg">
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<ChevronLeft className="w-4 h-4" />}
                    onPress={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                    isDisabled={weekOffset === 0}
                  >
                    Previous Week
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Week of</p>
                    <p className="font-semibold text-white">
                      {currentWeekMonday.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {currentWeekSunday.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {weekOffset === 0 && (
                      <Chip size="sm" color="primary" variant="flat" className="mt-1">
                        Current Week
                      </Chip>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    endContent={<ChevronRight className="w-4 h-4" />}
                    onPress={() => setWeekOffset(weekOffset + 1)}
                  >
                    Next Week
                  </Button>
                </div>

                {/* Category Tabs */}
                {!matchesLoading && categories.length > 0 && (
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">{t.filterByCategory}:</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="solid"
                        color={selectedCategory === 'all' ? 'primary' : 'default'}
                        onPress={() => setSelectedCategory('all')}
                      >
                        {t.matches.filters.all}
                      </Button>
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          size="sm"
                          variant="solid"
                          color={selectedCategory === category.id ? 'primary' : 'default'}
                          onPress={() => setSelectedCategory(category.id)}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {matchesLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Spinner size="lg" color="primary" title={t.tabs.matchesLoading} />
                  </div>
                )}

                {/* Error State */}
                {matchesError && !matchesLoading && (
                  <div className="text-center py-12 text-red-400">
                    <p>Error loading matches: {matchesError.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please try refreshing the page or contact support if the issue persists.
                    </p>
                  </div>
                )}

                {/* No Matches */}
                {!matchesLoading && !matchesError && matches.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">No Matches This Week</p>
                    <p className="text-sm">
                      {selectedCategory !== 'all'
                        ? 'Try selecting a different category or check another week.'
                        : 'Try checking other weeks for new betting opportunities!'}
                    </p>
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
