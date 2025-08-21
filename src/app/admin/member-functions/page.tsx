"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { Checkbox } from "@heroui/checkbox";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { useFetchMemberFunctions } from "@/hooks/useFetchMemberFunctions";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { MemberFunction } from "@/types/types";

export default function MemberFunctionsAdminPage() {
  const [functions, setFunctions] = useState<MemberFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Fetch functions from database
  const { data: functionsData, loading: functionsLoading, error: functionsError, refetch } = useFetchMemberFunctions();
  
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
    name: "",
    display_name: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (functionsData) {
      setFunctions(functionsData);
    }
  }, [functionsData]);

  // Clear error and success messages
  const clearError = () => setError("");
  const clearSuccess = () => setSuccessMessage("");

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  // Open add modal
  const openAddModal = () => {
    clearError();
    clearSuccess();
    setFormData({
      name: "",
      display_name: "",
      description: "",
      sort_order: 0,
      is_active: true,
    });
    onAddFunctionOpen();
  };

  // Open edit modal
  const openEditModal = (functionItem: MemberFunction) => {
    clearError();
    clearSuccess();
    setSelectedFunction(functionItem);
    setFormData({
      name: functionItem.name,
      display_name: functionItem.display_name,
      description: functionItem.description || "",
      sort_order: functionItem.sort_order,
      is_active: functionItem.is_active,
    });
    onEditFunctionOpen();
  };

  // Open delete modal
  const openDeleteModal = (functionItem: MemberFunction) => {
    clearError();
    setSelectedFunction(functionItem);
    onDeleteFunctionOpen();
  };

  // Handle modal close
  const handleAddModalClose = () => {
    clearError();
    onAddFunctionClose();
  };

  const handleEditModalClose = () => {
    clearError();
    setSelectedFunction(null);
    onEditFunctionClose();
  };

  // Add new function
  const handleAddFunction = async () => {
    if (!formData.name || !formData.display_name) {
      setError("Název a zobrazovaný název jsou povinné");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/manage-member-functions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Chyba při přidávání funkce");
      }

      const newFunction = await response.json();
      setFunctions(prev => [...prev, newFunction]);
      handleAddModalClose();
      showSuccess("Funkce byla úspěšně přidána.");
      refetch(); // Refresh data
    } catch (error: any) {
      setError(error.message || "Chyba při přidávání funkce");
    } finally {
      setLoading(false);
    }
  };

  // Update function
  const handleUpdateFunction = async () => {
    if (!selectedFunction || !formData.name || !formData.display_name) {
      setError("Název a zobrazovaný název jsou povinné");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/manage-member-functions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedFunction.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Chyba při aktualizaci funkce");
      }

      const updatedFunction = await response.json();
      setFunctions(prev => 
        prev.map(f => f.id === selectedFunction.id ? updatedFunction : f)
      );
      handleEditModalClose();
      showSuccess("Funkce byla úspěšně aktualizována.");
      refetch(); // Refresh data
    } catch (error: any) {
      setError(error.message || "Chyba při aktualizaci funkce");
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
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Chyba při mazání funkce");
      }

      setFunctions(prev => prev.filter(f => f.id !== selectedFunction.id));
      onDeleteFunctionClose();
      setSelectedFunction(null);
      showSuccess("Funkce byla úspěšně smazána.");
      refetch(); // Refresh data
    } catch (error: any) {
      setError(error.message || "Chyba při mazání funkce");
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? "success" : "danger";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Správa funkcí členů</h1>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Functions Table */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CogIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Seznam funkcí</h2>
          </div>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={openAddModal}
          >
            Přidat funkci
          </Button>
        </CardHeader>
        <CardBody>
          <Table aria-label="Tabulka funkcí členů">
            <TableHeader>
              <TableColumn>NÁZEV</TableColumn>
              <TableColumn>ZOBRAZOVANÝ NÁZEV</TableColumn>
              <TableColumn>POPIS</TableColumn>
              <TableColumn>ŘAZENÍ</TableColumn>
              <TableColumn>STAV</TableColumn>
              <TableColumn>AKCE</TableColumn>
            </TableHeader>
            <TableBody
              items={functions}
              loadingContent={functionsLoading ? "Načítání..." : undefined}
              loadingState={functionsLoading ? "loading" : "idle"}
              emptyContent="Žádné funkce nebyly nalezeny"
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
                      {functionItem.is_active ? "Aktivní" : "Neaktivní"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<PencilIcon className="w-4 h-4" />}
                        onPress={() => openEditModal(functionItem)}
                      >
                        Upravit
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<TrashIcon className="w-4 h-4" />}
                        onPress={() => openDeleteModal(functionItem)}
                      >
                        Smazat
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add/Edit Function Modal */}
      {(isAddFunctionOpen || isEditFunctionOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {isAddFunctionOpen ? "Přidat novou funkci" : "Upravit funkci"}
            </h3>
            
            <div className="space-y-4">
              <Input
                label="Název (kód)"
                placeholder="např. player, coach"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                isRequired
              />
              
              <Input
                label="Zobrazovaný název"
                placeholder="např. Hráč, Trenér"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                isRequired
              />
              
              <Textarea
                label="Popis"
                placeholder="Popis funkce (volitelné)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
              
              <Input
                label="Řazení"
                type="number"
                placeholder="0"
                value={formData.sort_order.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              />
              
              <Checkbox
                isSelected={formData.is_active}
                onValueChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              >
                Aktivní
              </Checkbox>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                color="primary"
                onPress={isAddFunctionOpen ? handleAddFunction : handleUpdateFunction}
                isLoading={loading}
                className="flex-1"
              >
                {isAddFunctionOpen ? "Přidat" : "Uložit"}
              </Button>
              <Button
                variant="flat"
                onPress={isAddFunctionOpen ? handleAddModalClose : handleEditModalClose}
                className="flex-1"
              >
                Zrušit
              </Button>
            </div>
          </div>
        </div>
      )}

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
