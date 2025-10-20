import React, {useMemo} from 'react';

import {PaymentStatus} from '@/enums/membershipFeeStatus';

import {translations} from '@/lib/translations';

import {useAppData} from '@/contexts/AppDataContext';

import {renderMemberCell} from '@/app/admin/members/components/cells/MemberTableCells';

import {UnifiedTable} from '@/components';
import {ActionTypes, ColumnAlignType} from '@/enums';
import {usePaymentStatus} from '@/hooks';
import {Category, Member, MemberFilters, MemberWithPaymentStatus} from '@/types';

interface MembersListTabProps {
  categoriesData: Category[] | null;
  sexOptions: Record<string, string>;
  openEdit: (member: Member) => void;
  openDelete: (member: Member) => void;
  openDetail: (member: Member) => void;
  selectedMembers: Set<string>;
  setSelectedMembers: React.Dispatch<React.SetStateAction<Set<string>>>;
  searchTerm: string;
  filters: MemberFilters;
}

export default function MembersListTab({
  categoriesData,
  openEdit,
  openDelete,
  openDetail,
}: MembersListTabProps) {
  // Data context
  const {members, membersLoading} = useAppData();
  const {statusData} = usePaymentStatus();

  const t = translations.members;

  // Combine members with payment status
  const membersWithStatus = useMemo(() => {
    return members.map((member) => {
      const status = statusData.find((s) => s.member_id === member.id);

      // Convert string payment_status to PaymentStatus enum
      let paymentStatus = PaymentStatus.NOT_REQUIRED;
      if (status?.payment_status === 'paid') paymentStatus = PaymentStatus.PAID;
      else if (status?.payment_status === 'partial') paymentStatus = PaymentStatus.PARTIAL;
      else if (status?.payment_status === 'unpaid') paymentStatus = PaymentStatus.UNPAID;

      return {
        ...member,
        category_name: null,
        payment_status: paymentStatus,
        expected_fee_amount: status?.expected_fee_amount || 0,
        net_paid: status?.net_paid || 0,
        total_paid: status?.total_paid || 0,
        total_refunded: 0,
        last_payment_date: status?.last_payment_date || null,
        payment_count: status?.payment_count || 0,
        calendar_year: new Date().getFullYear(),
        currency: status?.currency || 'CZK',
      };
    });
  }, [members, statusData]);

  // Helper functions
  const categories = useMemo(() => {
    if (!categoriesData) return {};
    return categoriesData.reduce(
      (acc, category) => {
        acc[category.id] = category.name;
        return acc;
      },
      {} as Record<string, string>
    );
  }, [categoriesData]);

  const getMemberPaymentStatus = useMemo(() => {
    return (memberId: string) => {
      return statusData.find((s) => s.member_id === memberId);
    };
  }, [statusData]);

  // Table columns
  const tableColumns = [
    {key: 'status', label: t.table.columns.status, sortable: false},
    {
      key: 'registration_number',
      label: t.table.columns.registrationNumber,
      sortable: true,
    },
    {key: 'name', label: t.table.columns.name, sortable: true},
    {key: 'surname', label: t.table.columns.surname, sortable: true},
    {key: 'date_of_birth', label: t.table.columns.dateOfBirth, sortable: true},
    {key: 'category', label: t.table.columns.category, sortable: true},
    {key: 'sex', label: t.table.columns.gender, sortable: true},
    {key: 'membershipFee', label: t.table.columns.membershipFee, sortable: false},
    {key: 'functions', label: t.table.columns.functions, sortable: false},
    {
      key: 'actions',
      label: t.table.columns.actions,
      align: ColumnAlignType.CENTER,
      isActionColumn: true,
      actions: [
        {
          type: ActionTypes.READ,
          onPress: openDetail,
          title: t.table.buttons.openDetail,
        },
        {
          type: ActionTypes.UPDATE,
          onPress: openEdit,
          title: t.table.buttons.openEdit,
        },
        {
          type: ActionTypes.DELETE,
          onPress: openDelete,
          title: t.table.buttons.openDelete,
        },
      ],
    },
  ];

  // Render wrapper to pass to UnifiedTable
  const renderCells = (member: MemberWithPaymentStatus, columnKey: string) =>
    renderMemberCell({
      member,
      columnKey,
      categories,
      getMemberPaymentStatus,
    });

  return (
    <UnifiedTable
      columns={tableColumns}
      data={membersWithStatus}
      renderCell={renderCells}
      ariaLabel={t.table.ariaLabel}
      isLoading={membersLoading}
      emptyContent={t.table.noMembersFound}
      enablePagination
    />
  );
}
