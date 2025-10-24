import React from 'react';

import {Checkbox, Input, Textarea} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {ModalMode} from '@/enums';
import {MemberFunctionFormData} from '@/types';

interface FunctionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  mode: ModalMode;
  formData: MemberFunctionFormData;
  setFormData: (data: MemberFunctionFormData) => void;
}

export default function FunctionFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  mode,
  formData,
  setFormData,
}: FunctionFormModalProps) {
  const modalTitle = mode === ModalMode.EDIT ? 'Upravit funkci' : 'Přidat novou funkci';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      isFooterWithActions
      onPress={onSubmit}
      isLoading={loading}
      size="sm"
    >
      <div className="space-y-4">
        <Input
          label="Název (kód)"
          placeholder="např. player, coach"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          isRequired
        />

        <Input
          label="Zobrazovaný název"
          placeholder="např. Hráč, Trenér"
          value={formData.display_name}
          onChange={(e) => setFormData({...formData, display_name: e.target.value})}
          isRequired
        />

        <Textarea
          label="Popis"
          placeholder="Popis funkce (volitelné)"
          value={formData.description ?? ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />

        <Input
          label="Řazení"
          type="number"
          placeholder="0"
          value={formData.sort_order?.toString() || '0'}
          onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
        />

        <Checkbox
          isSelected={formData.is_active ?? true}
          onValueChange={(checked) => setFormData({...formData, is_active: checked})}
        >
          Aktivní
        </Checkbox>
      </div>
    </UnifiedModal>
  );
}
