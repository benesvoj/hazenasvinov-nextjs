'use client';

import React from "react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Category, Match } from "@/types/types";

interface BulkUpdateMatchweekModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkUpdateData: {
    categoryId: string;
    matchweek: string;
  };
  onBulkUpdateDataChange: (data: { categoryId: string; matchweek: string }) => void;
  onBulkUpdate: () => void;
  categories: Category[];
  matches: Match[];
  getMatchweekOptions: () => Array<{ value: string; label: string }>;
  isSeasonClosed: boolean;
}

export default function BulkUpdateMatchweekModal({
  isOpen,
  onClose,
  bulkUpdateData,
  onBulkUpdateDataChange,
  onBulkUpdate,
  categories,
  matches,
  getMatchweekOptions,
  isSeasonClosed
}: BulkUpdateMatchweekModalProps) {
  const handleCategoryChange = (keys: any) => {
    const selectedCategoryId = Array.from(keys)[0] as string;
    onBulkUpdateDataChange({
      ...bulkUpdateData,
      categoryId: selectedCategoryId || ""
    });
  };

  const handleMatchweekChange = (keys: any) => {
    const selectedMatchweek = Array.from(keys)[0] as string;
    onBulkUpdateDataChange({
      ...bulkUpdateData,
      matchweek: selectedMatchweek || ""
    });
  };

  const matchesWithoutMatchweek = matches.filter(match => 
    match.category_id === bulkUpdateData.categoryId && !match.matchweek
  );

  const selectedCategoryName = categories.find(c => c.id === bulkUpdateData.categoryId)?.name;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>Hromadná úprava kol</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tato funkce umožní nastavit stejné kolo pro všechny zápasy bez kola v dané kategorii.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategorie
              </label>
              <Select
                placeholder="Vyberte kategorii"
                selectedKeys={bulkUpdateData.categoryId ? [bulkUpdateData.categoryId] : []}
                onSelectionChange={handleCategoryChange}
                className="w-full"
                isDisabled={isSeasonClosed}
              >
                {categories.map((category) => (
                  <SelectItem key={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kolo
              </label>
              <Select
                placeholder="Vyberte kolo"
                selectedKeys={bulkUpdateData.matchweek ? [bulkUpdateData.matchweek] : []}
                onSelectionChange={handleMatchweekChange}
                className="w-full"
                isDisabled={isSeasonClosed}
              >
                {getMatchweekOptions().slice(1).map((option) => ( // Skip the "Bez kola" option
                  <SelectItem key={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {bulkUpdateData.categoryId && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Nalezeno {matchesWithoutMatchweek.length} zápasů bez kola v kategorii &quot;{selectedCategoryName}&quot;
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="flat" onPress={onClose}>
            Zrušit
          </Button>
          <Button 
            color="primary" 
            onPress={onBulkUpdate}
            isDisabled={!bulkUpdateData.categoryId || !bulkUpdateData.matchweek || isSeasonClosed}
          >
            Hromadně upravit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
