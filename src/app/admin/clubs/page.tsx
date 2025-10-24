'use client';

import React, {useCallback, useState} from 'react';

import {useRouter} from 'next/navigation';

import {Image, Input, useDisclosure} from '@heroui/react';

import {ClubFormModal} from '@/app/admin/clubs/components/ClubFormModal';

import {AdminContainer, DeleteConfirmationModal, UnifiedTable} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {useClubForm, useClubs, useFetchClubs} from '@/hooks';
import {translations} from '@/lib';
import {Club} from '@/types';

const tAction = translations.action;
const t = translations.admin.clubs;

export default function ClubsAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const {data, loading: fetchLoading, refetch} = useFetchClubs({searchTerm});
  const {
    createClub,
    updateClub,
    deleteClub,
    loading: crudLoading,
    setLoading: setCrudLoading,
  } = useClubs();
  const {
    formData,
    selectedClub,
    modalMode,
    setFormData,
    openAddMode,
    openEditMode,
    resetForm,
    validateForm,
  } = useClubForm();

  // Memoize search handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Modal states
  const {
    isOpen: isClubModalOpen,
    onOpen: onClubModalOpen,
    onClose: onClubModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteClubOpen,
    onOpen: onDeleteClubOpen,
    onClose: onDeleteClubClose,
  } = useDisclosure();

  const handleAddClick = () => {
    openAddMode();
    onClubModalOpen();
  };

  const handleEditClick = (club: Club) => {
    openEditMode(club);
    onClubModalOpen();
  };

  const handleDeleteClick = (club: Club) => {
    openEditMode(club);
    onDeleteClubOpen();
  };

  const handleConfirmDelete = async () => {
    if (selectedClub) {
      await deleteClub(selectedClub.id);
      await refetch();
      onDeleteClubClose();
      resetForm();
    }
  };

  const handleSubmit = async () => {
    const {valid, errors} = validateForm();

    if (!valid) {
      console.error('Validation errors', errors);
      return;
    }

    try {
      if (modalMode === ModalMode.EDIT && selectedClub) {
        await updateClub(selectedClub.id, formData);
        setCrudLoading(false);
      } else {
        await createClub(formData);
        setCrudLoading(false);
      }
      await refetch();
      onClubModalClose();
      resetForm();
      setCrudLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const openViewModal = (club: Club) => {
    router.push(`/admin/clubs/${club.id}`);
  };

  const filters = (
    <Input
      placeholder={t.filters.placeholder}
      value={searchTerm}
      onChange={handleSearchChange}
      className="max-w-md"
    />
  );

  const clubColumns = [
    {key: 'logo', label: t.table.logo},
    {key: 'name', label: t.table.name},
    {key: 'short_name', label: t.table.shortName},
    {key: 'city', label: t.table.city},
    {key: 'founded_year', label: t.table.foundedYear},
    {key: 'venue', label: t.table.venue},
    {
      key: 'actions',
      label: t.table.actions,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.READ, onPress: openViewModal, title: tAction.read},
        {type: ActionTypes.UPDATE, onPress: handleEditClick, title: tAction.edit},
        {type: ActionTypes.DELETE, onPress: handleDeleteClick, title: tAction.delete},
      ],
    },
  ];

  const renderClubCell = (club: Club, columnKey: string) => {
    switch (columnKey) {
      case 'logo':
        return club.logo_url ? (
          <Image src={club.logo_url} alt={club.name} width={48} height={48} />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500 text-xs">N/A</span>
          </div>
        );
      case 'name':
        return <span className="font-medium">{club.name}</span>;
      case 'short_name':
        return <span className="font-medium">{club.short_name}</span>;
      case 'city':
        return <span className="font-medium">{club.city}</span>;
      case 'founded_year':
        return <span className="font-medium">{club.founded_year}</span>;
      case 'venue':
        return <span className="font-medium">{club.venue}</span>;
    }
  };

  return (
    <>
      <AdminContainer
        actions={[
          {
            label: t.addClub,
            onClick: handleAddClick,
            variant: 'solid',
            buttonType: ActionTypes.CREATE,
          },
        ]}
        loading={fetchLoading}
        filters={filters}
      >
        <UnifiedTable
          isLoading={fetchLoading}
          columns={clubColumns}
          data={data}
          ariaLabel={t.title}
          renderCell={renderClubCell}
          getKey={(club: Club) => club.id}
          emptyContent={t.table.noClubs}
          isStriped
        />
      </AdminContainer>

      <ClubFormModal
        isOpen={isClubModalOpen}
        onClose={onClubModalClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={crudLoading}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteClubOpen}
        onClose={onDeleteClubClose}
        onConfirm={handleConfirmDelete}
        title={t.deleteClub}
        message={t.deleteClubMessage}
        isLoading={crudLoading}
      />
    </>
  );
}
