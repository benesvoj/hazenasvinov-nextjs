import {translations} from '@/lib/translations';

export enum PaymentStatus {
  PAID = 'paid',
  PARTIAL = 'partial',
  UNPAID = 'unpaid',
  NOT_REQUIRED = 'not_required',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  OTHER = 'other',
}

export enum FeeType {
  MEMBERSHIP = 'membership',
  REGISTRATION = 'registration',
  ADDITIONAL = 'additional',
  REFUND = 'refund',
}

export enum FeePeriod {
  YEARLY = 'yearly',
  SEMESTER = 'semester',
  QUARTERLY = 'quarterly',
  MONTHLY = 'monthly',
}

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

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PAID:
      return translations.membershipFees.paymentStatus.paid;
    case PaymentStatus.PARTIAL:
      return translations.membershipFees.paymentStatus.partial;
    case PaymentStatus.UNPAID:
      return translations.membershipFees.paymentStatus.unpaid;
    case PaymentStatus.NOT_REQUIRED:
      return translations.membershipFees.paymentStatus.notRequired;
    default:
      return translations.membershipFees.paymentStatus.unknown;
  }
};
