import React from 'react';
import {Card, CardBody, CardHeader, Skeleton} from '@heroui/react';

interface LineupSkeletonProps {
  showHeader?: boolean;
  showTabs?: boolean;
  playerCount?: number;
  coachCount?: number;
}

const LineupSkeleton: React.FC<LineupSkeletonProps> = ({
  showHeader = true,
  showTabs = true,
  playerCount = 5,
  coachCount = 2,
}) => {
  const renderTableSkeleton = (rowCount: number) => (
    <div className="space-y-3">
      {/* Table header skeleton */}
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-12 rounded" />
        <Skeleton className="h-4 w-12 rounded" />
        <Skeleton className="h-4 w-8 rounded" />
        <Skeleton className="h-4 w-8 rounded" />
        <Skeleton className="h-4 w-8 rounded" />
        <Skeleton className="h-4 w-8 rounded" />
        <Skeleton className="h-4 w-8 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>

      {/* Table rows skeleton */}
      {Array.from({length: rowCount}).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-8 rounded" />
          <Skeleton className="h-4 w-8 rounded" />
          <Skeleton className="h-4 w-6 rounded" />
          <Skeleton className="h-4 w-6 rounded" />
          <Skeleton className="h-4 w-6 rounded" />
          <Skeleton className="h-4 w-6 rounded" />
          <Skeleton className="h-4 w-6 rounded" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32 rounded" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </CardHeader>
      )}

      <CardBody>
        {showTabs ? (
          <div className="space-y-4">
            {/* Tabs skeleton */}
            <div className="flex space-x-4">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-4">{renderTableSkeleton(playerCount)}</div>
          </div>
        ) : (
          <div className="space-y-4">{renderTableSkeleton(playerCount)}</div>
        )}
      </CardBody>
    </Card>
  );
};

export default LineupSkeleton;
