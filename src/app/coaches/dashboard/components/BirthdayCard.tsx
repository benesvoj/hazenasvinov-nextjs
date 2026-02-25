'use client';

import React from 'react';

import {Card, CardBody, CardHeader, Chip} from '@heroui/react';

import {CalendarIcon, GiftIcon} from '@heroicons/react/24/outline';

import {useUpcomingBirthdays} from '@/hooks/coach/useUpcomingBirthdays';

import {translations} from '@/lib/translations/index';

import {getAgeText, getDaysUntilColor, getDaysUntilText} from '@/app/coaches/dashboard/utils';

import {UnifiedCard} from '@/components';
import {EmptyStateTypes} from '@/enums';
import {formatDateString} from '@/helpers';

interface BirthdayCardProps {
  categoryId?: string;
}

export default function BirthdayCard({categoryId}: BirthdayCardProps) {
  const {birthdays, loading, error} = useUpcomingBirthdays(3, true, categoryId);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Nadcházející narozeniny</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Chyba při načítání narozenin: {error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <UnifiedCard
      title={translations.coachPortal.birthdayCard.title}
      icon={<GiftIcon className="w-5 h-5 text-pink-600" />}
      isLoading={loading}
    >
      <div className="space-y-2">
        {birthdays.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex flex-col items-start gap-2">
              <div className="font-medium text-gray-900">
                {member.name} {member.surname}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <CalendarIcon className="w-3 h-3" />
                <span>{formatDateString(member.nextBirthday.toISOString().split('T')[0])}</span>
              </div>
            </div>
            <div className="text-right">
              <Chip size="sm" color={getDaysUntilColor(member.daysUntilBirthday)} variant="flat">
                {getDaysUntilText(member.daysUntilBirthday)}
              </Chip>
              <p className="text-xs text-gray-500 mt-1">{getAgeText(member.age + 1)}</p>
            </div>
          </div>
        ))}
      </div>

      {birthdays.length === 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            {translations.coachPortal.birthdayCard.lastBirthdaysTitle}
          </p>
        </div>
      )}
    </UnifiedCard>
  );
}
