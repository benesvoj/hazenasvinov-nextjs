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
import {isNotNilOrEmpty} from '@/utils';

export const MemberFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  sections = QUICK_CREATE,
  member,
  categories,
  showPaymentsTab,
}: MemberFormModalProps) => {
  const {formData, updateFormData, handleSubmit, isLoading, openAddMode, openEditMode} =
    useMemberForm();

  const isEditMode = isNotNilOrEmpty(member);

  useEffect(() => {
    if (member) {
      openEditMode(member);
    } else {
      openAddMode();
    }
  }, [member]);

  const handleInputChange = (field: keyof MemberMetadataFormData, value: string) => {
    updateFormData({[field]: value} as Partial<MemberMetadataFormData>);
  };

  const title = isEditMode
    ? translations.members.modals.titles.editMember
    : translations.members.modals.titles.addMember;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={async () => {
        const member = await handleSubmit();
        if (member) {
          onSuccess(member);
          onClose();
        }
      }}
      title={title}
      isLoading={isLoading}
      size="4xl"
      scrollBehavior="inside"
    >
      <Tabs>
        <Tab key="basic_info" title={translations.members.modals.tabs.info}>
          <Grid columns={2} gap={'sm'}>
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
