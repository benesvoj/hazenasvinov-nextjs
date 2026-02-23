'use client';

import {Card, CardBody, CardHeader} from '@heroui/react';

import {UserGroupIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {Heading, ProfileCard} from '@/components';
import {PublicProfileCard} from '@/types';
import {isEmpty} from '@/utils';

interface ContactsSectionProps {
  contacts: PublicProfileCard[];
  title?: string;
}

/**
 * Renders a section that displays a list of contact profiles in a card layout.
 *
 * @param params - Component parameters.
 * @returns The rendered contact section as a card element, or `null` if the `contacts` array is empty.
 */
export default function ContactsSection({
  contacts,
  title = translations.coachCards.section.title,
}: ContactsSectionProps) {
  if (isEmpty(contacts)) return null;

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
            contacts.length === 1
              ? 'grid-cols-1 max-w-sm mx-auto'
              : contacts.length === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {contacts.map((contact) => (
            <ProfileCard key={contact.id} profile={contact} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
