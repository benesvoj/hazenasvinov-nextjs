'use client';

import {useState, useEffect} from 'react';

import {Select, SelectItem} from '@heroui/react';

import {getLineupCoachRoleOptions} from '@/enums/getLineupCoachRoleOptions';

import {UnifiedModal} from '@/components';
import {LineupCoachRole} from '@/enums';
import {LineupCoachFormData} from '@/types';
interface LineupCoachEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coach: LineupCoachFormData) => void;
  coach: LineupCoachFormData | null;
  coachIndex: number;
  coachName: string;
}

export default function LineupCoachEditModal({
  isOpen,
  onClose,
  onSave,
  coach,
  coachIndex,
  coachName,
}: LineupCoachEditModalProps) {
  const [formData, setFormData] = useState<LineupCoachFormData>({
    member_id: '',
    role: LineupCoachRole.ASSISTANT_COACH,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (coach) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ...coach,
      });
    }
  }, [coach]);

  const handleSave = () => {
    setIsLoading(true);
    onSave(formData);
    onClose();
    setIsLoading(false);
  };

  const updateField = (field: keyof LineupCoachFormData, value: any) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upravit trenéra: ${coachName}`}
      size="md"
      isFooterWithActions
      isLoading={isLoading}
      onPress={handleSave}
    >
      <div className="space-y-6">
        {/* Role Selection */}
        <Select
          label="Funkce"
          placeholder="Vyberte funkci"
          selectedKeys={formData.role ? [formData.role] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as string;
            updateField('role', selectedKey);
          }}
          isRequired
        >
          {getLineupCoachRoleOptions().map((role) => (
            <SelectItem key={role.value} textValue={role.label}>
              {role.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    </UnifiedModal>
  );
}
