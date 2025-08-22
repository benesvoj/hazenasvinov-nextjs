import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: () => void;
  formData: {
    code: string;
    name: string;
    description: string;
    age_group: string;
    gender: string;
    is_active: boolean;
    sort_order: number;
  };
  setFormData: (data: any) => void;
  ageGroups: Record<string, string>;
  genders: Record<string, string>;
}

export default function AddCategoryModal({
  isOpen,
  onClose,
  onAddCategory,
  formData,
  setFormData,
  ageGroups,
  genders
}: AddCategoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader>Přidat kategorii</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Základní údaje</h4>
              <Input
                label="Kód"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                isRequired
                placeholder="např. men, women, juniorBoys"
              />
              <Input
                label="Název"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
                placeholder="např. Muži, Ženy, Dorostenci"
              />
              <Input
                label="Popis"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Volitelný popis kategorie"
              />
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
              >
                <option value="">Vyberte věkovou skupinu</option>
                {Object.entries(ageGroups).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Vyberte pohlaví</option>
                {Object.entries(genders).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <Input
                label="Pořadí"
                type="number"
                value={formData.sort_order.toString()}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Aktivní</span>
              </label>
            </div>

            {/* Right Column - Competition Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Nastavení soutěže</h4>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Funkce pro správu sezón bude implementována v další verzi.
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button color="primary" onPress={onAddCategory}>
            Přidat
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
