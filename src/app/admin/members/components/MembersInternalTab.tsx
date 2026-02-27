import React from 'react';

import {renderInternalMemberCell} from '@/components/shared/members/config/memberCellRenderers';
import {getInternalMemberColumns} from '@/components/shared/members/config/memberTableColumns';
import {useCategoryMap} from '@/components/shared/members/hooks/useCategoryMap';

import {translations} from '@/lib/translations/index';

import {MemberTableTab} from '@/components';
import {useFetchMembersInternal} from '@/hooks';
import {Category, MemberInternal, MemberTableFilters} from '@/types';

interface MembersListTabProps {
  categoriesData: Category[] | null;
  sexOptions: Record<string, string>;
  openPayment: (member: MemberInternal) => void;
  openDelete: (member: MemberInternal) => void;
  openDetail: (member: MemberInternal) => void;
  selectedMembers: Set<string>;
  setSelectedMembers: React.Dispatch<React.SetStateAction<Set<string>>>;
  searchTerm: string;
  filters: MemberTableFilters;
}

export const MembersInternalTab = ({
  categoriesData,
  openPayment,
  openDelete,
  openDetail,
  selectedMembers,
  setSelectedMembers,
  searchTerm,
  filters,
}: MembersListTabProps) => {
  const {data, loading, pagination, goToPage} = useFetchMembersInternal({
    search: searchTerm,
    filters: filters,
  });

  const t = translations.members;

  const categories = useCategoryMap(categoriesData);
  const columns = getInternalMemberColumns(t, {
    onPayment: openPayment,
    onDelete: openDelete,
    onEdit: openDetail,
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
      pagination={pagination}
      onPageChange={goToPage}
      ariaLabel={t.table.membersInternalAriaLabel}
    />
  );
};
