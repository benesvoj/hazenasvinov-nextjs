'use client';

import {translations} from '@/lib/translations';

import {Choice} from '@/components';
import {Genders} from '@/enums';

interface GenderSelectProps {
  value: Genders.MALE | Genders.FEMALE;
  onChange: (value: Genders.MALE | Genders.FEMALE) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isDisabled?: boolean;
}

const ITEMS = [
  {key: Genders.MALE, label: translations.common.enums.gender.male},
  {key: Genders.FEMALE, label: translations.common.enums.gender.female},
];

export const GenderSelect = ({
  value,
  onChange,
  size = 'sm',
  className,
  isDisabled,
}: GenderSelectProps) => (
  <Choice
    disallowEmptySelection
    items={ITEMS}
    value={value}
    onChange={(v) => onChange(v as Genders.MALE | Genders.FEMALE)}
    label={translations.common.labels.gender}
    isRequired
    size={size}
    className={className}
    isDisabled={isDisabled}
  />
);
