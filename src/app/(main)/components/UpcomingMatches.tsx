import Link from 'next/link';

import {Button} from '@heroui/button';
import {Card, CardBody, CardHeader} from '@heroui/card';

import {ArrowRightIcon, CalendarIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {HStack, LoadingSpinner, MatchRow} from '@/components';
import {Match} from '@/types';

interface UpcomingMatchesProps {
  loading: boolean;
  selectedCategory: string;
  allMatches: Match[];
  upcomingMatches: Match[];
  redirectionLinks: boolean;
  onStartResultFlow?: (match: Match) => void;
  showResultButton?: boolean;
  refereesByMatchId?: Map<string, {order: number; name: string; surname: string}[]>;
}

export const UpcomingMatches = ({
  loading,
  selectedCategory,
  allMatches,
  upcomingMatches,
  redirectionLinks,
  onStartResultFlow,
  showResultButton = false,
  refereesByMatchId,
}: UpcomingMatchesProps) => {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <HStack spacing={2}>
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold">
            {translations.matches.matchSchedule.upcomingMatches}
          </h3>
        </HStack>
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
            {upcomingMatches.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                redirectionLinks={redirectionLinks}
                onStartResultFlow={onStartResultFlow}
                showResultButton={showResultButton}
                referees={refereesByMatchId?.get(match.id)}
              />
            ))}
            {upcomingMatches.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-2">
                  {Array.isArray(allMatches) && allMatches.length === 0
                    ? translations.matches.noMatches
                    : translations.matches.matchSchedule.noUpcomingMatches}
                </div>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
