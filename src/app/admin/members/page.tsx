'use client';
import React from 'react';

import {useAppData} from '@/contexts/AppDataContext';

import BulkEditModal from '@/app/admin/members/components/BulkEditModal';
import MemberDetailModal from '@/app/admin/members/components/MemberDetailModal';
import MemberFormModal from '@/app/admin/members/components/MemberFormModal';
import {MembersListFilters} from '@/app/admin/members/components/MembersListFilters';
import MembersStatisticTab from '@/app/admin/members/components/MembersStatisticTab';

import {AdminContainer, DeleteConfirmationModal} from '@/components';
import {ActionTypes, Genders, getGenderOptions} from '@/enums';
import {useBulkEditMembers, useMemberModals, useMembers} from '@/hooks';
import {translations} from '@/lib';

import MembersListTab from './components/MembersListTab';

export default function MembersAdminPage() {
  const t = translations.members;

  const [activeTab, setActiveTab] = React.useState<string>('members');

  const genderOptions = getGenderOptions().reduce(
    (acc, {value, label}) => {
      acc[value] = label;
      return acc;
    },
    {} as Record<string, string>
  );

  // Use AppDataContext for members and category data
  const {members, membersLoading, refreshMembers, categories} = useAppData();

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

  return (
    <>
      <AdminContainer
        loading={membersLoading}
        tabs={[
          {
            key: 'members',
            title: t.tabs.members,
            content: (
              <MembersListTab
                categoriesData={categories}
                sexOptions={genderOptions}
                openEdit={openEdit}
                openDelete={openDelete}
                openDetail={openDetail}
                selectedMembers={selectedMembers}
                setSelectedMembers={setSelectedMembers}
                searchTerm={searchTerm}
                filters={filters}
              />
            ),
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
                label: t.buttons.addMember,
                onClick: () => openAdd(),
                color: 'primary',
                variant: 'solid',
                buttonType: ActionTypes.CREATE,
              },
            ],
          },
          {
            key: 'statistics',
            title: t.tabs.statistics,
            content: <MembersStatisticTab members={members} categoriesData={categories} />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Modals */}
      <MemberFormModal
        isOpen={addModal.isOpen}
        onClose={addModal.onClose}
        onSubmit={handleAddMember}
        title={t.modals.addMember}
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
        title={t.modals.editMember}
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
        isLoading={membersLoading}
      />
    </>
  );
}
