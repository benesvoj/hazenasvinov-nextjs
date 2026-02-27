'use client';

import {useCategoryMap} from '@/components/shared/members/hooks/useCategoryMap';

import {translations} from '@/lib/translations/index';

import {
  getInternalMemberColumns,
  MemberTableTab,
  PageContainer,
  renderInternalMemberCell,
} from '@/components';
import {useAppData} from '@/contexts';
import {useFetchMembersInternal, useMemberModals} from '@/hooks';
import {MemberInternal} from '@/types';

export default function CoachesMembersPage() {
  const t = translations.members;
  const {
    categories: {data: categoriesData},
  } = useAppData();

  const {
    data: membersInternalData,
    refresh: refreshInternal,
    loading: membersInternalLoading,
  } = useFetchMembersInternal();

  const modals = useMemberModals<MemberInternal>();

  const openDeleteInternal = (member: MemberInternal) => {
    modals.deleteModal.openWith(member);
  };
  const openPaymentInternal = (member: MemberInternal) => {
    modals.paymentModal.openWith(member);
  };

  const columns = getInternalMemberColumns(t, {
    onPayment: openPaymentInternal,
    onDelete: openDeleteInternal,
    onEdit: modals.editModal.openWith,
  });

  const categories = useCategoryMap(categoriesData);

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
