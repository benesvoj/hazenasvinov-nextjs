'use client';

import MatchSchedule from '@/components/match/MatchSchedule';
import {
  CallTheActionSection,
  SponsorsSection,
  ClubHighlightSection,
  PostSection,
} from './components';
import {useSectionVisibility} from '@/hooks/useSectionVisibility';
import AuthHandler from './components/AuthHandler';
import {translations} from '@/lib/translations';
// import OptimizedMatchSchedule from "@/components/match/OptimizedMatchSchedule";

export default function Page() {
  const {sectionVisibility, loading} = useSectionVisibility();
  const t = translations.matchSchedule;

  return (
    <div className="space-y-8">
      <AuthHandler />
      <PostSection />
      <MatchSchedule title={t.title} description={t.description} />
      {/* <OptimizedMatchSchedule /> */}
      {!loading && sectionVisibility.clubHighlight && <ClubHighlightSection />}
      {!loading && sectionVisibility.sponsors && <SponsorsSection />}
      {!loading && sectionVisibility.callToAction && <CallTheActionSection />}
    </div>
  );
}
