'use client';

import {useState} from 'react';

import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
import {currentYear} from '@/helpers';
import {useMemberModals, useMembers, useMemberSave, useModalWithItem} from '@/hooks';
import {Member, MemberInternal} from '@/types';

export function useCoachMembersPageLogic() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isActiveOnly, setIsActiveOnly] = useState<boolean>(true);

  const {selectedCategory, setSelectedCategory, availableCategories, isAdmin} = useCoachCategory();
  const modals = useMemberModals<MemberInternal>();
  const memberModal = useModalWithItem<Member>();
  const toggleActiveModal = useModalWithItem<MemberInternal>();
  const {deleteMember, setMemberActive, isLoading: isDeleteLoading} = useMembers();
  const {handleSave} = useMemberSave(memberModal, () => setRefreshKey((k) => k + 1));

  const openDeleteInternal = (member: MemberInternal) => {
    modals.deleteModal.openWith(member);
  };

  const openPaymentInternal = (member: MemberInternal) => {
    modals.paymentModal.openWith(member);
  };

  const handleDeleteMember = async () => {
    const selectedItem = modals.deleteModal.selectedItem;
    if (!selectedItem?.id) return;

    await deleteMember(selectedItem.id);
    modals.deleteModal.closeAndClear();
    setRefreshKey((k) => k + 1);
  };

  /** Soft removal — the member stays in historical records but is no longer selectable. */
  const handleToggleActive = async () => {
    const selectedItem = toggleActiveModal.selectedItem;
    if (!selectedItem?.id) return;

    try {
      await setMemberActive(selectedItem.id, !selectedItem.is_active);
      toggleActiveModal.closeAndClear();
      setRefreshKey((k) => k + 1);
    } catch {
      // Toast already shown by useMembers — keep the dialog open
    }
  };

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return {
    // State
    refreshKey,
    searchTerm,
    setSearchTerm,
    isActiveOnly,
    setIsActiveOnly,

    // Category
    selectedCategory,
    setSelectedCategory,
    availableCategories,
    isAdmin,

    // Modals
    modals,
    memberModal,
    toggleActiveModal,
    handleSave,

    // Actions
    openDeleteInternal,
    openPaymentInternal,
    handleDeleteMember,
    handleToggleActive,
    triggerRefresh,

    // Misc
    isDeleteLoading,
    currentYear,
  };
}
