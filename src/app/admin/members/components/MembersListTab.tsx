import React, {useMemo} from 'react';

import {
  Button,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import {PencilIcon, PlusIcon} from '@heroicons/react/24/outline';

import {PaymentStatus} from '@/enums/membershipFeeStatus';

import {translations} from '@/lib/translations';

import {useAppData} from '@/contexts/AppDataContext';

import BulkEditModal from '@/app/admin/members/components/BulkEditModal';
import {renderMemberCell} from '@/app/admin/members/components/cells/MemberTableCells';
import MemberDetailModal from '@/app/admin/members/components/MemberDetailModal';
import MemberFormModal from '@/app/admin/members/components/MemberFormModal';
import MembersCsvImport from '@/app/admin/members/components/MembersCsvImport';
import {MembersListFilters} from '@/app/admin/members/components/MembersListFilters';

import {DeleteConfirmationModal} from '@/components';
import {Genders} from '@/enums';
import {
  useBulkEditMembers,
  useMemberModals,
  useMembers,
  useMembersTable,
  usePaymentStatus,
} from '@/hooks';
import {Category, Member} from '@/types';

interface MembersListTabProps {
  categoriesData: Category[] | null;
  sexOptions: Record<string, string>;
}

export default function MembersListTab({categoriesData, sexOptions}: MembersListTabProps) {
  // Data context
  const {members, membersLoading, refreshMembers} = useAppData();
  const {statusData} = usePaymentStatus();

  // CRUD operations
  const {createMember, updateMember, deleteMember} = useMembers();

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

  // Table state and logic
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters,
    page,
    setPage,
    sortDescriptor,
    setSortDescriptor,
    paginatedMembers,
    totalPages,
  } = useMembersTable(membersWithStatus);

  // Modal state
  const {
    addModal,
    editModal,
    deleteModal,
    detailModal,
    bulkEditModal,
    openAdd,
    openEdit,
    openDelete,
    openDetail,
    openBulkEdit,
    selectedMember,
    selectedMembers,
    setSelectedMembers,
    formData,
    setFormData,
    bulkEditFormData,
    setBulkEditFormData,
  } = useMemberModals({
    onSuccess: refreshMembers,
  });

  // Bulk edit operation
  const {bulkEditMembers} = useBulkEditMembers({
    onSuccess: refreshMembers,
  });

  // Handlers
  const handleAddMember = async () => {
    await createMember(
      {
        name: formData.name,
        surname: formData.surname,
        registration_number: formData.registration_number,
        date_of_birth: formData.date_of_birth || undefined,
        sex: formData.sex,
        functions: formData.functions,
      },
      formData.category_id || undefined
    );

    addModal.onClose();
    await refreshMembers();
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    await updateMember({
      id: selectedMember.id,
      name: formData.name,
      surname: formData.surname,
      registration_number: formData.registration_number,
      date_of_birth: formData.date_of_birth,
      sex: formData.sex,
      functions: formData.functions,
      category_id: formData.category_id || undefined,
    });
    editModal.onClose();
    await refreshMembers();
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    await deleteMember(selectedMember.id);
    deleteModal.onClose();
    await refreshMembers();
  };

  const handleBulkEdit = async () => {
    const success = await bulkEditMembers(Array.from(selectedMembers), bulkEditFormData);

    if (success) {
      setSelectedMembers(new Set());
      setBulkEditFormData({sex: Genders.EMPTY, category: '', functions: []});
      bulkEditModal.onClose();
    }
  };

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
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Seznam členů</h2>
        <div className="flex gap-2">
          <Button
            color="secondary"
            variant="flat"
            onPress={openBulkEdit}
            isDisabled={selectedMembers.size === 0}
            startContent={<PencilIcon className="w-4 h-4" />}
          >
            Hromadná úprava ({selectedMembers.size})
          </Button>
          <MembersCsvImport
            onImportComplete={refreshMembers}
            categories={categories}
            sexOptions={sexOptions}
          />
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={openAdd}
            isDisabled={Object.keys(categories).length === 0}
          >
            Přidat člena
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <MembersListFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        categories={categoriesData || []}
      />

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
            searchTerm
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

      {/* Modals */}
      <MemberFormModal
        isOpen={addModal.isOpen}
        onClose={addModal.onClose}
        onSubmit={handleAddMember}
        title="Přidat nového člena"
        formData={formData}
        setFormData={setFormData}
        categories={categoriesData || []}
        sexOptions={sexOptions}
        submitButtonText="Přidat člena"
        isEditMode={false}
      />

      <MemberFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        onSubmit={handleUpdateMember}
        title="Upravit člena"
        formData={formData}
        setFormData={setFormData}
        categories={categoriesData || []}
        sexOptions={sexOptions}
        submitButtonText="Uložit změny"
        isEditMode={true}
      />

      <MemberDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        member={selectedMember}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleDeleteMember}
        title="Smazat člena"
        message={`Opravdu chcete smazat člena <strong>${selectedMember?.name} ${selectedMember?.surname}</strong> (Reg. číslo: ${selectedMember?.registration_number})? Tato akce je nevratná.`}
      />

      <BulkEditModal
        isOpen={bulkEditModal.isOpen}
        onClose={bulkEditModal.onClose}
        onSubmit={handleBulkEdit}
        selectedCount={selectedMembers.size}
        formData={bulkEditFormData}
        setFormData={setBulkEditFormData}
        categories={categoriesData || []}
        isLoading={membersLoading}
      />
    </div>
  );
}
