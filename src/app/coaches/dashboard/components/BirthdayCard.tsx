'use client';

import React from 'react';

import {Alert} from '@heroui/alert';

import {GiftIcon} from '@heroicons/react/24/outline';

import {useUpcomingBirthdays} from '@/hooks/coach/useUpcomingBirthdays';

import {translations} from '@/lib/translations';

import {BirthdayCardItem} from '@/app/coaches/dashboard/components/BirthdayCardItem';

import {ContentCard, HStack, VStack} from '@/components';
import {getCount} from '@/utils';

interface BirthdayCardProps {
  categoryId?: string;
}

export default function BirthdayCard({categoryId}: BirthdayCardProps) {
  const {birthdays, loading, error} = useUpcomingBirthdays(3, true, categoryId);

  const title = (
    <HStack spacing={2}>
      <GiftIcon className="w-5 h-5 text-pink-600" />
      {translations.coachPortal.birthdayCard.title}
    </HStack>
  );

  const errorState = (
    <HStack justify={'center'}>
      <Alert
        color={'danger'}
        description={translations.coachPortal.labels.fetchingCardError(error)}
      />
    </HStack>
  );

  const footer = (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500 text-center">
        {translations.coachPortal.birthdayCard.lastBirthdaysTitle}
      </p>
    </div>
  );

  return (
    <ContentCard
      title={title}
      isLoading={loading}
      errorState={error && errorState}
      footer={getCount(birthdays) > 2 && footer}
    >
      <VStack spacing={2}>
        {birthdays.map((member) => (
          <BirthdayCardItem
            key={member.id}
            name={member.name}
            surname={member.surname}
            nextBirthday={member.nextBirthday}
            daysUntilBirthday={member.daysUntilBirthday}
            age={member.age}
          />
        ))}
      </VStack>
    </ContentCard>
  );
}
