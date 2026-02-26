'use client';

import React, {useCallback, useState} from 'react';

import {useRouter} from 'next/navigation';

import {Image, Input} from '@heroui/react';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations/index';

import {ClubFormModal} from '@/app/admin/clubs/components/ClubFormModal';

import {AdminContainer, DeleteConfirmationModal, UnifiedTable} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {useClubFiltering, useClubForm, useClubs, useFetchClubs} from '@/hooks';
import {APP_ROUTES} from '@/lib';
import {Club} from '@/types';

export default function ClubsAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const {data: clubs, loading: fetchLoading, refetch} = useFetchClubs();
  const {data} = useClubFiltering(clubs, {searchTerm});
  const {
    createClub,
    updateClub,
    deleteClub,
    loading: crudLoading,
    setLoading: setCrudLoading,
  } = useClubs();
  const {
    selectedItem: selectedClub,
    formData,
    setFormData,
    openAddMode,
    openEditMode,
    resetForm,
    validateForm,
    modalMode,
  } = useClubForm();

  // Memoize search handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Modal states
  const modal = useModal();
  const deleteModal = useModalWithItem<Club>();

  const handleAddClick = () => {
    openAddMode();
    modal.onOpen();
  };

  const handleEditClick = (club: Club) => {
    openEditMode(club);
    modal.onOpen();
  };

  const handleDeleteClick = (club: Club) => {
    deleteModal.openWith(club);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.selectedItem) return;

    const success = await deleteClub(deleteModal.selectedItem.id);

    if (success) {
      await refetch();
      deleteModal.closeAndClear();
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
      modal.onClose();
      resetForm();
      setCrudLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const openViewModal = (club: Club) => {
    router.push(APP_ROUTES.admin.club(club.id));
  };

  const filters = (
    <Input
      placeholder={translations.clubs.filters.placeholder}
      value={searchTerm}
      onChange={handleSearchChange}
      className="max-w-md"
    />
  );

  const clubColumns = [
    {key: 'logo', label: translations.clubs.table.logo},
    {key: 'name', label: translations.clubs.table.name},
    {key: 'short_name', label: translations.clubs.table.shortName},
    {key: 'city', label: translations.clubs.table.city},
    {key: 'founded_year', label: translations.clubs.table.foundedYear},
    {key: 'venue', label: translations.clubs.table.venue},
    {
      key: 'actions',
      label: translations.common.table.columns.actions,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.READ, onPress: openViewModal, title: translations.common.actions.read},
        {
          type: ActionTypes.UPDATE,
          onPress: handleEditClick,
          title: translations.common.actions.edit,
        },
        {
          type: ActionTypes.DELETE,
          onPress: handleDeleteClick,
          title: translations.common.actions.delete,
        },
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
            label: translations.clubs.addClub,
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
          ariaLabel={translations.clubs.title}
          renderCell={renderClubCell}
          getKey={(club: Club) => club.id}
          emptyContent={translations.clubs.table.noClubs}
          isStriped
        />
      </AdminContainer>

      <ClubFormModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={crudLoading}
        mode={modalMode}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleConfirmDelete}
        title={translations.clubs.deleteClub}
        message={translations.clubs.deleteClubMessage}
        isLoading={crudLoading}
      />
    </>
  );
}
