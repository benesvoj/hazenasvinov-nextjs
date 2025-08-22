'use client';

import MatchSchedule from "@/components/MatchSchedule";
import { HeroSection, CallTheActionSection, SponsorsSection, ClubHighlightSection, PostSection} from "./components";

export default function Page() {

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSection />

      {/* Match Schedule & Results */}
      <MatchSchedule />

      {/* Latest News - Modern Design */}
      <PostSection />

      {/* Club Highlights */}
      <ClubHighlightSection />

      {/* Sponsors Section */}
      <SponsorsSection />

      {/* Call to Action */}
      <CallTheActionSection />
    </div>
  );
}