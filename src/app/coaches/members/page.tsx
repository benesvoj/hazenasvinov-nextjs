'use client';

import React, {useState} from 'react';

import {Button} from '@heroui/react';

import {PlusIcon} from '@/lib/icons/PlusIcon';
import {translations} from '@/lib/translations';

import {useCoachCategory} from '@/app/coaches/components/CoachCategoryContext';

import {
  Checkbox,
  Choice,
  ContentCard,
  DeleteDialog,
  FULL_EDIT,
  MemberFormModal,
  MembersInternalSection,
  PageContainer,
  PaymentFormModal,
  Search,
  Show,
} from '@/components';
import {useAppData} from '@/contexts';
import {currentYear} from '@/helpers';
import {useMemberModals, useMembers, useMemberSave, useModalWithItem} from '@/hooks';
import {BaseMember, Member, MemberInternal} from '@/types';
import {hasMoreThanOne} from '@/utils';

export default function CoachesMembersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    categories: {data: categoriesData},
  } = useAppData();
  const {selectedCategory, setSelectedCategory, availableCategories} = useCoachCategory();
  const modals = useMemberModals<MemberInternal>();
  const memberModal = useModalWithItem<Member>();
  const {deleteMember, isLoading: isDeleteLoading} = useMembers();
  const {handleSave} = useMemberSave(memberModal, () => setRefreshKey((k) => k + 1));
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isActiveOnly, setIsActiveOnly] = useState<boolean>(true);

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
      <ContentCard padding="none">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
          <Search
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={translations.members.table.filters.searchPlaceholder}
            className={'md:w-1/2'}
          />
          <div className="flex flex-col md:flex-row gap-4 w-full justify-end items-center">
            <Show when={hasMoreThanOne(availableCategories)}>
              <Choice
                value={selectedCategory}
                onChange={(id) => setSelectedCategory(id)}
                items={availableCategories.map((c) => ({key: c.id, label: c.name}))}
                label={translations.members.table.columns.category}
                size="sm"
                className={'md:w-1/4'}
                disallowEmptySelection={true}
              />
            </Show>
            <Checkbox
              isSelected={isActiveOnly}
              onChange={() => setIsActiveOnly(!isActiveOnly)}
              label={translations.common.labels.isActiveOnly}
              size="sm"
              className="w-fit"
            />
            <Button
              startContent={<PlusIcon />}
              color={'primary'}
              onPress={() => memberModal.onOpen()}
              className={'w-fit'}
            >
              {translations.common.actions.add}
            </Button>
          </div>
        </div>
      </ContentCard>
      <MembersInternalSection
        key={refreshKey}
        categoriesData={categoriesData}
        categoryId={selectedCategory}
        ariaLabel={translations.members.table.ariaLabel}
        onEdit={(member) => memberModal.openWith(member as unknown as Member)}
        onPayment={openPaymentInternal}
        onDelete={openDeleteInternal}
        searchTerm={searchTerm}
        pageSize={10}
        filters={{isActive: isActiveOnly}}
      />

      <MemberFormModal
        key={memberModal.selectedItem?.id ?? 'new'}
        isOpen={memberModal.isOpen}
        onClose={memberModal.closeAndClear}
        member={memberModal.selectedItem}
        categories={availableCategories || []}
        showPaymentsTab
        onSuccess={handleSave}
        sections={FULL_EDIT}
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

      <DeleteDialog
        isOpen={modals.deleteModal.isOpen}
        onClose={modals.deleteModal.onClose}
        onSubmit={handleDeleteMember}
        title={translations.members.modals.titles.deleteMember}
        message={translations.members.modals.deleteMemberMessage}
        isLoading={isDeleteLoading}
      />
    </PageContainer>
  );
}
