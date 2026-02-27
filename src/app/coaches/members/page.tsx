'use client';

import React, {useState} from 'react';

import {translations} from '@/lib/translations/index';

import {useCoachCategory} from '@/app/coaches/components/CoachCategoryContext';

import {
  DeleteConfirmationModal,
  MemberModal,
  MembersInternalSection,
  PageContainer,
  PaymentFormModal,
} from '@/components';
import {useAppData} from '@/contexts';
import {currentYear} from '@/helpers';
import {useMemberModals, useMembers, useMemberSave, useModalWithItem} from '@/hooks';
import {BaseMember, Member, MemberInternal} from '@/types';

export default function CoachesMembersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    categories: {data: categoriesData},
  } = useAppData();
  const {selectedCategory} = useCoachCategory();
  const modals = useMemberModals<MemberInternal>();
  const memberModal = useModalWithItem<Member>();
  const {deleteMember} = useMembers();
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

  return (
    <PageContainer>
      <MembersInternalSection
        key={refreshKey}
        categoriesData={categoriesData}
        categoryId={selectedCategory}
        ariaLabel={translations.members.table.ariaLabel}
        onEdit={(member) => memberModal.openWith(member as unknown as Member)}
        onPayment={openPaymentInternal}
        onDelete={openDeleteInternal}
      />

      <MemberModal
        key={memberModal.selectedItem?.id ?? 'new'}
        isOpen={memberModal.isOpen}
        onClose={memberModal.closeAndClear}
        member={memberModal.selectedItem}
        categories={categoriesData || []}
        onSuccess={handleSave}
      />

      {modals.paymentModal.isOpen && modals.paymentModal.selectedItem && (
        <PaymentFormModal
          key={modals.paymentModal.selectedItem?.id ?? 'payment-new'}
          isOpen={modals.paymentModal.isOpen}
          onClose={modals.paymentModal.onClose}
          member={modals.paymentModal.selectedItem as BaseMember}
          payment={null}
          defaultYear={currentYear}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      <DeleteConfirmationModal
        isOpen={modals.deleteModal.isOpen}
        onClose={modals.deleteModal.onClose}
        onConfirm={handleDeleteMember}
        title={translations.members.modals.deleteMember}
        message={translations.members.modals.deleteMemberMessage}
      />
    </PageContainer>
  );
}
