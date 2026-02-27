'use client';

import React, {useState} from 'react';

import {useModalWithItem} from '@/hooks/shared/useModals';

import {useCategoryMap} from '@/components/shared/members/hooks/useCategoryMap';
import {MembersInternalSection} from '@/components/shared/members/MembersInternalSection';
import {MemberModal, PaymentFormModal} from '@/components/shared/members/modals';

import {translations} from '@/lib/translations/index';

import {useAppData} from '@/contexts/AppDataContext';

import {MembersExternalTab, MembersOnLoanTab} from '@/app/admin/members/components';
import BulkEditModal from '@/app/admin/members/components/BulkEditModal';
import MembersCsvImport from '@/app/admin/members/components/MembersCsvImport';
import {MembersListFilters} from '@/app/admin/members/components/MembersListFilters';
import MembersStatisticTab from '@/app/admin/members/components/MembersStatisticTab';

import {AdminContainer, DeleteConfirmationModal} from '@/components';
import {ActionTypes, Genders} from '@/enums';
import {
  useBulkEditMembers,
  useFetchMembersExternal,
  useFetchMembersInternal,
  useFetchMembersOnLoan,
  useMemberModals,
  useMembers,
} from '@/hooks';
import {
  BaseMember,
  Member,
  MemberExternal,
  MemberInternal,
  MemberOnLoan,
  MemberTableFilters,
} from '@/types';
import {genderOptions} from '@/utils';

const FILTER_DEFAULTS = {
  sex: '',
  category_id: '',
  function: '',
};

const BULK_DEFAULTS = {
  sex: Genders.EMPTY,
  category: '',
  functions: [] as string[],
};

export default function MembersAdminPage() {
  const t = translations.members;

  const [activeTab, setActiveTab] = useState('members-internal');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [bulkEditFormData, setBulkEditFormData] = useState(BULK_DEFAULTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<MemberTableFilters>(FILTER_DEFAULTS);

  const {
    categories: {data: categoriesData},
  } = useAppData();
  const {
    data: membersInternalData,
    refresh: refreshInternal,
    loading: membersInternalLoading,
  } = useFetchMembersInternal();
  const {refresh: refreshExternal, loading: membersExternalLoading} = useFetchMembersExternal();
  const {refresh: refreshOnLoan, loading: membersOnLoanLoading} = useFetchMembersOnLoan();
  const {createMember, updateMember, deleteMember} = useMembers();
  const modals = useMemberModals<BaseMember>();
  const memberModal = useModalWithItem<Member>();
  const {bulkEditMembers} = useBulkEditMembers({
    onSuccess: refreshInternal,
  });

  const anyLoading = membersInternalLoading || membersExternalLoading || membersOnLoanLoading;
  const genderOpts = genderOptions;
  const shouldFetchInternal = activeTab === 'members-internal';
  const shouldFetchExternal = activeTab === 'members-external';
  const shouldFetchOnLoan = activeTab === 'members-on-loan';
  const categoriesMap = useCategoryMap(categoriesData);
  const defaultYear = new Date().getFullYear();

  const clearFilters = () => {
    setSearchTerm('');
    setFilters(FILTER_DEFAULTS);
  };

  const openPaymentInternal = (member: MemberInternal) =>
    modals.paymentModal.openWith(member as BaseMember);
  const openDeleteInternal = (member: MemberInternal) =>
    modals.deleteModal.openWith(member as BaseMember);

  const openEditExternal = (member: MemberExternal) =>
    memberModal.openWith(member as unknown as Member);
  const openDeleteExternal = (member: MemberExternal) =>
    modals.deleteModal.openWith(member as BaseMember);

  const openEditOnLoan = (member: MemberOnLoan) =>
    memberModal.openWith(member as unknown as Member);
  const openDeleteOnLoan = (member: MemberOnLoan) =>
    modals.deleteModal.openWith(member as BaseMember);

  const handleMemberSuccess = async (data: Member) => {
    if (memberModal.isEditMode) {
      await updateMember({
        id: memberModal.selectedItem!.id!,
        name: data.name,
        surname: data.surname,
        registration_number: data.registration_number ?? undefined,
        date_of_birth: data.date_of_birth ?? undefined,
        sex: data.sex ?? undefined,
        functions: data.functions ?? undefined,
        category_id: data.category_id ?? undefined,
        is_active: data.is_active ?? undefined,
      });
    } else {
      await createMember(
        {
          name: data.name,
          surname: data.surname,
          registration_number: data.registration_number ?? '',
          date_of_birth: data.date_of_birth ?? undefined,
          sex: data.sex ?? Genders.MALE,
          functions: data.functions ?? [],
        },
        data.category_id ?? undefined
      );
    }

    memberModal.closeAndClear();

    if (activeTab === 'members-internal') refreshInternal();
    else if (activeTab === 'members-external') refreshExternal();
    else if (activeTab === 'members-on-loan') refreshOnLoan();
  };

  const handleDeleteMember = async () => {
    if (!modals.deleteModal.selectedItem) return;
    await deleteMember(modals.deleteModal.selectedItem.id);
    modals.deleteModal.closeAndClear();

    if (activeTab === 'members-internal') refreshInternal();
    else if (activeTab === 'members-external') refreshExternal();
    else if (activeTab === 'members-on-loan') refreshOnLoan();
  };

  const handleBulkEdit = async () => {
    const success = await bulkEditMembers(Array.from(selectedMembers), bulkEditFormData);

    if (success) {
      setSelectedMembers(new Set());
      setBulkEditFormData(BULK_DEFAULTS);
      modals.bulkEditModal.onClose();
    }
  };

  return (
    <>
      <AdminContainer
        loading={anyLoading}
        tabs={[
          {
            key: 'members-internal',
            title: t.tabs.members,
            content: shouldFetchInternal ? (
              <MembersInternalSection
                categoriesData={categoriesData}
                ariaLabel={'members-internal-table'}
                searchTerm={searchTerm}
                filters={filters}
                onPayment={openPaymentInternal}
                onEdit={(member) => memberModal.openWith(member as unknown as Member)}
                onDelete={openDeleteInternal}
                enableSelection
                selectedItems={selectedMembers}
                onSelectionChange={(keys) => setSelectedMembers(keys as unknown as Set<string>)}
              />
            ) : null,
            filters: (
              <MembersListFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
                categories={categoriesData}
              />
            ),
            actions: [
              {
                label: t.buttons.bulkChange,
                buttonType: ActionTypes.BULK,
                color: 'secondary',
                variant: 'solid',
                isDisabled: selectedMembers.size === 0,
                onClick: () => modals.bulkEditModal.onOpen(),
              },
              {
                label: 'Import CSV',
                buttonType: ActionTypes.CREATE,
                color: 'secondary',
                variant: 'flat',
                onClick: () => {
                  // TODO: find better solution than use DOM elements
                  document.getElementById('csv-import-trigger')?.click();
                },
                priority: 'secondary',
              },
              {
                label: t.buttons.addMember,
                color: 'primary',
                variant: 'solid',
                buttonType: ActionTypes.CREATE,
                onClick: () => memberModal.openEmpty(),
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
              />
            ) : null,
          },
          {
            key: 'statistics',
            title: t.tabs.statistics,
            content: (
              <MembersStatisticTab members={membersInternalData} categoriesData={categoriesData} />
            ),
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {modals.paymentModal.isOpen && modals.paymentModal.selectedItem && (
        <PaymentFormModal
          key={modals.paymentModal.selectedItem?.id ?? 'payment-new'}
          isOpen={modals.paymentModal.isOpen}
          onClose={modals.paymentModal.onClose}
          member={modals.paymentModal.selectedItem}
          payment={null}
          defaultYear={defaultYear}
          onSuccess={refreshInternal}
        />
      )}

      <MemberModal
        key={memberModal.selectedItem?.id ?? 'new'}
        isOpen={memberModal.isOpen}
        onClose={memberModal.closeAndClear}
        member={memberModal.selectedItem}
        categories={categoriesData || []}
        onSuccess={handleMemberSuccess}
        showPaymentsTab={activeTab === 'members-internal'}
      />

      <DeleteConfirmationModal
        isOpen={modals.deleteModal.isOpen}
        onClose={modals.deleteModal.onClose}
        onConfirm={handleDeleteMember}
        title={t.modals.deleteMember}
        message={t.modals.deleteMemberMessage}
      />

      <BulkEditModal
        isOpen={modals.bulkEditModal.isOpen}
        onClose={modals.bulkEditModal.onClose}
        onSubmit={handleBulkEdit}
        selectedCount={selectedMembers.size}
        formData={bulkEditFormData}
        setFormData={setBulkEditFormData}
        categories={categoriesData || []}
        isLoading={anyLoading}
      />

      <div className="hidden">
        <MembersCsvImport
          onImportComplete={() => refreshInternal()}
          categories={categoriesMap}
          sexOptions={genderOpts}
        />
      </div>
    </>
  );
}
