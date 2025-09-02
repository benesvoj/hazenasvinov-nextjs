'use client';

import MatchSchedule from "@/app/(main)/components/MatchSchedule";
import { CallTheActionSection, SponsorsSection, ClubHighlightSection, PostSection} from "./components";
import { useSectionVisibility } from "@/hooks/useSectionVisibility";
import AuthHandler from "./components/AuthHandler";

export default function Page() {
  const { sectionVisibility, loading } = useSectionVisibility();

  return (
    <div className="space-y-8">
      <AuthHandler />
      <PostSection />
      <MatchSchedule />
      {!loading && sectionVisibility.clubHighlight && <ClubHighlightSection />}
      {!loading && sectionVisibility.sponsors && <SponsorsSection />}
      {!loading && sectionVisibility.callToAction && <CallTheActionSection />}
    </div>
  );
}