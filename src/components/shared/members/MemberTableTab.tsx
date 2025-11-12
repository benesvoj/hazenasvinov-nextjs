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

  // Pagination (server-side)
  pagination?: {
    page: number;
    total: number | null;
  };
  onPageChange?: (page: number) => void;

  // Actions (optional)
  onPayment?: (item: T) => void;
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
  pagination,
  onPageChange,
}: MemberTableTabProps<T>) => {
  const t = translations.members;

  // Calculate total pages from server pagination info
  const totalPages =
    pagination?.total && pagination.total > 0
      ? Math.ceil(pagination.total / 25) // Using default page size of 25
      : 1;

  return (
    <>
      <UnifiedTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        ariaLabel={ariaLabel}
        isLoading={loading}
        emptyContent={t.table.noMembersFound}
        enablePagination={!!pagination}
        page={pagination?.page}
        totalPages={totalPages}
        onPageChange={onPageChange}
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
