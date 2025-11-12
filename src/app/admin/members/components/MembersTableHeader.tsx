import React from 'react';

import {Button} from '@heroui/react';

import {PencilIcon, PlusIcon} from '@heroicons/react/24/outline';

import MembersCsvImport from '@/app/admin/members/components/MembersCsvImport';

interface MembersTableHeaderProps {
  selectedCount: number;
  onBulkEdit: () => void;
  onAddMember: () => void;
  onImportComplete: () => void;
  categories: Record<string, string>;
  sexOptions: Record<string, string>;
}

export const MembersTableHeader: React.FC<MembersTableHeaderProps> = ({
  selectedCount,
  onBulkEdit,
  onAddMember,
  onImportComplete,
  categories,
  sexOptions,
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Seznam členů</h2>
      <div className="flex gap-2">
        <Button
          color="secondary"
          variant="flat"
          onPress={onBulkEdit}
          isDisabled={selectedCount === 0}
          startContent={<PencilIcon className="w-4 h-4" />}
        >
          Hromadná úprava ({selectedCount})
        </Button>
        <MembersCsvImport
          onImportComplete={onImportComplete}
          categories={categories}
          sexOptions={sexOptions}
        />
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={onAddMember}
          isDisabled={Object.keys(categories).length === 0}
        >
          Přidat člena
        </Button>
      </div>
    </div>
  );
};
