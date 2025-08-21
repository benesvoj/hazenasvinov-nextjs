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
import { Checkbox } from "@heroui/checkbox";
import { translations } from "@/lib/translations";

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
  categories: Record<string, string>;
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
          <div className="space-y-4">
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
              label="Kategorie"
              selectedKeys={[formData.category]}
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  category: Array.from(keys)[0] as string,
                })
              }
              isRequired
            >
              {Object.entries(categories).map(([key, value]) => (
                <SelectItem key={key}>{value}</SelectItem>
              ))}
            </Select>
            <Select
              label="Pohlaví"
              selectedKeys={[formData.sex]}
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  sex: Array.from(keys)[0] as "male" | "female",
                })
              }
              isRequired
            >
              {Object.entries(sexOptions).map(([key, value]) => (
                <SelectItem key={key}>{value}</SelectItem>
              ))}
            </Select>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Funkce
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(functionOptions).map(([key, value]) => (
                  <Checkbox
                    key={key}
                    isSelected={formData.functions.includes(key)}
                    onValueChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          functions: [...formData.functions, key],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          functions: formData.functions.filter((f) => f !== key),
                        });
                      }
                    }}
                  >
                    {value}
                  </Checkbox>
                ))}
              </div>
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
