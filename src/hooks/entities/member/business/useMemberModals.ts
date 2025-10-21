'use client';
import {useState} from 'react';

import {useDisclosure} from '@heroui/react';

import {Genders} from '@/enums';
import {BaseMember, Member} from '@/types';

export type MemberContext = 'internal' | 'external' | 'on_loan';

interface UseMemberModalsProps {
  onSuccess: () => void;
}

export const useMemberModals = <T extends BaseMember = Member>({
  onSuccess,
}: UseMemberModalsProps) => {
  // Modal states
  const addModal = useDisclosure();
  const paymentModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const detailModal = useDisclosure();
  const bulkEditModal = useDisclosure();

  // Selected data
  const [selectedMember, setSelectedMember] = useState<T | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  // NEW: Context tracking
  const [modalContext, setModalContext] = useState<MemberContext | null>(null);

  // Form data (always use Member type for forms)
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

  const [formData, setFormData] = useState<Member>({...formInitData});
  const [bulkEditFormData, setBulkEditFormData] = useState({
    sex: Genders.EMPTY,
    category: '',
    functions: [] as string[],
  });

  // Open handlers with context
  const openAdd = () => {
    setFormData({...formInitData});
    setModalContext('internal'); // Add is always for internal
    addModal.onOpen();
  };

  const openPayment = (member: T, context: MemberContext) => {
    setSelectedMember(member);
    setModalContext(context);
    paymentModal.onOpen();
  };

  const openEdit = (member: T, context: MemberContext) => {
    setSelectedMember(member);
    setModalContext(context);
    setFormData({
      registration_number: member.registration_number || '',
      name: member.name,
      surname: member.surname,
      date_of_birth: member.date_of_birth || '',
      category_id: member.category_id || '',
      sex: (member.sex as Genders) || Genders.MALE,
      functions: (member.functions as any[]) || [],
      id: member.id,
      created_at: member.created_at || '',
      updated_at: member.updated_at || '',
      is_active: member.is_active ?? true,
    });
    editModal.onOpen();
  };

  const openDelete = (member: T, context: MemberContext) => {
    setSelectedMember(member);
    setModalContext(context);
    deleteModal.onOpen();
  };

  const openDetail = (member: T, context: MemberContext) => {
    setSelectedMember(member);
    setModalContext(context);
    detailModal.onOpen();
  };

  const openBulkEdit = () => {
    if (selectedMembers.size === 0) return;
    setModalContext('internal'); // Bulk edit only for internal
    bulkEditModal.onOpen();
  };

  // Close handlers with cleanup
  const closeAdd = () => {
    setModalContext(null);
    addModal.onClose();
  };

  const closePayment = () => {
    setSelectedMember(null);
    setModalContext(null);
    paymentModal.onClose();
  };

  const closeEdit = () => {
    setSelectedMember(null);
    setModalContext(null);
    editModal.onClose();
  };

  const closeDelete = () => {
    setSelectedMember(null);
    setModalContext(null);
    deleteModal.onClose();
  };

  const closeDetail = () => {
    setSelectedMember(null);
    setModalContext(null);
    detailModal.onClose();
  };

  const closeBulkEdit = () => {
    setSelectedMembers(new Set());
    setBulkEditFormData({
      sex: Genders.EMPTY,
      category: '',
      functions: [],
    });
    setModalContext(null);
    bulkEditModal.onClose();
  };

  return {
    // Modal states
    addModal: {...addModal, onClose: closeAdd},
    paymentModal: {...paymentModal, onClose: closePayment},
    editModal: {...editModal, onClose: closeEdit},
    deleteModal: {...deleteModal, onClose: closeDelete},
    detailModal: {...detailModal, onClose: closeDetail},
    bulkEditModal: {...bulkEditModal, onClose: closeBulkEdit},

    // Open handlers
    openAdd,
    openPayment,
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

    // Context
    modalContext, // NEW: Expose context

    // Success callback
    onSuccess,
  };
};
