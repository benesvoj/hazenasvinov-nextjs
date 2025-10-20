'use client';

import {useMemo} from 'react';

import {
  getInternalMemberColumns,
  MemberTableTab,
  PageContainer,
  renderInternalMemberCell,
} from '@/components';
import {useAppData} from '@/contexts';
import {useFetchMembersInternal, useMemberModals} from '@/hooks';
import {translations} from '@/lib';
import {BaseMember, MemberInternal} from '@/types';

export default function CoachesMembersPage() {
  const t = translations.members;
  const {categories: categoriesData} = useAppData();

  const {
    data: membersInternalData,
    refresh: refreshInternal,
    loading: membersInternalLoading,
  } = useFetchMembersInternal();

  const {
    openEdit: openEditBase,
    openDelete: openDeleteBase,
    openDetail: openDetailBase,
  } = useMemberModals<BaseMember>({
    onSuccess: () => refreshInternal(),
  });

  // Context-aware wrappers for each tab
  const openEditInternal = (member: MemberInternal) =>
    openEditBase(member as BaseMember, 'internal');
  const openDeleteInternal = (member: MemberInternal) => {
    openDeleteBase(member as BaseMember, 'internal');
  };
  const openDetailInternal = (member: MemberInternal) => {
    openDetailBase(member as BaseMember, 'internal');
  };

  const columns = getInternalMemberColumns(t, {
    onEdit: openEditInternal,
    onDelete: openDeleteInternal,
    onDetail: openDetailInternal,
  });

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

  const renderCell = (member: MemberInternal, columnKey: string) =>
    renderInternalMemberCell(member, columnKey, categories);

  return (
    <PageContainer>
      <MemberTableTab<MemberInternal>
        data={membersInternalData}
        loading={membersInternalLoading}
        columns={columns}
        renderCell={renderCell}
        ariaLabel={t.table.ariaLabel}
      />
    </PageContainer>
  );
}
