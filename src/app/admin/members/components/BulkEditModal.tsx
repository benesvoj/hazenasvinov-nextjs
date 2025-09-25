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
import {Category} from '@/types';
import {getMemberFunctionOptions} from '@/enums';
import {GenderType} from '@/constants';
interface BulkEditFormData {
  sex: GenderType;
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
              {/* Sex Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pohlaví
                </label>
                <Select
                  selectedKeys={formData.sex ? [formData.sex] : []}
                  onSelectionChange={(keys) => {
                    const newSex = Array.from(keys)[0] as GenderType;
                    setFormData((prev) => ({
                      ...prev,
                      sex: newSex,
                      // Clear category when sex changes to ensure proper filtering
                      category: newSex !== prev.sex ? '' : prev.category,
                    }));
                  }}
                  placeholder="Ponechat beze změny"
                >
                  <SelectItem key="male">Muž</SelectItem>
                  <SelectItem key="female">Žena</SelectItem>
                </Select>
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
                  isDisabled={!formData.sex}
                >
                  {categories
                    .filter((category) => {
                      // Filter categories based on sex using the gender field from database
                      if (formData.sex === 'male') {
                        // For male sex, show male and mixed categories
                        return category.gender === 'male' || category.gender === 'mixed';
                      } else if (formData.sex === 'female') {
                        // For female sex, show female and mixed categories
                        return category.gender === 'female' || category.gender === 'mixed';
                      }
                      return false;
                    })
                    .map((category) => (
                      <SelectItem key={category.id}>{category.name}</SelectItem>
                    ))}
                </Select>
                {!formData.sex && (
                  <p className="text-sm text-gray-500 mt-1">
                    Vyberte nejprve pohlaví pro zobrazení dostupných kategorií
                  </p>
                )}
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
            isDisabled={!formData.sex && !formData.category && formData.functions.length === 0}
          >
            Uložit změny
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
