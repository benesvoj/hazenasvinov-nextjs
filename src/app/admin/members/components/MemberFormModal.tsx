import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { translations } from "@/lib/translations";
import { Category } from "@/types";

interface MemberFormData {
  registration_number: string;
  name: string;
  surname: string;
  date_of_birth: string;
  category: string;
  sex: 'male' | 'female';
  functions: string[];
}

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  formData: MemberFormData;
  setFormData: (data: MemberFormData) => void;
  categories: Category[];
  sexOptions: Record<string, string>;
  functionOptions: Record<string, string>;
  submitButtonText: string;
  isEditMode?: boolean;
}

export default function MemberFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  formData,
  setFormData,
  categories,
  sexOptions,
  functionOptions,
  submitButtonText,
  isEditMode = false,
}: MemberFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Row 1: Registration Number */}
            <div className="w-full">
              <Input
                label={
                  isEditMode
                    ? "Registrační číslo"
                    : "Registrační číslo (volitelné - vygeneruje se automaticky)"
                }
                placeholder={isEditMode ? "" : "REG-2024-0001"}
                value={formData.registration_number}
                onChange={(e) =>
                  setFormData({ ...formData, registration_number: e.target.value })
                }
                isRequired={isEditMode}
              />
            </div>

            {/* Row 2: Name and Surname */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Jméno"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
              <Input
                label="Příjmení"
                value={formData.surname}
                onChange={(e) =>
                  setFormData({ ...formData, surname: e.target.value })
                }
                isRequired
              />
            </div>

            {/* Row 3: Date of Birth and Sex */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Datum narození"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
                isRequired
              />
              <Select
                label="Pohlaví"
                selectedKeys={[formData.sex]}
                onSelectionChange={(keys) =>
                  setFormData({
                    ...formData,
                    sex: Array.from(keys)[0] as "male" | "female",
                    category: "", // Clear category when sex changes
                  })
                }
                isRequired
              >
                {Object.entries(sexOptions).map(([key, value]) => (
                  <SelectItem key={key}>{value}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Row 4: Category */}
            <div className="w-full">
              <Select
                label="Kategorie"
                selectedKeys={[formData.category]}
                onSelectionChange={(keys) =>
                  setFormData({
                    ...formData,
                    category: Array.from(keys)[0] as string,
                  })
                }
                isRequired
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
                    <SelectItem key={category.code}>{category.name}</SelectItem>
                  ))}
              </Select>
              {!formData.sex && (
                <p className="text-sm text-gray-500 mt-1">Vyberte nejprve pohlaví pro zobrazení dostupných kategorií</p>
              )}
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mt-1 space-y-1">
                  <div>
                    Debug: {categories.length} categories, sex: {formData.sex}, filtered: {
                      categories.filter(cat => {
                        if (formData.sex === 'male') {
                          return cat.gender === 'male' || cat.gender === 'mixed';
                        } else if (formData.sex === 'female') {
                          return cat.gender === 'female' || cat.gender === 'mixed';
                        }
                        return false;
                      }).length
                    }
                  </div>
                  <div>
                    Available genders: {Array.from(new Set(categories.map(cat => cat.gender))).join(', ')}
                  </div>
                  <div>
                    Category codes: {categories.map(cat => `${cat.code}(${cat.gender})`).join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Row 5: Function Selection with Chips */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Funkce (volitelné)
              </label>
              {Object.keys(functionOptions).length === 0 ? (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border">
                  Žádné funkce nejsou momentálně dostupné. Kontaktujte administrátora pro nastavení funkcí.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(functionOptions).map(([key, value]) => (
                      <Chip
                        key={key}
                        variant={formData.functions.includes(key) ? "solid" : "bordered"}
                        color={formData.functions.includes(key) ? "primary" : "default"}
                        onClose={formData.functions.includes(key) ? () => {
                          setFormData({
                            ...formData,
                            functions: formData.functions.filter((f) => f !== key),
                          });
                        } : undefined}
                        className="cursor-pointer"
                        onClick={() => {
                          if (formData.functions.includes(key)) {
                            setFormData({
                              ...formData,
                              functions: formData.functions.filter((f) => f !== key),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              functions: [...formData.functions, key],
                            });
                          }
                        }}
                      >
                        {value}
                      </Chip>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Členové bez přiřazených funkcí budou označeni jako neaktivní v tabulce.
                  </p>
                </>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {translations.DeleteConfirmationModal.cancelButtonText}
          </Button>
          <Button color="primary" onPress={onSubmit}>
            {submitButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
