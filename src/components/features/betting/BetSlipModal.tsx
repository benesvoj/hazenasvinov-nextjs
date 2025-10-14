'use client';

import {Modal, ModalContent, ModalBody} from '@heroui/react';

import {BetSlip} from '@/components';
import {BetSlipItem} from '@/types';

interface BetSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  items: BetSlipItem[];
  onRemoveItem: (index: number) => void;
  onClearAll: () => void;
  onBetPlaced?: () => void;
}

export default function BetSlipModal({
  isOpen,
  onClose,
  userId,
  items,
  onRemoveItem,
  onClearAll,
  onBetPlaced,
}: BetSlipModalProps) {
  const handleBetPlaced = () => {
    onBetPlaced?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      scrollBehavior="inside"
      classNames={{
        base: 'lg:hidden',
        wrapper: 'items-end',
        body: 'p-0',
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: 'easeOut',
            },
          },
          exit: {
            y: '100%',
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: 'easeIn',
            },
          },
        },
      }}
    >
      <ModalContent>
        <ModalBody>
          <div className="pb-6">
            <BetSlip
              userId={userId}
              items={items}
              onRemoveItem={onRemoveItem}
              onClearAll={onClearAll}
              onBetPlaced={handleBetPlaced}
            />
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
