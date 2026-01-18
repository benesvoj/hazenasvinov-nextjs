'use client';

import React from 'react';

import {Chip} from '@heroui/react';

import {
  getPaymentStatusColor,
  getPaymentStatusLabel,
  PaymentStatus,
} from '@/enums/membershipFeeStatus';

import {StatusCell} from '@/app/admin/members/components';

import {getMemberFunctionOptions} from '@/enums';
import {translations} from '@/lib';
import {MemberExternal, MemberInternal, MemberOnLoan} from '@/types';

// Internal member cell renderer (includes payment status)
const renderInternalMemberCell = (
  member: MemberInternal,
  columnKey: string,
  categories: Record<string, string>
): React.ReactNode => {
  switch (columnKey) {
    case 'status':
      return <StatusCell isActive={member.is_active ?? false} />;

    case 'membershipFee':
      return (
        <div className="flex flex-col gap-1">
          <Chip color={getPaymentStatusColor(member.payment_status)} size="sm" variant="bordered">
            {getPaymentStatusLabel(member.payment_status)}
          </Chip>
          {member.payment_status !== PaymentStatus.NOT_REQUIRED && (
            <span className="text-xs text-gray-500">
              {member.net_paid} / {member.expected_fee_amount} {member.currency}
            </span>
          )}
        </div>
      );

    // ... other common cases
    default:
      return renderCommonMemberCell(member, columnKey, categories);
  }
};

// External member cell renderer (no payment status)
const renderExternalMemberCell = (
  member: MemberExternal,
  columnKey: string,
  categories: Record<string, string>
): React.ReactNode => {
  switch (columnKey) {
    case 'origin_club_name':
      return member.origin_club_name || '-';

    default:
      return renderCommonMemberCell(member, columnKey, categories);
  }
};

// On loan member cell renderer
const renderOnLoanMemberCell = (
  member: MemberOnLoan,
  columnKey: string,
  categories: Record<string, string>
): React.ReactNode => {
  switch (columnKey) {
    case 'origin_club_name':
      return member.origin_club_name || '-';
    case 'origin_club_short_name':
      return member.origin_club_short_name || '-';
    default:
      return renderCommonMemberCell(member, columnKey, categories);
  }
};

// Common cell renderer (shared logic)
const renderCommonMemberCell = (
  member: MemberInternal | MemberExternal | MemberOnLoan,
  columnKey: string,
  categories: Record<string, string>
): React.ReactNode => {
  const t = translations.members;

  switch (columnKey) {
    case 'status':
      return <StatusCell isActive={member.is_active ?? false} />;
    case 'registration_number':
      return <span className="font-medium">{member.registration_number || '-'}</span>;
    case 'name':
      return <span className="font-medium">{member.name}</span>;
    case 'surname':
      return <span className="font-medium">{member.surname}</span>;
    case 'date_of_birth': {
      const birthDate = new Date(member.date_of_birth || '');
      if (isNaN(birthDate.getTime())) {
        return <span className="text-gray-400">-</span>;
      }
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return (
        <span>
          {birthDate.toLocaleDateString('cs-CZ')} ({age})
        </span>
      );
    }
    case 'category':
      return categories[member.category_id || ''] || '-';
    case 'functions':
      if (!member.is_active || !member.functions || member.functions.length === 0) {
        return <span className="text-gray-500">{t.table.noFunctionsFound}</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {member.functions.map((func) =>
            getMemberFunctionOptions().map(
              ({value, label}) =>
                func === value && (
                  <Chip key={func} color="primary" variant="solid" size="sm">
                    {label}
                  </Chip>
                )
            )
          )}
        </div>
      );
    default:
      return null;
  }
};

export {
  renderInternalMemberCell,
  renderExternalMemberCell,
  renderOnLoanMemberCell,
  renderCommonMemberCell,
};
