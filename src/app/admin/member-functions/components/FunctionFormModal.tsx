import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Checkbox, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { MemberFunction } from '@/types';
import { translations } from '@/lib/translations';

interface FunctionFormModalProps {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<MemberFunction>) => Promise<void>;
  loading: boolean;
  initialData?: Partial<MemberFunction>;
}

export default function FunctionFormModal({
  isOpen,
  isEdit,
  onClose,
  onSubmit,
  loading,
  initialData
}: FunctionFormModalProps) {
  const [formData, setFormData] = useState<Partial<MemberFunction>>({
    name: '',
    display_name: '',
    description: '',
    sort_order: 0,
    is_active: true
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        setFormData({
          name: initialData.name || '',
          display_name: initialData.display_name || '',
          description: initialData.description || '',
          sort_order: initialData.sort_order || 0,
          is_active: initialData.is_active ?? true
        });
      } else {
        // Reset form for add mode
        setFormData({
          name: '',
          display_name: '',
          description: '',
          sort_order: 0,
          is_active: true
        });
      }
    }
  }, [isOpen, isEdit, initialData]);

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error in FunctionFormModal:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          {isEdit ? "Upravit funkci" : "Přidat novou funkci"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Název (kód)"
              placeholder="např. player, coach"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              isRequired
            />
            
            <Input
              label="Zobrazovaný název"
              placeholder="např. Hráč, Trenér"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              isRequired
            />
            
            <Textarea
              label="Popis"
              placeholder="Popis funkce (volitelné)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <Input
              label="Řazení"
              type="number"
              placeholder="0"
              value={formData.sort_order?.toString() || '0'}
              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
            />
            
            <Checkbox
              isSelected={formData.is_active}
              onValueChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            >
              Aktivní
            </Checkbox>
          </div>
        </ModalBody>
        <ModalFooter>
        <Button
            variant="flat"
            onPress={onClose}
          >
            {translations.button.cancel}
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={loading}
          >
            {isEdit ? translations.button.save : translations.button.add}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
