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
  status: PaymentStatus | 'paid' | 'partial' | 'unpaid' | 'not_required'
): 'success' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case PaymentStatus.PAID:
    case 'paid':
      return 'success'; // Green
    case PaymentStatus.PARTIAL:
    case 'partial':
      return 'warning'; // Orange/Yellow
    case PaymentStatus.UNPAID:
    case 'unpaid':
      return 'danger'; // Red
    case PaymentStatus.NOT_REQUIRED:
    case 'not_required':
      return 'default'; // Gray
    default:
      return 'default';
  }
};

export const getPaymentStatusLabel = (
  status: PaymentStatus | 'paid' | 'partial' | 'unpaid' | 'not_required'
): string => {
  switch (status) {
    case PaymentStatus.PAID:
    case 'paid':
      return 'Zaplaceno';
    case PaymentStatus.PARTIAL:
    case 'partial':
      return 'Částečně zaplaceno';
    case PaymentStatus.UNPAID:
    case 'unpaid':
      return 'Nezaplaceno';
    case PaymentStatus.NOT_REQUIRED:
    case 'not_required':
      return 'Nevyžadováno';
    default:
      return 'Neznámý stav';
  }
};
