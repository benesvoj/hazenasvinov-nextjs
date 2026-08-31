'use client';

import {useEffect, useRef, useState} from 'react';

import {LoadingSpinner} from '@/components';
import {useAllCategoriesOwnClubMatches} from '@/hooks';

import {MatchResultCard} from './';

export default function LatestResultsSection() {
  const {matches: latestMatches, loading, error} = useAllCategoriesOwnClubMatches();

  const viewportRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  /**
   * The marquee is a CSS animation that translates the row by -50%, so a
   * seamless loop needs the results rendered exactly twice — the second copy
   * lands where the first began.
   *
   * That only makes sense once the results are wide enough to scroll. Early in
   * a season there is one played match, and rendering the set twice put the
   * same card on screen twice with an animation sliding a row that had nowhere
   * to go. Measured rather than counted: whether a set overflows depends on the
   * viewport, not on how many cards there are.
   */
  const [shouldLoop, setShouldLoop] = useState(false);

  useEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current;
      const results = resultsRef.current;
      if (!viewport || !results) return;

      // resultsRef wraps the first set only, so this stays accurate whether or
      // not the duplicate is currently rendered.
      setShouldLoop(results.scrollWidth > viewport.clientWidth);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [latestMatches.length]);

  if (loading) {
    return (
      <section className="py-8">
        <div className="text-center mb-6">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (error || latestMatches.length === 0) {
    return <></>;
  }

  const cards = (keyPrefix: string) =>
    latestMatches.map((match) => (
      <MatchResultCard
        key={`${keyPrefix}${match.id}`}
        match={match}
        categoryName={match.category?.name}
      />
    ));

  return (
    <section className="py-2">
      <div
        ref={viewportRef}
        className={`px-4 sm:p-2 ${shouldLoop ? 'animate-scroll' : 'overflow-x-auto'}`}
      >
        <div className="flex gap-2 pb-4">
          <div ref={resultsRef} className="flex gap-2">
            {cards('')}
          </div>

          {/*
            Decorative: the same results again so the loop has somewhere to go.
            aria-hidden keeps a screen reader from reading every result twice.
          */}
          {shouldLoop && (
            <div className="flex gap-2" aria-hidden="true">
              {cards('loop-')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
