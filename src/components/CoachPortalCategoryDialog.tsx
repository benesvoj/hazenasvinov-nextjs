"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  SelectedItems,
  Chip,
} from "@heroui/react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { useAdminCategorySimulation } from "@/contexts/AdminCategorySimulationContext";
import LoadingSpinner from "./LoadingSpinner";

interface CoachPortalCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

type Category = {
  id: string;
  name: string;
  code: string;
};

export function CoachPortalCategoryDialog({
  isOpen,
  onClose,
  onConfirm,
}: CoachPortalCategoryDialogProps) {
  const {
    selectedCategories,
    availableCategories,
    selectCategory,
    deselectCategory,
    clearSelection,
    loading,
  } = useAdminCategorySimulation();

  const [tempSelectedCategories, setTempSelectedCategories] = useState<
    string[]
  >([]);

  // Initialize temp selection when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedCategories([...selectedCategories]);
    }
  }, [isOpen, selectedCategories]);

  const handleConfirm = () => {
    // Update the actual selection
    selectedCategories.forEach((catId) => {
      if (!tempSelectedCategories.includes(catId)) {
        deselectCategory(catId);
      }
    });
    tempSelectedCategories.forEach((catId) => {
      if (!selectedCategories.includes(catId)) {
        selectCategory(catId);
      }
    });

    onConfirm();
  };

  const handleClearAll = () => {
    setTempSelectedCategories([]);
  };

  const handleSelectAll = () => {
    setTempSelectedCategories(availableCategories.map((cat) => cat.id));
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center space-x-2">
              <AcademicCapIcon className="h-5 w-5 text-blue-600" />
              <span>Test Coach Portal</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center space-x-2">
            <AcademicCapIcon className="h-5 w-5 text-blue-600" />
            <span>Test Coach Portal</span>
          </div>
          <p className="text-sm text-gray-600 font-normal">
            Select categories to simulate coach access. You&apos;ll see filtered
            content in the coach portal.
          </p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={handleSelectAll}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="bordered"
                  color="danger"
                  onPress={handleClearAll}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                {tempSelectedCategories.length} of {availableCategories.length}{" "}
                selected
              </div>
            </div>

            <Select
              placeholder="Vyberte kategorii"
              selectedKeys={tempSelectedCategories}
              isMultiline={true}
              selectionMode="multiple"
              items={availableCategories}
              variant="bordered"
              aria-label="Výběr kategorii"
              onSelectionChange={(items) => {
                setTempSelectedCategories(Array.from(items as Set<string>));
              }}
              renderValue={(items: SelectedItems<Category>) => {
                return (
                  <div className="flex flex-wrap gap-2 py-2">
                    {items.map((item) => (
                      <Chip key={item.key}>{item.data?.name}</Chip>
                    ))}
                  </div>
                );
              }}
            >
              {(category) => (
                <SelectItem key={category.id} aria-label={category.name}>
                  {category.name}
                </SelectItem>
              )}
            </Select>

            {/* Info text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>How it works:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Select the categories you want to test</li>
                  <li>Click &quot;Switch to Coach Portal&quot; to proceed</li>
                  <li>
                    You&apos;ll see filtered content as if you were a coach with
                    those categories
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleConfirm}
            startContent={<AcademicCapIcon className="h-4 w-4" />}
            isDisabled={tempSelectedCategories.length === 0}
          >
            Switch to Coach Portal
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
