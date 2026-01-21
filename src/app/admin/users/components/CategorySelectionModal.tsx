'use client';

import React, {useState} from 'react';

import {Checkbox, CheckboxGroup} from '@heroui/react';

import {UnifiedModal} from '@/components/ui/modals';

import {hasItems, isEmpty} from '@/utils/arrayHelper';

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
  title = 'Výběr kategorií',
  subtitle = 'Vyberte kategorie, které budou přiřazeny této roli.',
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
        <p className="text-sm text-gray-700">
          Kategorie můžete vybrat později, ale pro správné fungování systému je doporučeno přiřadit
          alespoň jednu kategorii.
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Dostupné kategorie:</label>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            <CheckboxGroup value={selectedCategories} onValueChange={setSelectedCategories}>
              {categories.map((category) => (
                <Checkbox key={category.id} value={category.id}>
                  {category.name}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>
        </div>

        {hasItems(selectedCategories) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Vybrané kategorie:</strong> {selectedCategories.length}
            </p>
          </div>
        )}
      </div>
    </UnifiedModal>
  );
};
