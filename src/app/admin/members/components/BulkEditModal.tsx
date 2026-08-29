import React from 'react';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Checkbox,
} from '@heroui/react';

import {getMemberFunctionOptions} from '@/enums/getMemberFunctionOptions';

import {GenderFilter} from '@/components';
import {Genders} from '@/enums';
import {Category} from '@/types';
import {isEmpty} from '@/utils';

export interface BulkEditFormData {
  gender: Genders.MALE | Genders.FEMALE | null;
  category: string;
  functions: string[];
}

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  selectedCount: number;
  formData: BulkEditFormData;
  setFormData: React.Dispatch<React.SetStateAction<BulkEditFormData>>;
  categories: Category[];
  isLoading: boolean;
}

export default function BulkEditModal({
  isOpen,
  onClose,
  onSubmit,
  selectedCount,
  formData,
  setFormData,
  categories,
  isLoading,
}: BulkEditModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>Hromadná úprava členů ({selectedCount} vybráno)</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              Vyberte pole, která chcete upravit. Prázdná pole zůstanou beze změny.
            </div>

            {/* Row 1: Sex and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <GenderFilter
                  value={formData.gender}
                  onChange={(value) => setFormData({...formData, gender: value})}
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategorie
                </label>
                <Select
                  selectedKeys={formData.category ? [formData.category] : []}
                  onSelectionChange={(keys) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: Array.from(keys)[0] as string,
                    }))
                  }
                  placeholder="Ponechat beze změny"
                >
                  {categories.map((category) => (
                    <SelectItem key={category.id}>{category.name}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Row 2: Functions Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Funkce
              </label>
              <div className="flex flex-wrap gap-2">
                {getMemberFunctionOptions().map(({value, label}) => (
                  <Checkbox
                    key={value}
                    isSelected={formData.functions.includes(value)}
                    onValueChange={(checked) => {
                      if (checked) {
                        setFormData((prev) => ({
                          ...prev,
                          functions: [...prev.functions, value],
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          functions: prev.functions.filter((f) => f !== value),
                        }));
                      }
                    }}
                  >
                    {label}
                  </Checkbox>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Prázdný výběr ponechá současné funkce beze změny.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button
            color="primary"
            onPress={onSubmit}
            isLoading={isLoading}
            isDisabled={!formData.gender && !formData.category && isEmpty(formData.functions)}
          >
            Uložit změny
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
