'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import { 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";

interface Member {
  id: string;
  registration_number: string;
  name: string;
  surname: string;
  date_of_birth: string;
  category: string;
  sex: 'male' | 'female';
  functions: string[];
  created_at: string;
  updated_at: string;
}

const categories = {
  men: "Muži",
  women: "Ženy", 
  juniorBoys: "Dorostenci",
  juniorGirls: "Dorostenky",
  prepKids: "Přípravka",
  youngestKids: "Nejmladší děti",
  youngerBoys: "Mladší žáci",
  youngerGirls: "Mladší žákyně",
  olderBoys: "Starší žáci",
  olderGirls: "Starší žákyně"
};

const sexOptions = {
  male: "Muž",
  female: "Žena"
};

const functionOptions = {
  player: "Hráč",
  coach: "Trenér",
  referee: "Rozhodčí",
  club_management: "Vedení klubu"
};

export default function MembersAdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const { isOpen: isAddMemberOpen, onOpen: onAddMemberOpen, onClose: onAddMemberClose } = useDisclosure();
  const { isOpen: isEditMemberOpen, onOpen: onEditMemberOpen, onClose: onEditMemberClose } = useDisclosure();
  const { isOpen: isDeleteMemberOpen, onOpen: onDeleteMemberOpen, onClose: onDeleteMemberClose } = useDisclosure();
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    registration_number: '',
    name: '',
    surname: '',
    date_of_birth: '',
    category: 'men',
    sex: 'male' as 'male' | 'female',
    functions: [] as string[]
  });

  const supabase = createClient();

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('surname', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = 'Chyba při načítání členů';
      let debugInfo = '';
      
      if (error) {
        if (error.code) {
          debugInfo += `Kód chyby: ${error.code}. `;
        }
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          debugInfo += `Detaily: ${error.details}. `;
        }
        if (error.hint) {
          debugInfo += `Nápověda: ${error.hint}. `;
        }
      }
      
      const finalErrorMessage = debugInfo ? `${errorMessage} ${debugInfo}` : errorMessage;
      setError(finalErrorMessage);
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Filter members based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [searchTerm, members]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Add new member
  const handleAddMember = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert({
          registration_number: formData.registration_number || undefined, // Let trigger generate if empty
          name: formData.name,
          surname: formData.surname,
          date_of_birth: formData.date_of_birth,
          category: formData.category,
          sex: formData.sex,
          functions: formData.functions
        })
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      console.log('Member added successfully:', data);
      
      onAddMemberClose();
      // Clear form after successful submission
      setFormData({
        registration_number: '',
        name: '',
        surname: '',
        date_of_birth: '',
        category: 'men',
        sex: 'male',
        functions: []
      });
      fetchMembers();
      showSuccess('Člen byl úspěšně přidán.');
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = 'Chyba při přidávání člena';
      let debugInfo = '';
      
      if (error) {
        // Supabase specific errors
        if (error.code) {
          debugInfo += `Kód chyby: ${error.code}. `;
        }
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          debugInfo += `Detaily: ${error.details}. `;
        }
        if (error.hint) {
          debugInfo += `Nápověda: ${error.hint}. `;
        }
        
        // Generic error handling
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.toString && error.toString() !== '[object Object]') {
          errorMessage = error.toString();
        }
      }
      
      // Set user-friendly error message
      const finalErrorMessage = debugInfo ? `${errorMessage} ${debugInfo}` : errorMessage;
      setError(finalErrorMessage);
      
      // Log full error for debugging
      console.error('Full error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'No error object');
    }
  };

  // Update member
  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      const { data, error } = await supabase
        .from('members')
        .update({
          registration_number: formData.registration_number,
          name: formData.name,
          surname: formData.surname,
          date_of_birth: formData.date_of_birth,
          category: formData.category,
          sex: formData.sex,
          functions: formData.functions
        })
        .eq('id', selectedMember.id)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      console.log('Member updated successfully:', data);
      
      onEditMemberClose();
      setSelectedMember(null);
      setFormData({
        registration_number: '',
        name: '',
        surname: '',
        date_of_birth: '',
        category: 'men',
        sex: 'male',
        functions: []
      });
      fetchMembers();
      showSuccess('Člen byl úspěšně upraven.');
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = 'Chyba při aktualizaci člena';
      let debugInfo = '';
      
      if (error) {
        // Supabase specific errors
        if (error.code) {
          debugInfo += `Kód chyby: ${error.code}. `;
        }
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          debugInfo += `Detaily: ${error.details}. `;
        }
        if (error.hint) {
          debugInfo += `Nápověda: ${error.hint}. `;
        }
        
        // Generic error handling
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.toString && error.toString() !== '[object Object]') {
          errorMessage = error.toString();
        }
      }
      
      // Set user-friendly error message
      const finalErrorMessage = debugInfo ? `${errorMessage} ${debugInfo}` : errorMessage;
      setError(finalErrorMessage);
      
      // Log full error for debugging
      console.error('Full error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'No error object');
    }
  };

  // Delete member
  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', selectedMember.id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      onDeleteMemberClose();
      setSelectedMember(null);
      fetchMembers();
      showSuccess('Člen byl úspěšně smazán.');
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = 'Chyba při mazání člena';
      let debugInfo = '';
      
      if (error) {
        if (error.code) {
          debugInfo += `Kód chyby: ${error.code}. `;
        }
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          debugInfo += `Detaily: ${error.details}. `;
        }
        if (error.hint) {
          debugInfo += `Nápověda: ${error.hint}. `;
        }
      }
      
      const finalErrorMessage = debugInfo ? `${errorMessage} ${debugInfo}` : errorMessage;
      setError(finalErrorMessage);
      console.error('Error deleting member:', error);
    }
  };

  // Clear error when starting new actions
  const clearError = () => {
    setError("");
  };

  // Clear success message
  const clearSuccess = () => {
    setSuccessMessage("");
  };

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    // Auto-clear after 5 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  // Open edit modal
  const openEditModal = (member: Member) => {
    clearError(); // Clear any previous errors
    clearSuccess(); // Clear any previous success messages
    setSelectedMember(member);
    setFormData({
      registration_number: member.registration_number,
      name: member.name,
      surname: member.surname,
      date_of_birth: member.date_of_birth,
      category: member.category,
      sex: member.sex,
      functions: member.functions || []
    });
    onEditMemberOpen();
  };

  // Open delete modal
  const openDeleteModal = (member: Member) => {
    clearError(); // Clear any previous errors
    setSelectedMember(member);
    onDeleteMemberOpen();
  };

  // Open add modal
  const openAddModal = () => {
    clearError(); // Clear any previous errors
    clearSuccess(); // Clear any previous success messages
    // Reset form to default values
    setFormData({
      registration_number: '',
      name: '',
      surname: '',
      date_of_birth: '',
      category: 'men',
      sex: 'male',
      functions: []
    });
    onAddMemberOpen();
  };

  // Clear form data
  const clearFormData = () => {
    setFormData({
      registration_number: '',
      name: '',
      surname: '',
      date_of_birth: '',
      category: 'men',
      sex: 'male',
      functions: []
    });
  };

  // Handle modal close with form reset
  const handleAddModalClose = () => {
    clearFormData();
    clearError();
    onAddMemberClose();
  };

  const handleEditModalClose = () => {
    clearFormData();
    clearError();
    setSelectedMember(null);
    onEditMemberClose();
  };

  // Get category badge color
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'men': return 'primary';
      case 'women': return 'secondary';
      case 'juniorBoys': return 'success';
      case 'juniorGirls': return 'warning';
      case 'prepKids': return 'danger';
      case 'youngestKids': return 'default';
      case 'youngerBoys': return 'primary';
      case 'youngerGirls': return 'secondary';
      case 'olderBoys': return 'success';
      case 'olderGirls': return 'warning';
      default: return 'default';
    }
  };

  // Get sex badge color
  const getSexBadgeColor = (sex: string) => {
    return sex === 'male' ? 'primary' : 'secondary';
  };

  return (
    <div className="p-6">
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Chyba</span>
              </div>
              <p className="mt-1 text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-4 text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 13a1 1 0 100-2 1 1 0 000 2zm-3-2a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                <span className="font-medium">Úspěch</span>
              </div>
              <p className="mt-1 text-sm">{successMessage}</p>
            </div>
            <button
              onClick={clearSuccess}
              className="ml-4 text-green-400 hover:text-green-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Seznam členů</h2>
          </div>
          <Button 
            color="primary" 
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={openAddModal}
          >
            Přidat člena
          </Button>
        </CardHeader>
        <CardBody>
          {/* Search Bar */}
          <div className="mb-4">
            <Input
              placeholder="Hledat podle jména, příjmení nebo registračního čísla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Načítání...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Reg. číslo</th>
                    <th className="text-left py-3 px-4">Jméno</th>
                    <th className="text-left py-3 px-4">Příjmení</th>
                    <th className="text-left py-3 px-4">Datum narození</th>
                    <th className="text-left py-3 px-4">Kategorie</th>
                    <th className="text-left py-3 px-4">Pohlaví</th>
                    <th className="text-left py-3 px-4">Funkce</th>
                    <th className="text-center py-3 px-4">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-mono text-sm bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">
                        {member.registration_number}
                      </td>
                      <td className="py-3 px-4 font-medium">{member.name}</td>
                      <td className="py-3 px-4 font-medium">{member.surname}</td>
                      <td className="py-3 px-4">
                        {new Date(member.date_of_birth).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={getCategoryBadgeColor(member.category)} variant="flat">
                          {categories[member.category as keyof typeof categories]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={getSexBadgeColor(member.sex)} variant="flat">
                          {sexOptions[member.sex]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {member.functions && member.functions.length > 0 ? (
                            member.functions.map((func, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                {functionOptions[func as keyof typeof functionOptions]}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">Žádné funkce</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            onPress={() => openEditModal(member)}
                          >
                            Upravit
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            onPress={() => openDeleteModal(member)}
                          >
                            Smazat
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Žádní členové nebyli nalezeni pro zadaný výraz' : 'Žádní členové nebyli nalezeni'}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={handleAddModalClose}>
        <ModalContent>
          <ModalHeader>Přidat nového člena</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Registrační číslo (volitelné - vygeneruje se automaticky)"
                placeholder="REG-2024-0001"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              />
              <Input
                label="Jméno"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
              <Input
                label="Příjmení"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                isRequired
              />
              <Input
                label="Datum narození"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                isRequired
              />
              <Select
                label="Kategorie"
                selectedKeys={[formData.category]}
                onSelectionChange={(keys) => setFormData({ ...formData, category: Array.from(keys)[0] as string })}
                isRequired
              >
                {Object.entries(categories).map(([key, value]) => (
                  <SelectItem key={key}>
                    {value}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Pohlaví"
                selectedKeys={[formData.sex]}
                onSelectionChange={(keys) => setFormData({ ...formData, sex: Array.from(keys)[0] as 'male' | 'female' })}
                isRequired
              >
                {Object.entries(sexOptions).map(([key, value]) => (
                  <SelectItem key={key}>
                    {value}
                  </SelectItem>
                ))}
              </Select>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Funkce
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(functionOptions).map(([key, value]) => (
                    <Checkbox
                      key={key}
                      isSelected={formData.functions.includes(key)}
                      onValueChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            functions: [...formData.functions, key]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            functions: formData.functions.filter(f => f !== key)
                          });
                        }
                      }}
                    >
                      {value}
                    </Checkbox>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleAddModalClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleAddMember}>
              Přidat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={isEditMemberOpen} onClose={handleEditModalClose}>
        <ModalContent>
          <ModalHeader>Upravit člena</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Registrační číslo"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                isRequired
              />
              <Input
                label="Jméno"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
              <Input
                label="Příjmení"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                isRequired
              />
              <Input
                label="Datum narození"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                isRequired
              />
              <Select
                label="Kategorie"
                selectedKeys={[formData.category]}
                onSelectionChange={(keys) => setFormData({ ...formData, category: Array.from(keys)[0] as string })}
                isRequired
              >
                {Object.entries(categories).map(([key, value]) => (
                  <SelectItem key={key}>
                    {value}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Pohlaví"
                selectedKeys={[formData.sex]}
                onSelectionChange={(keys) => setFormData({ ...formData, sex: Array.from(keys)[0] as 'male' | 'female' })}
                isRequired
              >
                {Object.entries(sexOptions).map(([key, value]) => (
                  <SelectItem key={key}>
                    {value}
                  </SelectItem>
                ))}
              </Select>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Funkce
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(functionOptions).map(([key, value]) => (
                    <Checkbox
                      key={key}
                      isSelected={formData.functions.includes(key)}
                      onValueChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            functions: [...formData.functions, key]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            functions: formData.functions.filter(f => f !== key)
                          });
                        }
                      }}
                    >
                      {value}
                    </Checkbox>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleEditModalClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleUpdateMember}>
              Uložit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Member Modal */}
      <Modal isOpen={isDeleteMemberOpen} onClose={onDeleteMemberClose}>
        <ModalContent>
          <ModalHeader>Smazat člena</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat člena <strong>{selectedMember?.name} {selectedMember?.surname}</strong> 
              (Reg. číslo: {selectedMember?.registration_number})?
              Tato akce je nevratná.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteMemberClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={handleDeleteMember}>
              Smazat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
