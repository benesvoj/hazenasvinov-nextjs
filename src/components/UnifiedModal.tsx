import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  ModalProps,
  Button,
} from "@heroui/react";
import { Heading, HeadingLevel } from "./Headings";
import { translations } from "@/lib/translations";

interface UnifiedModalProps
  extends Omit<ModalProps, "isOpen" | "onOpenChange"> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  showCloseButton?: boolean;
  scrollBehavior?: "inside" | "outside";
  hSize?: HeadingLevel;
  actions?: React.ReactNode;
  isFooterWithActions?: boolean;
  onPress?: () => void;
  isDisabled?: boolean;
}

export default function UnifiedModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "2xl",
  scrollBehavior = "inside",
  hSize = 2,
  actions,
  isFooterWithActions = false,
  onPress,
  isDisabled,
  ...props
}: UnifiedModalProps) {
  const t = translations.button;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      scrollBehavior={scrollBehavior}
      classNames={{
        wrapper: "items-center justify-center p-2 sm:p-4",
        body: "max-h-[80vh] overflow-y-auto",
        header: "pb-2",
        footer: "pt-2",
      }}
      {...props}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <Heading size={hSize}>{title}</Heading>
          </div>
          {actions && (
            <div className="flex items-center justify-end">{actions}</div>
          )}
        </ModalHeader>
        <ModalBody className="px-4 sm:px-6 py-4">{children}</ModalBody>

        {footer && (
          <ModalFooter className="px-4 sm:px-6 py-4">{footer}</ModalFooter>
        )}
        {isFooterWithActions && (
          <ModalFooter className="px-4 sm:px-6 py-4">
            <Button
              color="danger"
              variant="flat"
              onPress={onClose}
              aria-label={t.cancel}
            >
              {t.cancel}
            </Button>
            <Button
              color="primary"
              onPress={onPress}
              isDisabled={isDisabled}
              aria-label={t.save}
            >
              {t.save}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}

// Hook for managing modal state
export const useCustomModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle: () => (isOpen ? onClose() : onOpen()),
  };
};
