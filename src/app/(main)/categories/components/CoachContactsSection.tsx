import {Card, CardBody, CardHeader} from '@heroui/react';

import {UserGroupIcon} from '@heroicons/react/24/outline';

import {Heading} from '@/components/ui/heading/Heading';

import {translations} from '@/lib/translations/index';

import CoachCardDisplay from '@/app/(main)/categories/components/CoachCardDisplay';

import {PublicCoachCard} from '@/types';
import {isEmpty} from '@/utils';

interface CoachContactsSectionProps {
  coaches: PublicCoachCard[];
  title?: string;
}

/**
 * Server component that displays coach cards for a category
 * Receives data as props from the parent server component (CategoryPage)
 */
export default function CoachContactsSection({
  coaches,
  title = translations.coachCards.section.title,
}: CoachContactsSectionProps) {
  if (isEmpty(coaches)) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-primary" />
          <Heading size={3}>{title}</Heading>
        </div>
      </CardHeader>
      <CardBody>
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
      </CardBody>
    </Card>
  );
}
