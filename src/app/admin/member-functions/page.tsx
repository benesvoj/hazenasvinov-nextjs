'use client';

import React, {useState, useEffect} from 'react';

import {useDisclosure} from '@heroui/react';

import {translations} from '@/lib/translations';

import {AdminContainer, DeleteConfirmationModal, showToast, UnifiedTable} from '@/components';
import {ActionTypes, ColumnAlignType} from '@/enums';
import {useFetchMemberFunctions} from '@/hooks';
import {MemberFunction} from '@/types';

import FunctionFormModal from './components/FunctionFormModal';

export default function MemberFunctionsAdminPage() {
  const tAction = translations.action;

  const [functions, setFunctions] = useState<MemberFunction[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch functions from database
  const {
    data: functionsData,
    loading: functionsLoading,
    error: functionsError,
    refetch,
  } = useFetchMemberFunctions();

  // Modal states
  const {
    isOpen: isAddFunctionOpen,
    onOpen: onAddFunctionOpen,
    onClose: onAddFunctionClose,
  } = useDisclosure();
  const {
    isOpen: isEditFunctionOpen,
    onOpen: onEditFunctionOpen,
    onClose: onEditFunctionClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteFunctionOpen,
    onOpen: onDeleteFunctionOpen,
    onClose: onDeleteFunctionClose,
  } = useDisclosure();

  const [selectedFunction, setSelectedFunction] = useState<MemberFunction | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (functionsData) {
      setFunctions(functionsData);
    }
  }, [functionsData]);

  // Show success message
  const showSuccess = (message: string) => {
    showToast.success(message);
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      sort_order: 0,
      is_active: true,
    });
    onAddFunctionOpen();
  };

  // Open edit modal
  const openEditModal = (functionItem: MemberFunction) => {
    setSelectedFunction(functionItem);
    setFormData({
      name: functionItem.name,
      display_name: functionItem.display_name,
      description: functionItem.description || '',
      sort_order: functionItem.sort_order,
      is_active: functionItem.is_active,
    });
    onEditFunctionOpen();
  };

  // Open delete modal
  const openDeleteModal = (functionItem: MemberFunction) => {
    setSelectedFunction(functionItem);
    onDeleteFunctionOpen();
  };

  // Handle modal close
  const handleAddModalClose = () => {
    onAddFunctionClose();
  };

  const handleEditModalClose = () => {
    setSelectedFunction(null);
    onEditFunctionClose();
  };

  // Add new function
  const handleAddFunction = async (data?: Partial<MemberFunction>) => {
    const functionData = data || formData;
    if (!functionData.name || !functionData.display_name) {
      showToast.danger('Název a zobrazovaný název jsou povinné');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/manage-member-functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(functionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba při přidávání funkce');
      }

      const newFunction = await response.json();
      setFunctions((prev) => [...prev, newFunction]);
      handleAddModalClose();
      showSuccess('Funkce byla úspěšně přidána.');
      refetch(); // Refresh data
    } catch (error: any) {
      showToast.danger(error.message || 'Chyba při přidávání funkce');
    } finally {
      setLoading(false);
    }
  };

  // Update function
  const handleUpdateFunction = async (data?: Partial<MemberFunction>) => {
    const functionData = data || formData;
    if (!selectedFunction || !functionData.name || !functionData.display_name) {
      showToast.danger('Název a zobrazovaný název jsou povinné');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/manage-member-functions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedFunction.id,
          ...functionData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba při aktualizaci funkce');
      }

      const updatedFunction = await response.json();
      setFunctions((prev) => prev.map((f) => (f.id === selectedFunction.id ? updatedFunction : f)));
      handleEditModalClose();
      showSuccess('Funkce byla úspěšně aktualizována.');
      refetch(); // Refresh data
    } catch (error: any) {
      showToast.danger(error.message || 'Chyba při aktualizaci funkce');
    } finally {
      setLoading(false);
    }
  };

  // Delete function
  const handleDeleteFunction = async () => {
    if (!selectedFunction) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/manage-member-functions?id=${selectedFunction.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba při mazání funkce');
      }

      setFunctions((prev) => prev.filter((f) => f.id !== selectedFunction.id));
      onDeleteFunctionClose();
      setSelectedFunction(null);
      showSuccess('Funkce byla úspěšně smazána.');
      refetch(); // Refresh data
    } catch (error: any) {
      showToast.danger(error.message || 'Chyba při mazání funkce');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'success' : 'danger';
  };

  const functionColumns = [
    {key: 'name', label: translations.memberFunctions.table.header.name},
    {key: 'display_name', label: translations.memberFunctions.table.header.displayName},
    {key: 'description', label: translations.memberFunctions.table.header.description},
    {key: 'sort_order', label: translations.memberFunctions.table.header.sorting},
    {key: 'is_active', label: translations.memberFunctions.table.header.status},
    {
      key: 'actions',
      label: translations.memberFunctions.table.header.actions,
      align: ColumnAlignType.CENTER,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.UPDATE, onPress: openEditModal, title: tAction.edit},
        {type: ActionTypes.DELETE, onPress: openDeleteModal, title: tAction.delete},
      ],
    },
  ];

  const renderFunctionCell = (functionItem: MemberFunction, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return <span className="font-medium">{functionItem.name}</span>;
      case 'display_name':
        return <span className="font-medium">{functionItem.display_name}</span>;
      case 'description':
        return <span className="font-medium">{functionItem.description || '-'}</span>;
      case 'sort_order':
        return <span className="font-medium">{functionItem.sort_order}</span>;
      case 'is_active':
        return (
          <span className="font-medium">{functionItem.is_active ? 'Aktivní' : 'Neaktivní'}</span>
        );
    }
    return null;
  };

  return (
    <>
      <AdminContainer
        loading={functionsLoading}
        actions={[
          {
            label: tAction.add,
            onClick: openAddModal,
            variant: 'solid',
            buttonType: ActionTypes.CREATE,
          },
        ]}
      >
        <UnifiedTable
          isLoading={functionsLoading}
          columns={functionColumns}
          data={functions}
          ariaLabel={translations.memberFunctions.table.ariaLabel}
          renderCell={renderFunctionCell}
          getKey={(functionItem: MemberFunction) => functionItem.id}
          emptyContent={translations.table.emptyContent}
          isStriped
        />
      </AdminContainer>

      {/* Add Function Modal */}
      <FunctionFormModal
        key="add-function-modal"
        isOpen={isAddFunctionOpen}
        isEdit={false}
        onClose={onAddFunctionClose}
        onSubmit={handleAddFunction}
        loading={loading}
        initialData={undefined}
      />

      {/* Edit Function Modal */}
      <FunctionFormModal
        key="edit-function-modal"
        isOpen={isEditFunctionOpen}
        isEdit={true}
        onClose={onEditFunctionClose}
        onSubmit={handleUpdateFunction}
        loading={loading}
        initialData={selectedFunction || undefined}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteFunctionOpen}
        onClose={onDeleteFunctionClose}
        onConfirm={handleDeleteFunction}
        title="Smazat funkci"
        message={`Opravdu chcete smazat funkci "${selectedFunction?.display_name}"?`}
      />
    </>
  );
}
