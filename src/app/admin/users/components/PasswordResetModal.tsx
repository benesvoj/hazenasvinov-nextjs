import {Alert, Input} from '@heroui/react';

import {UnifiedModal} from '@/components/ui/modals';

import {translations} from '@/lib/translations/index';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  passwordResetEmail: string;
  isSubmitting?: boolean;
}

export const PasswordResetModal = ({
  isOpen,
  onClose,
  onSubmit,
  passwordResetEmail,
  isSubmitting,
}: PasswordResetModalProps) => {
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={translations.admin.users.modal.passwordResetTitle}
      isFooterWithActions
      onPress={onSubmit}
      onPressButtonLabel={translations.common.actions.send}
      isDisabled={isSubmitting}
      isLoading={isSubmitting}
      size={'md'}
    >
      <Alert
        color={'secondary'}
        title={translations.common.alerts.info}
        description={translations.admin.users.alert.passwordResetInfo}
      />
      <Input
        label={translations.admin.users.labels.userEmail}
        value={passwordResetEmail}
        type="email"
        isDisabled
      />
    </UnifiedModal>
  );
};
