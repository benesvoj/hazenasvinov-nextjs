import React from 'react';

import {Checkbox, Input, Textarea} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {ModalMode} from '@/enums';
import {translations} from "@/lib";
import {MemberFunctionFormData} from '@/types';

interface FunctionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
  mode: ModalMode;
  formData: MemberFunctionFormData;
  setFormData: (data: MemberFunctionFormData) => void;
}

const tMemberFunctions = translations.memberFunctions;

export default function FunctionFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  mode,
  formData,
  setFormData,
}: FunctionFormModalProps) {
  const modalTitle = mode === ModalMode.EDIT ? tMemberFunctions.modal.editTitle : tMemberFunctions.modal.addTitle;

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
          label={tMemberFunctions.modal.formFields.name}
          placeholder={tMemberFunctions.modal.formFields.namePlaceholder}
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          isRequired
        />

        <Input
          label={tMemberFunctions.modal.formFields.displayName}
          placeholder={tMemberFunctions.modal.formFields.displayNamePlaceholder}
          value={formData.display_name}
          onChange={(e) => setFormData({...formData, display_name: e.target.value})}
          isRequired
        />

        <Textarea
          label={tMemberFunctions.modal.formFields.description}
          placeholder={tMemberFunctions.modal.formFields.descriptionPlaceholder}
          value={formData.description ?? ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />

        <Input
          label={tMemberFunctions.modal.formFields.order}
          type="number"
          placeholder={tMemberFunctions.modal.formFields.orderPlaceholder}
          value={formData.sort_order?.toString() || '0'}
          onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
        />

        <Checkbox
          isSelected={formData.is_active ?? true}
          onValueChange={(checked) => setFormData({...formData, is_active: checked})}
        >
          {tMemberFunctions.modal.formFields.active}
        </Checkbox>
      </div>
    </UnifiedModal>
  );
}
