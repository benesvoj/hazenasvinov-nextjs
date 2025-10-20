import React, {useMemo, useState} from 'react';

import {
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import {PaymentStatus} from '@/enums/membershipFeeStatus';

import {translations} from '@/lib/translations';

import {useAppData} from '@/contexts/AppDataContext';

import {renderMemberCell} from '@/app/admin/members/components/cells/MemberTableCells';

import {Genders, MemberFunction} from '@/enums';
import {useDebounce, usePaymentStatus} from '@/hooks';
import {Category, Member, MemberFilters, MemberSortDescriptor} from '@/types';

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
  selectedMembers,
  setSelectedMembers,
  searchTerm: externalSearchTerm,
  filters: externalFilters,
}: MembersListTabProps) {
  // Data context
  const {members, membersLoading, refreshMembers} = useAppData();
  const {statusData} = usePaymentStatus();

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

  // Pagination and sorting state
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<MemberSortDescriptor>({
    column: 'surname',
    direction: 'ascending',
  });

  const ROWS_PER_PAGE = 10;
  const debouncedSearchTerm = useDebounce(externalSearchTerm, 300);

  // Filtered members
  const filteredMembers = useMemo(() => {
    let filtered = membersWithStatus;

    // Search filter
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(term) ||
          member.surname.toLowerCase().includes(term) ||
          (member.registration_number && member.registration_number.toLowerCase().includes(term))
      );
    }

    // Sex filter
    if (externalFilters.sex && externalFilters.sex !== Genders.EMPTY) {
      filtered = filtered.filter((member) => member.sex === externalFilters.sex);
    }

    // Category filter
    if (externalFilters.category_id) {
      filtered = filtered.filter((member) => member.category_id === externalFilters.category_id);
    }

    // Function filter
    if (externalFilters.function) {
      filtered = filtered.filter(
        (member) =>
          member.functions && member.functions.includes(externalFilters.function as MemberFunction)
      );
    }

    return filtered;
  }, [membersWithStatus, debouncedSearchTerm, externalFilters]);

  // Sorted members
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof typeof a];
      const second = b[sortDescriptor.column as keyof typeof b];

      if (first === null || second === null) return 0;

      if (typeof first === 'string' && typeof second === 'string') {
        return sortDescriptor.direction === 'ascending'
          ? first.localeCompare(second)
          : second.localeCompare(first);
      }

      if (typeof first === 'number' && typeof second === 'number') {
        return sortDescriptor.direction === 'ascending' ? first - second : second - first;
      }

      // Special handling for registration numbers
      if (sortDescriptor.column === 'registration_number') {
        const extractNumber = (str: string) => {
          const match = str.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        const numA = extractNumber(first as string);
        const numB = extractNumber(second as string);
        return sortDescriptor.direction === 'ascending' ? numA - numB : numB - numA;
      }

      return 0;
    });
  }, [filteredMembers, sortDescriptor]);

  // Paginated members
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return sortedMembers.slice(start, end);
  }, [sortedMembers, page]);

  const totalPages = Math.ceil(filteredMembers.length / ROWS_PER_PAGE);

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

  const renderCell = (member: Member, columnKey: string) => {
    return renderMemberCell({
      member,
      columnKey,
      categories,
      getMemberPaymentStatus,
      onView: openDetail,
      onEdit: openEdit,
      onDelete: openDelete,
    });
  };

  const handleSortChange = (descriptor: any) => {
    setSortDescriptor({
      column: String(descriptor.column),
      direction: descriptor.direction,
    });
  };

  // Table columns
  const columns = [
    {key: 'status', label: translations.members.membersTable.status, sortable: false},
    {
      key: 'registration_number',
      label: translations.members.membersTable.registrationNumber,
      sortable: true,
    },
    {key: 'name', label: translations.members.membersTable.name, sortable: true},
    {key: 'surname', label: translations.members.membersTable.surname, sortable: true},
    {key: 'date_of_birth', label: translations.members.membersTable.dateOfBirth, sortable: true},
    {key: 'category', label: translations.members.membersTable.category, sortable: true},
    {key: 'sex', label: translations.members.membersTable.sex, sortable: true},
    {key: 'membershipFee', label: translations.members.membersTable.membershipFee, sortable: false},
    {key: 'functions', label: translations.members.membersTable.functions, sortable: false},
    {key: 'actions', label: translations.members.membersTable.actions, sortable: false},
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Members Table */}
      <Table
        key={`table-${statusData.length}`}
        aria-label="Tabulka členů"
        selectionMode="multiple"
        selectedKeys={selectedMembers}
        onSelectionChange={(keys) => {
          if (typeof keys === 'string') {
            setSelectedMembers(new Set([keys]));
          } else {
            setSelectedMembers(new Set(Array.from(keys).map((key) => String(key))));
          }
        }}
        sortDescriptor={sortDescriptor}
        onSortChange={handleSortChange}
        classNames={{wrapper: 'min-h-[400px]'}}
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              aria-label="Pagination controls"
              isCompact
              showControls
              showShadow
              color="secondary"
              page={page}
              total={totalPages}
              onChange={setPage}
            />
          </div>
        }
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              allowsSorting={column.sortable}
              align={column.key === 'actions' ? 'center' : 'start'}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={paginatedMembers}
          loadingContent={membersLoading ? translations.loading : 'Načítání dat...'}
          loadingState={membersLoading ? 'loading' : 'idle'}
          emptyContent={
            externalSearchTerm
              ? 'Žádní členové nebyli nalezeni pro zadaný vyhledávací termín.'
              : 'Žádní členové nebyli nalezeni.'
          }
        >
          {(member) => (
            <TableRow key={member.id}>
              {(columnKey) => <TableCell>{renderCell(member, columnKey as string)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
