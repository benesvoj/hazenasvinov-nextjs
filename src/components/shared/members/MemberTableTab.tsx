/**
 * Generic member table component
 * Handles internal, external, and on-loan members
 */
import React from 'react';

import {translations} from '@/lib/translations/index';

import {UnifiedTable} from '@/components';
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
  onSelectionChange?: (keys: Set<string>) => void;

  // Pagination (server-side)
  pagination?: {
    page: number;
    total: number | null;
  };
  onPageChange?: (page: number) => void;
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
                  onSelectionChange(allIds);
                } else {
                  onSelectionChange(keys as Set<string>);
                }
              }
            : undefined
        }
      />
    </>
  );
};
