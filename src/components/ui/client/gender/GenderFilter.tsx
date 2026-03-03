'use client';

import {translations} from '@/lib/translations/index';

import {Choice} from '@/components';
import {Genders} from '@/enums';

interface GenderFilterProps {
  value: Genders.MALE | Genders.FEMALE | null;
  onChange: (value: Genders.MALE | Genders.FEMALE | null) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ITEMS = [
  {key: Genders.MALE, label: translations.common.gender.male},
  {key: Genders.FEMALE, label: translations.common.gender.female},
];

export const GenderFilter = ({value, onChange, size, className}: GenderFilterProps) => (
  <Choice
    items={ITEMS}
    value={value}
    onChange={(v) => onChange(v as Genders.MALE | Genders.FEMALE | null)}
    size={size}
    className={className}
    placeholder={translations.common.labels.all}
    ariaLabel={translations.common.labels.gender}
  />
);
