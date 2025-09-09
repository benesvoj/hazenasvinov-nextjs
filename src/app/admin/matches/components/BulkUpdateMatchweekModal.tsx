'use client';

import React from "react";
import { Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { CategoryNew, Match } from "@/types";

interface BulkUpdateMatchweekModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkUpdateData: {
    categoryId: string;
    matchweek: string;
    action: 'set' | 'remove';
  };
  onBulkUpdateDataChange: (data: { categoryId: string; matchweek: string; action: 'set' | 'remove' }) => void;
  onBulkUpdate: () => void;
  categories: CategoryNew[];
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

  const handleActionChange = (keys: any) => {
    const selectedAction = Array.from(keys)[0] as 'set' | 'remove';
    onBulkUpdateDataChange({
      ...bulkUpdateData,
      action: selectedAction || 'set'
    });
  };

  // Get matches based on the selected action
  const getMatchesToUpdate = () => {
    if (bulkUpdateData.action === 'remove') {
      // For remove action, get matches WITH matchweek
      return matches.filter(match => 
        match.category_id === bulkUpdateData.categoryId && 
        match.matchweek !== null && match.matchweek !== undefined
      );
    } else {
      // For set action, get matches WITHOUT matchweek
      return matches.filter(match => 
        match.category_id === bulkUpdateData.categoryId && 
        !match.matchweek
      );
    }
  };

  const matchesToUpdate = getMatchesToUpdate();
  const selectedCategoryName = categories.find(c => c.id === bulkUpdateData.categoryId)?.name;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>Hromadná úprava kol</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tato funkce umožní nastavit nebo odebrat kolo pro zápasy v dané kategorii.
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
                Akce
              </label>
              <Select
                placeholder="Vyberte akci"
                selectedKeys={[bulkUpdateData.action]}
                onSelectionChange={handleActionChange}
                className="w-full"
                isDisabled={isSeasonClosed}
              >
                <SelectItem key="set">Nastavit kolo</SelectItem>
                <SelectItem key="remove">Odebrat kolo</SelectItem>
              </Select>
            </div>

            {bulkUpdateData.action === 'set' && (
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
            )}

            {bulkUpdateData.categoryId && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {bulkUpdateData.action === 'set' 
                    ? `Nalezeno ${matchesToUpdate.length} zápasů bez kola v kategorii "${selectedCategoryName}"`
                    : `Nalezeno ${matchesToUpdate.length} zápasů s kolem v kategorii "${selectedCategoryName}"`
                  }
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
            isDisabled={
              !bulkUpdateData.categoryId || 
              (bulkUpdateData.action === 'set' && !bulkUpdateData.matchweek) ||
              isSeasonClosed
            }
          >
            Hromadně upravit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
