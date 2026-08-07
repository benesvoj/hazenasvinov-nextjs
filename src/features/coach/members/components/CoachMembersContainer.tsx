'use client';

import {Button} from '@heroui/react';

import {PlusIcon} from '@/lib/icons/PlusIcon';
import {translations} from '@/lib/translations';

import {
  Checkbox,
  Choice,
  ContentCard,
  DeleteDialog,
  FULL_EDIT,
  MemberCategoryChangeDialog,
  MemberFormModal,
  MembersInternalSection,
  MemberToggleActiveDialog,
  PaymentFormModal,
  Search,
  Show,
} from '@/components';
import {useAppData} from '@/contexts';
import {AppPageLayout} from '@/shared/components';
import {BaseMember} from '@/types';
import {hasMoreThanOne} from '@/utils';

import {useCoachMembersPageLogic} from '../hooks/useCoachMembersPageLogic';

export default function CoachMembersContainer() {
  const state = useCoachMembersPageLogic();
  const {
    categories: {data: categoriesData},
  } = useAppData();

  return (
    <>
      <AppPageLayout
        header={
          <ContentCard padding="none">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
              <Search
                value={state.searchTerm}
                onChange={state.setSearchTerm}
                placeholder={translations.members.table.filters.searchPlaceholder}
                className="md:w-1/2"
              />
              <div className="flex flex-col md:flex-row gap-4 w-full justify-end items-center">
                <Show when={hasMoreThanOne(state.availableCategories)}>
                  <Choice
                    value={state.selectedCategory}
                    onChange={(id) => state.setSelectedCategory(id)}
                    items={state.availableCategories.map((c) => ({key: c.id, label: c.name}))}
                    label={translations.members.table.columns.category}
                    size="sm"
                    className="md:w-1/4"
                    disallowEmptySelection={true}
                  />
                </Show>
                <Checkbox
                  isSelected={state.isActiveOnly}
                  onChange={() => state.setIsActiveOnly(!state.isActiveOnly)}
                  label={translations.common.labels.isActiveOnly}
                  size="sm"
                  className="w-fit"
                />
                <Button
                  startContent={<PlusIcon />}
                  color="primary"
                  onPress={() => state.memberModal.onOpen()}
                  className="w-fit"
                >
                  {translations.common.actions.add}
                </Button>
              </div>
            </div>
          </ContentCard>
        }
      >
        <MembersInternalSection
          refreshTrigger={state.refreshKey}
          categoriesData={categoriesData}
          categoryId={state.selectedCategory}
          ariaLabel={translations.members.table.ariaLabel}
          onEdit={(member) =>
            state.memberModal.openWith(member as unknown as import('@/types').Member)
          }
          onPayment={state.openPaymentInternal}
          onToggleActive={state.toggleActiveModal.openWith}
          onChangeCategory={state.changeCategoryModal.openWith}
          onDelete={state.isAdmin ? state.openDeleteInternal : undefined}
          searchTerm={state.searchTerm}
          pageSize={10}
          // `undefined` = no filter (all members); `true` = active only.
          filters={{isActive: state.isActiveOnly || undefined}}
        />
      </AppPageLayout>

      <MemberFormModal
        key={state.memberModal.selectedItem?.id ?? 'new'}
        isOpen={state.memberModal.isOpen}
        onClose={state.memberModal.closeAndClear}
        member={state.memberModal.selectedItem}
        categories={state.availableCategories || []}
        showPaymentsTab
        onSuccess={state.triggerRefresh}
        sections={FULL_EDIT}
      />

      {state.modals.paymentModal.isOpen && state.modals.paymentModal.selectedItem && (
        <PaymentFormModal
          key={state.modals.paymentModal.selectedItem?.id ?? 'payment-new'}
          isOpen={state.modals.paymentModal.isOpen}
          onClose={state.modals.paymentModal.onClose}
          member={state.modals.paymentModal.selectedItem as BaseMember}
          payment={null}
          defaultYear={state.currentYear}
          onSuccess={state.triggerRefresh}
        />
      )}

      <MemberCategoryChangeDialog
        key={state.changeCategoryModal.selectedItem?.id ?? 'category-change'}
        isOpen={state.changeCategoryModal.isOpen}
        onClose={state.changeCategoryModal.closeAndClear}
        onSubmit={state.handleChangeCategory}
        member={state.changeCategoryModal.selectedItem}
        // All club categories, not just the coach's own — moving a player up
        // (dorostenka → ženy) targets a category run by somebody else.
        categories={categoriesData || []}
        isLoading={state.isDeleteLoading}
      />

      <MemberToggleActiveDialog
        isOpen={state.toggleActiveModal.isOpen}
        onClose={state.toggleActiveModal.closeAndClear}
        onSubmit={state.handleToggleActive}
        member={state.toggleActiveModal.selectedItem}
        isLoading={state.isDeleteLoading}
      />

      <DeleteDialog
        isOpen={state.modals.deleteModal.isOpen}
        onClose={state.modals.deleteModal.onClose}
        onSubmit={state.handleDeleteMember}
        title={translations.members.modals.titles.deleteMember}
        message={translations.members.modals.deleteMemberMessage}
        isLoading={state.isDeleteLoading}
      />
    </>
  );
}
