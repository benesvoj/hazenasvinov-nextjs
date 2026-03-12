'use client';
import {useState, useEffect} from 'react';

import {usePageVisibility} from '@/hooks';

export const useSectionVisibility = () => {
  const {pages, loading, error} = usePageVisibility();
  const [sectionVisibility, setSectionVisibility] = useState<{
    clubHighlight: boolean;
    sponsors: boolean;
    callToAction: boolean;
    tournaments: boolean;
  }>({
    clubHighlight: true,
    sponsors: true,
    callToAction: true,
    tournaments: true,
  });

  useEffect(() => {
    if (!loading && pages.length > 0) {
      const clubHighlightPage = pages.find((p) => p.page_key === 'club_highlight_section');
      const sponsorsPage = pages.find((p) => p.page_key === 'sponsors_section');
      const callToActionPage = pages.find((p) => p.page_key === 'call_to_action_section');
      const tournamentPage = pages.find((p) => p.page_key === 'tournament_teaser_section');

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSectionVisibility({
        clubHighlight: clubHighlightPage?.is_visible ?? true,
        sponsors: sponsorsPage?.is_visible ?? true,
        callToAction: callToActionPage?.is_visible ?? true,
        tournaments: tournamentPage?.is_visible ?? true,
      });
    }
  }, [pages, loading]);

  return {
    sectionVisibility,
    loading,
    error,
  };
};
