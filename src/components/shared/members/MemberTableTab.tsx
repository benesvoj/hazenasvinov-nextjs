/**
 * Generic member table component
 * Handles internal, external, and on-loan members
 */
import React from 'react';

import {UnifiedTable} from '@/components';
import {translations} from '@/lib';
import {ColumnType} from '@/types';

interface MemberTableTabProps<T> {
  // Data
  data: T[];
  loading: boolean;

  // Table Configuration
  columns: ColumnType<T>[];
  renderCell: (item: T, columnKey: string) => React.ReactNode;
  ariaLabel: string;

  // Optional features
  enableSelection?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (keys: Selection) => void;

  // Actions (optional)
  openEdit?: (item: T) => void;
  openDelete?: (item: T) => void;
  openDetail?: (item: T) => void;
}

export const MemberTableTab = <T,>({
  data,
  loading,
  columns,
  renderCell,
  ariaLabel,
  enableSelection = false,
  selectedItems,
  onSelectionChange,
}: MemberTableTabProps<T>) => {
  const t = translations.members;

  return (
    <>
      <UnifiedTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        ariaLabel={ariaLabel}
        isLoading={loading}
        emptyContent={t.table.noMembersFound}
        enablePagination
        selectionMode={enableSelection ? 'multiple' : 'none'}
        selectedKeys={selectedItems}
        onSelectionChange={
          onSelectionChange
            ? (keys) => {
                if (keys === 'all') {
                  // Handle 'all' selection - convert to Set of all IDs
                  const allIds = new Set(data.map((item) => (item as any).id));
                  onSelectionChange(allIds as any as Selection);
                } else {
                  onSelectionChange(keys as unknown as Selection);
                }
              }
            : undefined
        }
      />
    </>
  );
};
