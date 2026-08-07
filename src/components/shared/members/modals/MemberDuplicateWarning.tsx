'use client';

import React from 'react';

import {Alert} from '@heroui/react';

import {translations} from '@/lib/translations';

import {Category, MemberDuplicate} from '@/types';
import {isEmpty} from '@/utils';

interface MemberDuplicateWarningProps {
  duplicates: MemberDuplicate[];
  /** Used to name the category each namesake belongs to. */
  categories: Category[];
}

/**
 * Non-blocking notice that a member with the same name already exists.
 *
 * Namesakes are allowed — the point is that a record in another category is
 * invisible from here, so the user would otherwise create a duplicate without
 * ever knowing. Saving stays enabled.
 */
export const MemberDuplicateWarning = ({duplicates, categories}: MemberDuplicateWarningProps) => {
  const t = translations.members.duplicates;

  if (isEmpty(duplicates)) return null;

  const categoryName = (categoryId: string | null) =>
    categories.find((category) => category.id === categoryId)?.name ?? t.unknownCategory;

  return (
    <Alert color="warning" variant="faded" title={t.title} className="mb-2">
      <span className="text-sm">{t.description}</span>
      <ul className="mt-1 list-disc pl-4 text-sm">
        {duplicates.map((duplicate) => (
          <li key={duplicate.id}>
            {duplicate.surname} {duplicate.name} — {categoryName(duplicate.category_id)}
            {duplicate.registration_number ? `, ${duplicate.registration_number}` : ''}
            {duplicate.is_active === false ? ` (${t.inactive})` : ''}
          </li>
        ))}
      </ul>
    </Alert>
  );
};
