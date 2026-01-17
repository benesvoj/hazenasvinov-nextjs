'use client';

import Link from 'next/link';

import {Button, Card, CardHeader, CardBody} from '@heroui/react';

import {ArrowRightIcon, CalendarIcon, TrophyIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {LoadingSpinner, MatchRow} from '@/components';

interface CategoryMatchesAndResultsProps {
  loading: boolean;
  selectedCategory: string;
  allMatches: any[];
  upcomingMatches: any[];
  recentResults: any[];
  redirectionLinks: boolean;
  onStartResultFlow?: (match: any) => void;
  showResultButton?: boolean;
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
}: CategoryMatchesAndResultsProps) {
  return (
    <div className="space-y-6">
      {/* Upcoming Matches */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold">{translations.matchSchedule.upcomingMatches}</h3>
          </div>
          {redirectionLinks && (
            <Button
              as={Link}
              href={`/matches${
                selectedCategory && selectedCategory !== 'all'
                  ? `?category=${selectedCategory}`
                  : ''
              }`}
              variant="light"
              size="sm"
              color="primary"
              endContent={<ArrowRightIcon className="w-4 h-4" />}
            >
              {translations.matchSchedule.allMatches}
            </Button>
          )}
        </CardHeader>
        <CardBody>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  redirectionLinks={redirectionLinks}
                  onStartResultFlow={onStartResultFlow}
                  showResultButton={showResultButton}
                />
              ))}
              {upcomingMatches.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">
                    {Array.isArray(allMatches) && allMatches.length === 0
                      ? translations.matches.noMatches
                      : translations.matchSchedule.noUpcomingMatches}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent Results */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold">{translations.matchSchedule.recentResults}</h3>
          </div>
          {redirectionLinks && (
            <Button
              as={Link}
              href={`/matches${
                selectedCategory && selectedCategory !== 'all'
                  ? `?category=${selectedCategory}`
                  : ''
              }`}
              variant="light"
              size="sm"
              color="primary"
              endContent={<ArrowRightIcon className="w-4 h-4" />}
            >
              {translations.matchSchedule.allMatches}
            </Button>
          )}
        </CardHeader>
        <CardBody>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {recentResults.map((match) => (
                <MatchRow key={match.id} match={match} redirectionLinks={redirectionLinks} />
              ))}
              {recentResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">
                    {Array.isArray(allMatches) && allMatches.length === 0
                      ? translations.matches.noMatches
                      : translations.matchSchedule.noRecentResults}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
