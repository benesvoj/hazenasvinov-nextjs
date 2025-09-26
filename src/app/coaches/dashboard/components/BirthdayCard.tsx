'use client';

import React from 'react';
import {Card, CardBody, CardHeader, Chip, Avatar} from '@heroui/react';
import {GiftIcon, CalendarIcon} from '@heroicons/react/24/outline';
import {useUpcomingBirthdays} from '@/hooks/coach/useUpcomingBirthdays';
import {formatDateString} from '@/helpers';

interface BirthdayCardProps {
  categoryId?: string;
}

export default function BirthdayCard({categoryId}: BirthdayCardProps) {
  const {birthdays, loading, error} = useUpcomingBirthdays(3, true, categoryId);

  const getDaysUntilText = (days: number) => {
    if (days === 0) return 'Dnes!';
    if (days === 1) return 'Zítra';
    if (days <= 7) return `Za ${days} dní`;
    if (days <= 30) return `Za ${days} dní`;
    return `Za ${days} dní`;
  };

  const getDaysUntilColor = (days: number) => {
    if (days === 0) return 'danger'; // Today
    if (days <= 3) return 'warning'; // This week
    if (days <= 7) return 'primary'; // Next week
    return 'primary'; // Later
  };

  const getAgeText = (age: number) => {
    if (age === 1) return '1 rok';
    if (age >= 2 && age <= 4) return `${age} roky`;
    return `${age} let`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Nadcházející narozeniny</h3>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

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

  if (birthdays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Nadcházející narozeniny</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <GiftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Žádné nadcházející narozeniny</p>
            <p className="text-sm text-gray-500 mt-2">v přiřazených kategoriích</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GiftIcon className="w-5 h-5 text-pink-600" />
          <h3 className="text-lg font-semibold">Nadcházející narozeniny</h3>
        </div>
      </CardHeader>
      <CardBody>
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
              Zobrazuje se nejbližších 3 narozenin
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
