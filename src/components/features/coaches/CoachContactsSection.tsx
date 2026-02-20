'use client';

import React from 'react';

import {Card, CardBody, CardHeader, Skeleton} from '@heroui/react';

import {UserGroupIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {useFetchPublicCoachCards} from '@/hooks';

import CoachCardDisplay from './CoachCardDisplay';

interface CoachContactsSectionProps {
  categoryId: string;
  title?: string;
}

/**
 * Section component that displays all published coach cards for a category
 * Used on public category pages
 */
export default function CoachContactsSection({
  categoryId,
  title = translations.coachCards.section.title,
}: CoachContactsSectionProps) {
  const {data: coaches, loading, error} = useFetchPublicCoachCards({categoryId});

  // Don't render if no coaches or error
  if (!loading && (error || coaches.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardBody className="flex flex-col items-center p-6">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="h-5 w-24 mt-4 rounded" />
                  <Skeleton className="h-4 w-full mt-2 rounded" />
                  <Skeleton className="h-4 w-32 mt-4 rounded" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              coaches.length === 1
                ? 'grid-cols-1 max-w-sm mx-auto'
                : coaches.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {coaches.map((coach) => (
              <CoachCardDisplay key={coach.id} coach={coach} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
