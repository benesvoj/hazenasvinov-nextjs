import {PaymentStatus} from '@/enums/membershipFeeStatus';

export const getPaymentStatusColor = (
  status: PaymentStatus
): 'success' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'success';
    case PaymentStatus.PARTIAL:
      return 'warning';
    case PaymentStatus.UNPAID:
      return 'danger';
    case PaymentStatus.NOT_REQUIRED:
      return 'default';
    default:
      return 'default';
  }
};
