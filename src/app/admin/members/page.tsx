'use client';
import React, {useMemo, useState} from 'react';

import {useAppData} from '@/contexts/AppDataContext';

import {
  MembersExternalTab,
  MembersInternalTab,
  MembersOnLoanTab,
} from '@/app/admin/members/components';
import BulkEditModal from '@/app/admin/members/components/BulkEditModal';
import MemberDetailModal from '@/app/admin/members/components/MemberDetailModal';
import MemberFormModal from '@/app/admin/members/components/MemberFormModal';
import MembersCsvImport from '@/app/admin/members/components/MembersCsvImport';
import {MembersListFilters} from '@/app/admin/members/components/MembersListFilters';
import MembersStatisticTab from '@/app/admin/members/components/MembersStatisticTab';
import PaymentFormModal from '@/app/admin/members/components/PaymentFormModal';

import {AdminContainer, DeleteConfirmationModal} from '@/components';
import {ActionTypes, Genders, getGenderOptions, ModalMode} from '@/enums';
import {
  useBulkEditMembers,
  useFetchMembersExternal,
  useFetchMembersInternal,
  useFetchMembersOnLoan,
  useMemberModals,
  useMembers,
} from '@/hooks';
import {translations} from '@/lib';
import {BaseMember, MemberExternal, MemberInternal, MemberOnLoan} from '@/types';

export default function MembersAdminPage() {
  const t = translations.members;

  const [activeTab, setActiveTab] = useState('members-internal');

  const shouldFetchInternal = activeTab === 'members-internal';
  const shouldFetchExternal = activeTab === 'members-external';
  const shouldFetchOnLoan = activeTab === 'members-on-loan';

  const genderOptions = getGenderOptions().reduce(
    (acc, {value, label}) => {
      acc[value] = label;
      return acc;
    },
    {} as Record<string, string>
  );

  // Use AppDataContext for members and category data
  const {categories} = useAppData();

  // Add hooks for all three tab types (for refresh functionality)
  const {
    data: membersInternalData,
    refresh: refreshInternal,
    loading: membersInternalLoading,
  } = useFetchMembersInternal();
  const {refresh: refreshExternal, loading: membersExternalLoading} = useFetchMembersExternal();
  const {refresh: refreshOnLoan, loading: membersOnLoanLoading} = useFetchMembersOnLoan();

  const anyLoading = membersInternalLoading || membersExternalLoading || membersOnLoanLoading;

  // CRUD operations
  const {createMember, updateMember, deleteMember} = useMembers();

  // Filter state for the members list
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filters, setFilters] = React.useState({
    sex: '',
    category_id: '',
    function: '',
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({sex: '', category_id: '', function: ''});
  };

  // Modal state
  const {
    addModal,
    paymentModal,
    editModal,
    deleteModal,
    detailModal,
    bulkEditModal,
    modalContext, // Get the context
    openAdd,
    openPayment,
    openEdit: openEditBase,
    openDelete: openDeleteBase,
    openDetail: openDetailBase,
    openBulkEdit,
    selectedMember,
    selectedMembers,
    setSelectedMembers,
    formData,
    setFormData,
    bulkEditFormData,
    setBulkEditFormData,
  } = useMemberModals<BaseMember>({
    onSuccess: () => {
      // Use context to refresh correct tab
      if (modalContext === 'internal') refreshInternal();
      else if (modalContext === 'external') refreshExternal();
      else if (modalContext === 'on_loan') refreshOnLoan();
    },
  });

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Context-aware wrappers for each tab
  const openPaymentInternal = (member: MemberInternal) => {
    openPayment(member as BaseMember, 'internal');
  };
  const openEditInternal = (member: MemberInternal) =>
    openEditBase(member as BaseMember, 'internal');
  const openDeleteInternal = (member: MemberInternal) => {
    openDeleteBase(member as BaseMember, 'internal');
  };
  const openDetailInternal = (member: MemberInternal) => {
    openDetailBase(member as BaseMember, 'internal');
  };

  const openEditExternal = (member: MemberExternal) =>
    openEditBase(member as BaseMember, 'external');
  const openDeleteExternal = (member: MemberExternal) => {
    openDeleteBase(member as BaseMember, 'external');
  };
  const openDetailExternal = (member: MemberExternal) => {
    openDetailBase(member as BaseMember, 'external');
  };

  const openEditOnLoan = (member: MemberOnLoan) => openEditBase(member as BaseMember, 'on_loan');
  const openDeleteOnLoan = (member: MemberOnLoan) => {
    openDeleteBase(member as BaseMember, 'on_loan');
  };
  const openDetailOnLoan = (member: MemberOnLoan) => {
    openDetailBase(member as BaseMember, 'on_loan');
  };

  // Bulk edit operation
  const {bulkEditMembers} = useBulkEditMembers({
    onSuccess: refreshInternal,
  });

  // Handlers
  const handleAddMember = async () => {
    // Extract only MemberFormData fields
    const memberFormData = {
      name: formData.name,
      surname: formData.surname,
      registration_number: formData.registration_number,
      date_of_birth: formData.date_of_birth || undefined,
      sex: formData.sex,
      functions: formData.functions,
    };

    await createMember(memberFormData, formData.category_id || undefined);

    addModal.onClose();

    refreshInternal();
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

    // Context determines which tab to refresh
    if (modalContext === 'internal') refreshInternal();
    else if (modalContext === 'external') refreshExternal();
    else if (modalContext === 'on_loan') refreshOnLoan();
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    await deleteMember(selectedMember.id);
    deleteModal.onClose();

    if (modalContext === 'internal') refreshInternal();
    else if (modalContext === 'external') refreshExternal();
    else if (modalContext === 'on_loan') refreshOnLoan();
  };

  const handleBulkEdit = async () => {
    const success = await bulkEditMembers(Array.from(selectedMembers), bulkEditFormData);

    if (success) {
      setSelectedMembers(new Set());
      setBulkEditFormData({sex: Genders.EMPTY, category: '', functions: []});
      bulkEditModal.onClose();
    }
  };

  const categoriesMap = useMemo(() => {
    if (!categories) return {};
    return categories.reduce(
      (acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      },
      {} as Record<string, string>
    );
  }, [categories]);

  return (
    <>
      <AdminContainer
        loading={anyLoading}
        tabs={[
          {
            key: 'members-internal',
            title: t.tabs.members,
            content: shouldFetchInternal ? (
              <MembersInternalTab
                categoriesData={categories}
                sexOptions={genderOptions}
                openPayment={openPaymentInternal}
                openEdit={openEditInternal}
                openDelete={openDeleteInternal}
                openDetail={openDetailInternal}
                selectedMembers={selectedMembers}
                setSelectedMembers={setSelectedMembers}
                searchTerm={searchTerm}
                filters={filters}
              />
            ) : null,
            filters: (
              <MembersListFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
                categories={categories}
              />
            ),
            actions: [
              {
                label: t.buttons.bulkChange,
                buttonType: ActionTypes.BULK,
                color: 'secondary',
                variant: 'solid',
                isDisabled: selectedMembers.size === 0,
                onClick: () => openBulkEdit(),
              },
              {
                label: 'Import CSV',
                buttonType: ActionTypes.CREATE,
                color: 'secondary',
                variant: 'flat',
                onClick: () => {
                  // This will be handled by the MembersCsvImport modal component
                  document.getElementById('csv-import-trigger')?.click();
                },
                priority: 'secondary',
              },
              {
                label: t.buttons.addMember,
                onClick: () => openAdd(),
                color: 'primary',
                variant: 'solid',
                buttonType: ActionTypes.CREATE,
              },
            ],
          },
          {
            key: 'members-on-loan',
            title: t.tabs.membersOnLoan,
            content: shouldFetchOnLoan ? (
              <MembersOnLoanTab
                categoriesData={categoriesMap}
                openEdit={openEditOnLoan}
                openDelete={openDeleteOnLoan}
                openDetail={openDetailOnLoan}
              />
            ) : null,
          },
          {
            key: 'members-external',
            title: t.tabs.membersExternal,
            content: shouldFetchExternal ? (
              <MembersExternalTab
                categoriesData={categoriesMap}
                openEdit={openEditExternal}
                openDelete={openDeleteExternal}
                openDetail={openDetailExternal}
              />
            ) : null,
          },
          {
            key: 'statistics',
            title: t.tabs.statistics,
            content: (
              <MembersStatisticTab members={membersInternalData} categoriesData={categories} />
            ),
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {selectedMember && (
        <PaymentFormModal
          isOpen={paymentModal.isOpen}
          onClose={paymentModal.onClose}
          member={selectedMember}
          payment={null}
          defaultYear={selectedYear}
          onSuccess={refreshInternal}
        />
      )}

      {/* Modals */}
      <MemberFormModal
        isOpen={addModal.isOpen}
        onClose={addModal.onClose}
        onSubmit={handleAddMember}
        formData={formData}
        setFormData={setFormData}
        categories={categories || []}
        sexOptions={genderOptions}
        isEditMode={false}
      />

      <MemberFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        onSubmit={handleUpdateMember}
        formData={formData}
        setFormData={setFormData}
        categories={categories || []}
        sexOptions={genderOptions}
        isEditMode={true}
      />

      <MemberDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        member={selectedMember}
        mode={ModalMode.EDIT}
        onSubmit={handleUpdateMember}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleDeleteMember}
        title={t.modals.deleteMember}
        message={t.modals.deleteMemberMessage}
      />

      <BulkEditModal
        isOpen={bulkEditModal.isOpen}
        onClose={bulkEditModal.onClose}
        onSubmit={handleBulkEdit}
        selectedCount={selectedMembers.size}
        formData={bulkEditFormData}
        setFormData={setBulkEditFormData}
        categories={categories || []}
        isLoading={anyLoading}
      />

      {/* CSV Import - Hidden trigger */}
      <div className="hidden">
        <MembersCsvImport
          onImportComplete={() => refreshInternal()}
          categories={
            categories?.reduce(
              (acc, cat) => {
                acc[cat.id] = cat.name;
                return acc;
              },
              {} as Record<string, string>
            ) || {}
          }
          sexOptions={genderOptions}
        />
      </div>
    </>
  );
}
