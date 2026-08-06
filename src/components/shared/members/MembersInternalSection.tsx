'use client';

import {useEffect, useRef} from 'react';

import {translations} from '@/lib/translations';

import {MemberTableTab, renderInternalMemberCell} from '@/components';
import {useFetchMembersInternal} from '@/hooks';
import {Category, MemberInternal, MemberTableFilters} from '@/types';

import {getInternalMemberColumns} from './config/memberTableColumns';
import {useCategoryMap} from './hooks/useCategoryMap';

interface MembersInternalSectionProps {
  // Data context
  categoryId?: string | null; // filter by category (coach portal)
  categoriesData: Category[] | null;

  /** Increment to trigger a data refresh without remounting. */
  refreshTrigger?: number;

  // Search & filter (optional — coach portal may not expose all)
  searchTerm?: string;
  filters?: MemberTableFilters;

  // Actions (all optional — caller decides which are available)
  onPayment?: (member: MemberInternal) => void;
  onDelete?: (member: MemberInternal) => void;
  onEdit?: (member: MemberInternal) => void;
  /** Soft removal — deactivates an active member, reactivates a deactivated one. */
  onToggleActive?: (member: MemberInternal) => void;

  // Selection (admin-only feature)
  enableSelection?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;

  // Aria
  ariaLabel: string;

  pageSize?: number;
}

export const MembersInternalSection = ({
  categoryId,
  categoriesData,
  refreshTrigger,
  searchTerm,
  filters,
  onPayment,
  onDelete,
  onEdit,
  onToggleActive,
  enableSelection,
  selectedItems,
  onSelectionChange,
  ariaLabel,
  pageSize,
}: MembersInternalSectionProps) => {
  const {data, loading, pagination, goToPage, refresh} = useFetchMembersInternal({
    search: searchTerm,
    // `MemberTableFilters.gender` maps onto the `sex` column used by the query layer.
    filters: {
      sex: filters?.gender,
      category_id: categoryId ?? filters?.category_id,
      function: filters?.function,
      isActive: filters?.isActive,
    },
    limit: pageSize,
  });

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  useEffect(() => {
    if (refreshTrigger) refreshRef.current();
  }, [refreshTrigger]);

  const categories = useCategoryMap(categoriesData);
  const t = translations.members;

  const columns = getInternalMemberColumns(t, {
    onPayment,
    onDelete,
    onEdit,
    onToggleActive,
  });

  const renderCell = (member: MemberInternal, columnKey: string) =>
    renderInternalMemberCell(member, columnKey, categories);

  return (
    <MemberTableTab<MemberInternal>
      data={data}
      loading={loading}
      columns={columns}
      renderCell={renderCell}
      enableSelection={enableSelection}
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      pagination={pagination}
      onPageChange={goToPage}
      ariaLabel={ariaLabel}
      pageSize={pageSize}
    />
  );
};
