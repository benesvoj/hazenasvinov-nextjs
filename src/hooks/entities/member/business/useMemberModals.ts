import {useState} from 'react';

import {useDisclosure} from '@heroui/react';

import {Genders} from '@/enums';
import {Member} from '@/types';

interface UseMemberModalsProps {
  onSuccess: () => void;
}

const formInitData: Member = {
  registration_number: '',
  name: '',
  surname: '',
  date_of_birth: null,
  category_id: '',
  sex: Genders.MALE,
  functions: [],
  id: '',
  created_at: '',
  updated_at: '',
  is_active: true,
};

export const useMemberModals = ({onSuccess}: UseMemberModalsProps) => {
  // Modal states
  const addModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const detailModal = useDisclosure();
  const bulkEditModal = useDisclosure();

  // Selected data
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  // Form data
  const [formData, setFormData] = useState<Member>({...formInitData});

  const [bulkEditFormData, setBulkEditFormData] = useState({
    sex: Genders.EMPTY,
    category: '',
    functions: [] as string[],
  });

  // Open handlers
  const openAdd = () => {
    setFormData({...formInitData});
    addModal.onOpen();
  };

  const openEdit = (member: Member) => {
    setSelectedMember(member);
    setFormData({
      registration_number: member.registration_number || '',
      name: member.name,
      surname: member.surname,
      date_of_birth: member.date_of_birth || '',
      category_id: member.category_id,
      sex: member.sex,
      functions: member.functions || [],
      id: member.id,
      created_at: member.created_at,
      updated_at: member.updated_at,
      is_active: member.is_active !== undefined ? member.is_active : true,
    });
    editModal.onOpen();
  };

  const openDelete = (member: Member) => {
    setSelectedMember(member);
    deleteModal.onOpen();
  };

  const openDetail = (member: Member) => {
    setSelectedMember(member);
    detailModal.onOpen();
  };

  const openBulkEdit = () => {
    if (selectedMembers.size === 0) return;
    bulkEditModal.onOpen();
  };

  // Close handlers with cleanup
  const closeAdd = () => {
    addModal.onClose();
  };

  const closeEdit = () => {
    setSelectedMember(null);
    editModal.onClose();
  };

  const closeDelete = () => {
    setSelectedMember(null);
    deleteModal.onClose();
  };

  const closeDetail = () => {
    setSelectedMember(null);
    detailModal.onClose();
  };

  const closeBulkEdit = () => {
    setSelectedMembers(new Set());
    setBulkEditFormData({
      sex: Genders.EMPTY,
      category: '',
      functions: [],
    });
    bulkEditModal.onClose();
  };

  return {
    // Modal states
    addModal: {...addModal, onClose: closeAdd},
    editModal: {...editModal, onClose: closeEdit},
    deleteModal: {...deleteModal, onClose: closeDelete},
    detailModal: {...detailModal, onClose: closeDetail},
    bulkEditModal: {...bulkEditModal, onClose: closeBulkEdit},

    // Open handlers
    openAdd,
    openEdit,
    openDelete,
    openDetail,
    openBulkEdit,

    // Selected data
    selectedMember,
    selectedMembers,
    setSelectedMembers,

    // Form data
    formData,
    setFormData,
    bulkEditFormData,
    setBulkEditFormData,

    // Success callback
    onSuccess,
  };
};
