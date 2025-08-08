'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { 
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";

interface Committee {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function CommitteesAdminPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isAddCommitteeOpen, onOpen: onAddCommitteeOpen, onClose: onAddCommitteeClose } = useDisclosure();
  const { isOpen: isEditCommitteeOpen, onOpen: onEditCommitteeOpen, onClose: onEditCommitteeClose } = useDisclosure();
  const { isOpen: isDeleteCommitteeOpen, onOpen: onDeleteCommitteeOpen, onClose: onDeleteCommitteeClose } = useDisclosure();
  
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
    sort_order: 0
  });

  const supabase = createClient();

  // Fetch committees
  const fetchCommittees = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('committees')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCommittees(data || []);
    } catch (error) {
      setError('Chyba při načítání komisí');
      console.error('Error fetching committees:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCommittees();
  }, [fetchCommittees]);

  // Add new committee
  const handleAddCommittee = async () => {
    try {
      const { error } = await supabase
        .from('committees')
        .insert({
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        });

      if (error) throw error;
      
      handleCloseAddCommittee();
      fetchCommittees();
    } catch (error) {
      setError('Chyba při přidávání komise');
      console.error('Error adding committee:', error);
    }
  };

  // Update committee
  const handleUpdateCommittee = async () => {
    if (!selectedCommittee) return;

    try {
      const { error } = await supabase
        .from('committees')
        .update({
          name: formData.name,
          description: formData.description || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        })
        .eq('id', selectedCommittee.id);

      if (error) throw error;
      
      handleCloseEditCommittee();
      fetchCommittees();
    } catch (error) {
      setError('Chyba při aktualizaci komise');
      console.error('Error updating committee:', error);
    }
  };

  // Delete committee
  const handleDeleteCommittee = async () => {
    if (!selectedCommittee) return;

    try {
      const { error } = await supabase
        .from('committees')
        .delete()
        .eq('id', selectedCommittee.id);

      if (error) throw error;
      
      onDeleteCommitteeClose();
      setSelectedCommittee(null);
      fetchCommittees();
    } catch (error) {
      setError('Chyba při mazání komise');
      console.error('Error deleting committee:', error);
    }
  };

  // Open edit modal
  const handleEditCommittee = (committee: Committee) => {
    setSelectedCommittee(committee);
    setFormData({
      name: committee.name,
      code: committee.code,
      description: committee.description || '',
      is_active: committee.is_active,
      sort_order: committee.sort_order
    });
    onEditCommitteeOpen();
  };

  // Handle opening add committee modal with clean form
  const handleOpenAddCommittee = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
      sort_order: 0
    });
    onAddCommitteeOpen();
  };

  // Handle closing add committee modal with clean form
  const handleCloseAddCommittee = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
      sort_order: 0
    });
    onAddCommitteeClose();
  };

  // Handle closing edit committee modal with clean form
  const handleCloseEditCommittee = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
      sort_order: 0
    });
    setSelectedCommittee(null);
    onEditCommitteeClose();
  };

  // Open delete modal
  const handleDeleteCommitteeModal = (committee: Committee) => {
    setSelectedCommittee(committee);
    onDeleteCommitteeOpen();
  };

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Seznam komisí</h2>
          </div>
                            <Button 
                    color="primary" 
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={handleOpenAddCommittee}
                  >
                    Přidat komisi
                  </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Kód</th>
                    <th className="text-left py-3 px-4">Název</th>
                    <th className="text-left py-3 px-4">Popis</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Pořadí</th>
                    <th className="text-center py-3 px-4">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {committees.map((committee) => (
                    <tr key={committee.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-mono text-sm">{committee.code}</td>
                      <td className="py-3 px-4 font-medium">{committee.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {committee.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={committee.is_active ? 'success' : 'default'} variant="flat" size="sm">
                          {committee.is_active ? 'Aktivní' : 'Neaktivní'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{committee.sort_order}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            isIconOnly
                            onPress={() => handleEditCommittee(committee)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => handleDeleteCommitteeModal(committee)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {committees.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Žádné komise nebyly nalezeny
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Committee Modal */}
      <Modal isOpen={isAddCommitteeOpen} onClose={handleCloseAddCommittee} size="2xl">
        <ModalContent>
          <ModalHeader>Přidat komisi</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Kód"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                isRequired
                placeholder="např. OSK_OSTRAVA"
              />
              <Input
                label="Název"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
                placeholder="např. Oblastní soutěžní komise Ostrava"
              />
              <Input
                label="Popis"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Volitelný popis komise"
              />
              <Input
                label="Pořadí"
                type="number"
                value={formData.sort_order.toString()}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Aktivní</span>
              </label>
            </div>
          </ModalBody>
                            <ModalFooter>
                    <Button variant="light" onPress={handleCloseAddCommittee}>
                      Zrušit
                    </Button>
                    <Button color="primary" onPress={handleAddCommittee}>
                      Přidat
                    </Button>
                  </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Committee Modal */}
      <Modal isOpen={isEditCommitteeOpen} onClose={handleCloseEditCommittee} size="2xl">
        <ModalContent>
          <ModalHeader>Upravit komisi</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Kód"
                value={formData.code}
                isDisabled
                placeholder="Kód nelze upravit"
                description="Kód komise nelze změnit po vytvoření"
              />
              <Input
                label="Název"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
                placeholder="např. Oblastní soutěžní komise Ostrava"
              />
              <Input
                label="Popis"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Volitelný popis komise"
              />
              <Input
                label="Pořadí"
                type="number"
                value={formData.sort_order.toString()}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Aktivní</span>
              </label>
            </div>
          </ModalBody>
                            <ModalFooter>
                    <Button variant="light" onPress={handleCloseEditCommittee}>
                      Zrušit
                    </Button>
                    <Button color="primary" onPress={handleUpdateCommittee}>
                      Uložit
                    </Button>
                  </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Committee Modal */}
      <Modal isOpen={isDeleteCommitteeOpen} onClose={onDeleteCommitteeClose}>
        <ModalContent>
          <ModalHeader>Smazat komisi</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat komisi <strong>{selectedCommittee?.name}</strong>?
              Tato akce je nevratná a může ovlivnit týmy přiřazené k této komisi.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteCommitteeClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={handleDeleteCommittee}>
              Smazat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
