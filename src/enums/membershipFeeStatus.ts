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
