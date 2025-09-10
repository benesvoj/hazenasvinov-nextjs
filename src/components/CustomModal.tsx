import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  ModalProps
} from "@heroui/react";

interface CustomModalProps extends Omit<ModalProps, 'isOpen' | 'onOpenChange'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  scrollBehavior?: "inside" | "outside";
}

export default function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "2xl",
  closeOnOverlayClick = true,
  scrollBehavior = "inside",
  ...props
}: CustomModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      scrollBehavior={scrollBehavior}
      closeOnOverlayClick={closeOnOverlayClick}
      classNames={{
        base: "max-w-[95vw] mx-2",
        wrapper: "items-center justify-center p-2 sm:p-4",
        body: "max-h-[80vh] overflow-y-auto",
        header: "pb-2",
        footer: "pt-2"
      }}
      {...props}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {title}
            </h2>
          </div>
        </ModalHeader>
        
        <ModalBody className="px-4 sm:px-6 py-4">
          {children}
        </ModalBody>
        
        {footer && (
          <ModalFooter className="px-4 sm:px-6 py-4">
            {footer}
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
    onToggle: () => isOpen ? onClose() : onOpen()
  };
};
