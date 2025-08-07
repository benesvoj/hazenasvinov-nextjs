'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";

interface Member {
  id: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isAddMemberOpen, onOpen: onAddMemberOpen, onClose: onAddMemberClose } = useDisclosure();
  const { isOpen: isEditMemberOpen, onOpen: onEditMemberOpen, onClose: onEditMemberClose } = useDisclosure();
  const { isOpen: isDeleteMemberOpen, onOpen: onDeleteMemberOpen, onClose: onDeleteMemberClose } = useDisclosure();
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
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

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      setError('Chyba při načítání členů');
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Add new member
  const handleAddMember = async () => {
    try {
      const { error } = await supabase
        .from('members')
        .insert({
          name: formData.name,
          surname: formData.surname,
          date_of_birth: formData.date_of_birth,
          category: formData.category,
          sex: formData.sex,
          functions: formData.functions
        });

      if (error) throw error;
      
      onAddMemberClose();
      setFormData({
        name: '',
        surname: '',
        date_of_birth: '',
        category: 'men',
        sex: 'male',
        functions: []
      });
      fetchMembers();
    } catch (error) {
      setError('Chyba při přidávání člena');
      console.error('Error adding member:', error);
    }
  };

  // Update member
  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: formData.name,
          surname: formData.surname,
          date_of_birth: formData.date_of_birth,
          category: formData.category,
          sex: formData.sex,
          functions: formData.functions
        })
        .eq('id', selectedMember.id);

      if (error) throw error;
      
      onEditMemberClose();
      setSelectedMember(null);
      setFormData({
        name: '',
        surname: '',
        date_of_birth: '',
        category: 'men',
        sex: 'male',
        functions: []
      });
      fetchMembers();
    } catch (error) {
      setError('Chyba při aktualizaci člena');
      console.error('Error updating member:', error);
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

      if (error) throw error;
      
      onDeleteMemberClose();
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      setError('Chyba při mazání člena');
      console.error('Error deleting member:', error);
    }
  };

  // Open edit modal
  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setFormData({
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
    setSelectedMember(member);
    onDeleteMemberOpen();
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Správa členů klubu
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Spravujte seznam členů klubu - přidávejte, upravujte a mazajte členy
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
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
            onPress={onAddMemberOpen}
          >
            Přidat člena
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
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
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
              {members.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Žádní členové nebyli nalezeni
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={onAddMemberClose}>
        <ModalContent>
          <ModalHeader>Přidat nového člena</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
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
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {Object.entries(categories).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'male' | 'female' })}
              >
                {Object.entries(sexOptions).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddMemberClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={handleAddMember}>
              Přidat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={isEditMemberOpen} onClose={onEditMemberClose}>
        <ModalContent>
          <ModalHeader>Upravit člena</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
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
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {Object.entries(categories).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'male' | 'female' })}
              >
                {Object.entries(sexOptions).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              
                             <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Funkce
                 </label>
                 <div className="flex flex-wrap gap-2">
                   {Object.entries(functionOptions).map(([key, value]) => (
                     <label
                       key={key}
                       className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                         formData.functions.includes(key)
                           ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-2 border-blue-300 dark:border-blue-600'
                           : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                       }`}
                     >
                       <input
                         type="checkbox"
                         className="sr-only"
                         checked={formData.functions.includes(key)}
                         onChange={(e) => {
                           if (e.target.checked) {
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
                       />
                       <span>{value}</span>
                     </label>
                   ))}
                 </div>
               </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditMemberClose}>
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
              Opravdu chcete smazat člena <strong>{selectedMember?.name} {selectedMember?.surname}</strong>?
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
