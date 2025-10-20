import React, {useMemo} from 'react';

import {renderInternalMemberCell} from '@/components/shared/members/config/memberCellRenderers';
import {getInternalMemberColumns} from '@/components/shared/members/config/memberTableColumns';

import {translations} from '@/lib/translations';

import {MemberTableTab} from '@/components';
import {useFetchMembersInternal} from '@/hooks';
import {Category, MemberFilters, MemberInternal} from '@/types';

interface MembersListTabProps {
  categoriesData: Category[] | null;
  sexOptions: Record<string, string>;
  openEdit: (member: MemberInternal) => void;
  openDelete: (member: MemberInternal) => void;
  openDetail: (member: MemberInternal) => void;
  selectedMembers: Set<string>;
  setSelectedMembers: React.Dispatch<React.SetStateAction<Set<string>>>;
  searchTerm: string;
  filters: MemberFilters;
}

export const MembersInternalTab = ({
  categoriesData,
  openEdit,
  openDelete,
  openDetail,
  selectedMembers,
  setSelectedMembers,
}: MembersListTabProps) => {
  const {data, loading} = useFetchMembersInternal();

  const t = translations.members;

  const categories = useMemo(() => {
    if (!categoriesData) return {};
    // Convert if it's an array, otherwise use as-is
    if (Array.isArray(categoriesData)) {
      return categoriesData.reduce(
        (acc, category) => {
          acc[category.id] = category.name;
          return acc;
        },
        {} as Record<string, string>
      );
    }
    return categoriesData;
  }, [categoriesData]);

  const columns = getInternalMemberColumns(t, {
    onEdit: openEdit,
    onDelete: openDelete,
    onDetail: openDetail,
  });

  const renderCell = (member: MemberInternal, columnKey: string) =>
    renderInternalMemberCell(member, columnKey, categories);

  return (
    <MemberTableTab<MemberInternal>
      data={data}
      loading={loading}
      columns={columns}
      renderCell={renderCell}
      enableSelection={true}
      selectedItems={selectedMembers}
      onSelectionChange={setSelectedMembers as any}
      ariaLabel={t.table.membersInternalAriaLabel}
    />
  );
};
