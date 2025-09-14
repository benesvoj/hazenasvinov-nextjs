import {Card, CardBody} from '@heroui/react';
import {formatDateToDayAndMonth} from '@/helpers';

interface MatchResultCardProps {
  match: any;
  categoryName: string;
}

export default function MatchResultCard({match, categoryName}: MatchResultCardProps) {
  return (
    <Card className="w-full min-w-[200px] max-w-[230px] hover:shadow-lg transition-shadow duration-200 flex-shrink-0">
      <CardBody className="p-2">
        <div className="text-xs text-center w-full">{categoryName}</div>
        <div className="flex gap-2 justify-between px-2">
          <div className="flex align-center text-xs gap-4">
            <div className="flex flex-col justify-center">
              <span>{formatDateToDayAndMonth(match.date)}</span>
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {match.home_team?.club_category?.club?.short_name}
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {match.away_team?.club_category?.club?.short_name}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900 dark:text-white flex flex-col">
                {match.home_score} : {match.away_score}
                <span className="text-xs text-center w-full text-gray-500 dark:text-gray-400">
                  ( {match.home_score_halftime} : {match.away_score_halftime} )
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
