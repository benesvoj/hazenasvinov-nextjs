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

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'success'; // Green
    case PaymentStatus.PARTIAL:
      return 'warning'; // Orange/Yellow
    case PaymentStatus.UNPAID:
      return 'danger'; // Red
    case PaymentStatus.NOT_REQUIRED:
      return 'default'; // Gray
    default:
      return 'default';
  }
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'Zaplaceno';
    case PaymentStatus.PARTIAL:
      return 'Částečně zaplaceno';
    case PaymentStatus.UNPAID:
      return 'Nezaplaceno';
    case PaymentStatus.NOT_REQUIRED:
      return 'Nevyžadováno';
    default:
      return 'Neznámý stav';
  }
};
