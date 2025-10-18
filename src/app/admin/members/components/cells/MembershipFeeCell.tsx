import React from 'react';

import {Chip} from '@heroui/react';

import {
  getPaymentStatusColor,
  getPaymentStatusLabel,
  PaymentStatus,
} from '@/enums/membershipFeeStatus';

interface MembershipFeeCellProps {
  paymentStatus: PaymentStatus;
  netPaid: number;
  expectedFeeAmount: number;
  currency: string;
}

export const MembershipFeeCell: React.FC<MembershipFeeCellProps> = ({
  paymentStatus,
  netPaid,
  expectedFeeAmount,
  currency,
}) => {
  if (paymentStatus === 'not_required') {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <Chip color={getPaymentStatusColor(paymentStatus)} size="sm" variant="flat">
        {getPaymentStatusLabel(paymentStatus)}
      </Chip>
      <span className="text-xs text-gray-500">
        {netPaid} / {expectedFeeAmount} {currency}
      </span>
    </div>
  );
};
