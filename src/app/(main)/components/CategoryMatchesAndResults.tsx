'use client';

import {VStack} from '@/components';
import {Match} from '@/types';

import {RecentMatches} from './RecentMatches';
import {UpcomingMatches} from './UpcomingMatches';

interface CategoryMatchesAndResultsProps {
  loading: boolean;
  selectedCategory: string;
  allMatches: Match[];
  upcomingMatches: Match[];
  recentResults: Match[];
  redirectionLinks: boolean;
  onStartResultFlow?: (match: Match) => void;
  showResultButton?: boolean;
  refereesByMatchId?: Map<string, {order: number; name: string; surname: string}[]>;
}

export default function CategoryMatchesAndResults({
  loading,
  selectedCategory,
  allMatches,
  upcomingMatches,
  recentResults,
  redirectionLinks,
  onStartResultFlow,
  showResultButton = false,
  refereesByMatchId,
}: CategoryMatchesAndResultsProps) {
  return (
    <VStack spacing={6} align={'start'} className={'w-full'}>
      <UpcomingMatches
        loading={loading}
        selectedCategory={selectedCategory}
        allMatches={allMatches}
        upcomingMatches={upcomingMatches}
        redirectionLinks={redirectionLinks}
        onStartResultFlow={onStartResultFlow}
        showResultButton={showResultButton}
        refereesByMatchId={refereesByMatchId}
      />

      <RecentMatches
        loading={loading}
        selectedCategory={selectedCategory}
        allMatches={allMatches}
        recentResults={recentResults}
        redirectionLinks={redirectionLinks}
        refereesByMatchId={refereesByMatchId}
      />
    </VStack>
  );
}
