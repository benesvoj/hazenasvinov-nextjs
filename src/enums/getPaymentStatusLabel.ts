import {translations} from '@/lib/translations';

import {PaymentStatus} from './membershipFeeStatus';

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PAID:
      return translations.membershipFees.enums.paymentStatus.paid;
    case PaymentStatus.PARTIAL:
      return translations.membershipFees.enums.paymentStatus.partial;
    case PaymentStatus.UNPAID:
      return translations.membershipFees.enums.paymentStatus.unpaid;
    case PaymentStatus.NOT_REQUIRED:
      return translations.membershipFees.enums.paymentStatus.notRequired;
    default:
      return translations.membershipFees.enums.paymentStatus.unknown;
  }
};
