'use client';

import {useEffect} from 'react';

import {Tab, Tabs} from '@heroui/tabs';

import {translations} from '@/lib/translations';

import {
  AdditionalSection,
  BasicInfoSection,
  ContactSection,
  Dialog,
  Grid,
  GridItem,
  MedicalSection,
  MemberPaymentsTab,
  ParentSection,
  QUICK_CREATE,
  Show,
} from '@/components';
import {useMemberForm} from '@/hooks';
import {MemberFormModalProps, MemberMetadataFormData} from '@/types';
import {hasItems, isNotNilOrEmpty} from '@/utils';

export const MemberFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  sections = QUICK_CREATE,
  member,
  categories,
  showPaymentsTab,
}: MemberFormModalProps) => {
  const {
    formData,
    updateFormData,
    handleSubmit,
    isLoading,
    isMetadataLoading,
    openAddMode,
    openEditModeWithMetadata,
  } = useMemberForm();

  const isEditMode = isNotNilOrEmpty(member);

  useEffect(() => {
    if (!isOpen) return;
    if (member) {
      // Loads the member row plus its metadata (contact, parent, medical, …)
      void openEditModeWithMetadata(member);
    } else {
      openAddMode();
    }
  }, [isOpen, member]);

  // Preselect the first category for NEW members only — in edit mode the
  // member's own category must never be overwritten by the default.
  useEffect(() => {
    if (!isOpen || isEditMode) return;
    if (hasItems(categories) && !formData.category_id) {
      updateFormData({category_id: categories[0].id});
    }
  }, [isOpen, isEditMode, categories, formData.category_id]);

  const handleInputChange = (field: keyof MemberMetadataFormData, value: string) => {
    updateFormData({[field]: value} as Partial<MemberMetadataFormData>);
  };

  const title = isEditMode
    ? translations.members.modals.titles.editMember
    : translations.members.modals.titles.addMember;

  const sizeOption = sections === QUICK_CREATE ? '2xl' : '4xl';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={async () => {
        try {
          const member = await handleSubmit();
          if (member) {
            onSuccess(member);
            onClose();
          }
        } catch {
          // Error already handled by useMembers (toast shown)
          // Keep modal open so user can fix the issue
        }
      }}
      title={title}
      isLoading={isLoading || isMetadataLoading}
      size={sizeOption}
      scrollBehavior="inside"
    >
      <Tabs>
        <Tab key="basic_info" title={translations.members.modals.tabs.info}>
          <Grid columns={sections === QUICK_CREATE ? 1 : 2} gap={'sm'}>
            <GridItem>
              <BasicInfoSection
                handleInputChange={handleInputChange}
                formData={formData}
                categories={categories || []}
              />
            </GridItem>
            <Show when={sections.contact}>
              <GridItem>
                <ContactSection handleInputChange={handleInputChange} formData={formData} />
              </GridItem>
            </Show>
            <Show when={sections.parent}>
              <GridItem>
                <ParentSection handleInputChange={handleInputChange} formData={formData} />
              </GridItem>
            </Show>
            <Show when={sections.medical}>
              <GridItem>
                <MedicalSection handleInputChange={handleInputChange} formData={formData} />
              </GridItem>
            </Show>
            <Show when={sections.additional}>
              <GridItem>
                <AdditionalSection handleInputChange={handleInputChange} formData={formData} />
              </GridItem>
            </Show>
          </Grid>
        </Tab>
        {isNotNilOrEmpty(member) && showPaymentsTab && (
          <Tab key="payments" title={translations.members.modals.tabs.membershipFees}>
            <MemberPaymentsTab member={member} />
          </Tab>
        )}
      </Tabs>
    </Dialog>
  );
};
