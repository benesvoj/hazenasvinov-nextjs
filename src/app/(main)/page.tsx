'use client';

import {useSectionVisibility} from '@/hooks/entities/settings/useSectionVisibility';

import MatchSchedule from '@/components/shared/match/MatchSchedule';

import {translations} from '@/lib/translations';

import {SponsorsTemp} from '@/app/(main)/components/SponsorsTemp';

import {
  ClubHighlightSection,
  LatestResultsSection,
  PostSection,
  SponsorsSection,
  TournamentTeaser,
} from './components';
import AuthHandler from './components/AuthHandler';

export default function Page() {
  const {sectionVisibility, loading} = useSectionVisibility();
  const t = translations.matches.matchSchedule;

  return (
    <div className="space-y-4">
      <AuthHandler />
      <LatestResultsSection />
      {!loading && sectionVisibility.callToAction && <TournamentTeaser />}
      <PostSection />
      <MatchSchedule title={t.title} description={t.description} />
      {!loading && sectionVisibility.clubHighlight && <ClubHighlightSection />}
      {!loading && sectionVisibility.sponsors && <SponsorsSection />}

      <SponsorsTemp />
    </div>
  );
}
