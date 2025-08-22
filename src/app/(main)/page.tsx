'use client';

import MatchSchedule from "@/components/MatchSchedule";
import { CallTheActionSection, SponsorsSection, ClubHighlightSection, PostSection} from "./components";

export default function Page() {

  return (
    <div className="space-y-8">
      <PostSection />
      <MatchSchedule />
      <ClubHighlightSection />
      <SponsorsSection />
      <CallTheActionSection />
    </div>
  );
}