import React from 'react';

import {Chip} from '@heroui/chip';

import {CalendarIcon} from '@heroicons/react/24/outline';

import {getAgeText, getDaysUntilColor, getDaysUntilText} from '@/app/coaches/dashboard/utils';

import {HStack, VStack} from '@/components';
import {formatDateString} from '@/helpers';

interface BirthdayCardItemProps {
  name: string;
  surname: string;
  nextBirthday: Date;
  daysUntilBirthday: number;
  age: number;
}

export const BirthdayCardItem = (props: BirthdayCardItemProps) => {
  return (
    <HStack
      justify={'between'}
      align={'center'}
      padding={3}
      className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full"
    >
      <VStack spacing={2} align={'start'}>
        <HStack className="font-medium text-gray-900">
          {props.name} {props.surname}
        </HStack>
        <HStack spacing={2} className="text-xs text-gray-500">
          <CalendarIcon className="w-3 h-3" />
          <span>{formatDateString(props.nextBirthday.toISOString().split('T')[0])}</span>
        </HStack>
      </VStack>
      <VStack align={'end'}>
        <Chip size="sm" color={getDaysUntilColor(props.daysUntilBirthday)} variant="flat">
          {getDaysUntilText(props.daysUntilBirthday)}
        </Chip>
        <p className="text-xs text-gray-500 mt-1">{getAgeText(props.age + 1)}</p>
      </VStack>
    </HStack>
  );
};
