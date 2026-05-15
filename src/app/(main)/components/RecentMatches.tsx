import Link from 'next/link';

import {Button} from '@heroui/button';
import {Card, CardBody, CardHeader} from '@heroui/card';

import {ArrowRightIcon, TrophyIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {LoadingSpinner, MatchRow} from '@/components';
import {Match} from '@/types';

interface RecentMatchesProps {
  loading: boolean;
  selectedCategory: string;
  allMatches: Match[];
  recentResults: Match[];
  redirectionLinks: boolean;
  refereesByMatchId?: Map<string, {order: number; name: string; surname: string}[]>;
}

export const RecentMatches = ({
  loading,
  selectedCategory,
  allMatches,
  recentResults,
  redirectionLinks,
  refereesByMatchId,
}: RecentMatchesProps) => {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-green-600" />
          <h3 className="text-xl font-semibold">
            {translations.matches.matchSchedule.recentResults}
          </h3>
        </div>
        {redirectionLinks && (
          <Button
            as={Link}
            href={`/matches${
              selectedCategory && selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''
            }`}
            variant="light"
            size="sm"
            color="primary"
            endContent={<ArrowRightIcon className="w-4 h-4" />}
          >
            {translations.matches.matchSchedule.allMatches}
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {recentResults.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                redirectionLinks={redirectionLinks}
                referees={refereesByMatchId?.get(match.id)}
              />
            ))}
            {recentResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-2">
                  {Array.isArray(allMatches) && allMatches.length === 0
                    ? translations.matches.noMatches
                    : translations.matches.matchSchedule.noRecentResults}
                </div>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
