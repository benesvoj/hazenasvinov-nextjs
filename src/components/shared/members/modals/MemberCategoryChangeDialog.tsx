'use client';

import React, {useState} from 'react';

import {translations} from '@/lib/translations';

import {Choice, Dialog, VStack} from '@/components';
import {getAssignableCategories, getMemberFullName} from '@/helpers';
import {Category, MemberInternal} from '@/types';
import {isEmpty} from '@/utils';

interface MemberCategoryChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the chosen category; the dialog itself performs no write. */
  onSubmit: (categoryId: string) => void;
  member: MemberInternal | null;
  /** Categories the current user may assign — already scoped to their portal. */
  categories: Category[];
  isLoading: boolean;
}

/**
 * Moves a member to another category.
 *
 * The picker only offers categories the member may actually join: their own
 * gender plus the mixed ones. See {@link getAssignableCategories}.
 */
export const MemberCategoryChangeDialog = ({
  isOpen,
  onClose,
  onSubmit,
  member,
  categories,
  isLoading,
}: MemberCategoryChangeDialogProps) => {
  const t = translations.members.changeCategory;

  // Seeded from the member the dialog was opened for. Callers must key the
  // component by member id so a new selection starts from that member's
  // category instead of the previous one's.
  const [selectedCategory, setSelectedCategory] = useState(member?.category_id ?? '');

  const assignable = getAssignableCategories(categories, member?.sex, member?.category_id);
  const currentCategoryName =
    categories.find((category) => category.id === member?.category_id)?.name ?? t.noCategory;

  const hasNoOptions = isEmpty(assignable);
  const isUnchanged = !selectedCategory || selectedCategory === member?.category_id;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={() => onSubmit(selectedCategory)}
      title={t.title}
      subtitle={getMemberFullName(member) || undefined}
      submitButtonLabel={t.submit}
      isDisabled={hasNoOptions || isUnchanged}
      isLoading={isLoading}
      size="md"
    >
      <VStack spacing={3} align="start">
        <span className="text-sm text-default-500">
          {t.currentCategory}: <span className="font-medium">{currentCategoryName}</span>
        </span>

        {hasNoOptions ? (
          <span className="text-sm">{t.noCategoriesAvailable}</span>
        ) : (
          <Choice
            label={t.newCategory}
            items={assignable.map((category) => ({key: category.id, label: category.name}))}
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value || '')}
            description={t.hint}
            size="sm"
            className="w-full"
          />
        )}
      </VStack>
    </Dialog>
  );
};
