'use client';

import React, {useState} from 'react';

import {Alert, CheckboxGroup} from '@heroui/react';

import {CustomCheckbox} from '@/components/ui/checkbox/CustomCheckbox';

import {translations} from '@/lib/translations/index';

import {isEmpty} from '@/utils/arrayHelper';

import {UnifiedModal} from '@/components';
import {useFetchCategories} from '@/hooks';

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedCategories: string[]) => void;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
}

export const CategorySelectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = translations.admin.userRoles.modal.assignedCategoriesTitle,
  subtitle = translations.admin.userRoles.modal.assignedCategoriesSubtitle,
  isLoading = false,
}: CategorySelectionModalProps) => {
  const {data: categories} = useFetchCategories();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleConfirm = () => {
    onConfirm(selectedCategories);
  };

  const handleClose = () => {
    setSelectedCategories([]);
    onClose();
  };

  return (
    <UnifiedModal
      isFooterWithActions
      isOpen={isOpen}
      onClose={handleClose}
      onPress={handleConfirm}
      isDisabled={isEmpty(selectedCategories)}
      isLoading={isLoading}
      title={title}
      subtitle={subtitle}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {translations.admin.userRoles.labels.availableCategories}:
          </label>
          <CheckboxGroup value={selectedCategories} onValueChange={setSelectedCategories}>
            <div className={'grid grid-cols-2 gap-2'}>
              {categories.map((category) => (
                <CustomCheckbox key={category.id} value={category.id}>
                  {category.name}
                </CustomCheckbox>
              ))}
            </div>
          </CheckboxGroup>
        </div>
        <Alert
          color={'secondary'}
          title={translations.common.alerts.info}
          description={translations.admin.userRoles.modal.assignedCategoriesInfo}
        />
      </div>
    </UnifiedModal>
  );
};
