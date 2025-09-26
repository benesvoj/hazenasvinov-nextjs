'use client';

import React, {useState, useEffect} from 'react';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {Button} from '@heroui/button';
import {useDisclosure} from '@heroui/modal';
import {Badge} from '@heroui/badge';
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from '@heroui/table';
import {PlusIcon, PencilIcon, TrashIcon, CogIcon} from '@heroicons/react/24/outline';
import {useFetchMemberFunctions} from '@/hooks/entities/member/useFetchMemberFunctions';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import {MemberFunction} from '@/types';
import FunctionFormModal from './components/FunctionFormModal';
import {showToast} from '@/components/Toast';
import {translations} from '@/lib/translations';

export default function MemberFunctionsAdminPage() {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{translations.memberFunctions.title}</h1>
      </div>

      {/* Functions Table */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CogIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">{translations.memberFunctions.list}</h2>
          </div>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={openAddModal}
          >
            {translations.button.add}
          </Button>
        </CardHeader>
        <CardBody>
          <Table aria-label={translations.memberFunctions.table.ariaLabel}>
            <TableHeader>
              <TableColumn>{translations.memberFunctions.table.header.name}</TableColumn>
              <TableColumn>{translations.memberFunctions.table.header.displayName}</TableColumn>
              <TableColumn>{translations.memberFunctions.table.header.description}</TableColumn>
              <TableColumn>{translations.memberFunctions.table.header.sorting}</TableColumn>
              <TableColumn>{translations.memberFunctions.table.header.status}</TableColumn>
              <TableColumn>{translations.memberFunctions.table.header.actions}</TableColumn>
            </TableHeader>
            <TableBody
              items={functions}
              loadingContent={functionsLoading ? translations.loading : undefined}
              loadingState={functionsLoading ? 'loading' : 'idle'}
              emptyContent={translations.table.emptyContent}
            >
              {(functionItem) => (
                <TableRow key={functionItem.id}>
                  <TableCell className="font-medium">{functionItem.name}</TableCell>
                  <TableCell>{functionItem.display_name}</TableCell>
                  <TableCell>
                    {functionItem.description ? (
                      <span className="text-gray-600">{functionItem.description}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{functionItem.sort_order}</TableCell>
                  <TableCell>
                    <Badge color={getStatusBadgeColor(functionItem.is_active)}>
                      {functionItem.is_active ? 'Aktivní' : 'Neaktivní'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        startContent={<PencilIcon className="w-4 h-4" />}
                        onPress={() => openEditModal(functionItem)}
                      />
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        startContent={<TrashIcon className="w-4 h-4" />}
                        onPress={() => openDeleteModal(functionItem)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

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
    </div>
  );
}
