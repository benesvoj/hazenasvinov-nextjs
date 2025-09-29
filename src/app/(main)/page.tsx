'use client';

import {useSectionVisibility} from '@/hooks/entities/settings/useSectionVisibility';

import MatchSchedule from '@/components/shared/match/MatchSchedule';

import {translations} from '@/lib/translations';

import {
  CallTheActionSection,
  SponsorsSection,
  ClubHighlightSection,
  PostSection,
  LatestResultsSection,
} from './components';
import AuthHandler from './components/AuthHandler';

// import OptimizedMatchSchedule from "@/components/match/OptimizedMatchSchedule";

export default function Page() {
  const {sectionVisibility, loading} = useSectionVisibility();
  const t = translations.matchSchedule;

  return (
    <div className="space-y-4">
      <AuthHandler />
      <LatestResultsSection />
      <PostSection />
      <MatchSchedule title={t.title} description={t.description} />
      {/* <OptimizedMatchSchedule /> */}
      {!loading && sectionVisibility.clubHighlight && <ClubHighlightSection />}
      {!loading && sectionVisibility.sponsors && <SponsorsSection />}
      {!loading && sectionVisibility.callToAction && <CallTheActionSection />}
    </div>
  );
}
