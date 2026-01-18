'use client';

import React from 'react';

import {Input, Select, SelectItem, Textarea} from '@heroui/react';

import UnifiedModal from '@/components/ui/modals/UnifiedModal';

import {ModalMode} from '@/enums';
import {MONTH_OPTIONS} from '@/helpers';
import {translations} from '@/lib';
import {GrantFormData} from '@/types';

interface GrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: GrantFormData;
  setFormData: (data: GrantFormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  mode: ModalMode;
}

export default function GrantModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  mode,
  isLoading,
}: GrantModalProps) {
  const t = translations.grantCalendar;
  const isModeEdit = mode === ModalMode.EDIT;
  const modalTitle = isModeEdit ? t.modal.editTitle : t.modal.addTitle;
  const modalSubtitle = isModeEdit ? t.modal.editSubtitle : t.modal.addSubtitle;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="2xl"
      isFooterWithActions
      isDisabled={isLoading}
      isLoading={isLoading}
      onPress={onSubmit}
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t.form.name}
          placeholder={t.form.namePlaceholder}
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          isRequired
          variant="bordered"
        />

        <Select
          label={t.form.month}
          placeholder={t.form.monthPlaceholder}
          selectedKeys={formData.month ? [formData.month.toString()] : []}
          onChange={(e) => setFormData({...formData, month: parseInt(e.target.value, 10)})}
          isRequired
          variant="bordered"
        >
          {MONTH_OPTIONS.map((m) => (
            <SelectItem key={m.value.toString()}>{m.label}</SelectItem>
          ))}
        </Select>

        <Textarea
          label={t.form.description}
          placeholder={t.form.descriptionPlaceholder}
          value={formData.description || ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          minRows={3}
          maxRows={6}
          variant="bordered"
        />
      </div>
    </UnifiedModal>
  );
}
