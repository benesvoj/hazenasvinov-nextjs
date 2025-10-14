'use client';

import {Badge, Button} from '@heroui/react';

import {ShoppingCart} from 'lucide-react';

interface FloatingBetSlipButtonProps {
  itemCount: number;
  onClick: () => void;
}

export default function FloatingBetSlipButton({itemCount, onClick}: FloatingBetSlipButtonProps) {
  // Don't show if no items
  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 lg:hidden">
      <Badge content={itemCount} color="danger" size="lg" placement="top-left">
        <Button
          isIconOnly
          color="primary"
          size="lg"
          className="w-16 h-16 shadow-lg"
          onPress={onClick}
          aria-label="Open bet slip"
        >
          <ShoppingCart className="w-6 h-6" />
        </Button>
      </Badge>
    </div>
  );
}
