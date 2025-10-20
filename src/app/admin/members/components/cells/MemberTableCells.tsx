import {Chip} from '@heroui/react';

import {getPaymentStatusColor, getPaymentStatusLabel} from '@/enums/membershipFeeStatus';

import {GENDER_LABELS, Genders, getMemberFunctionOptions} from '@/enums';
import {translations} from '@/lib';
import {Member, MemberPaymentStatus} from '@/types';

import {StatusCell} from './StatusCell';

interface RenderCellProps {
  member: Member;
  columnKey: string;
  categories: Record<string, string>;
  getMemberPaymentStatus: (memberId: string) => MemberPaymentStatus | undefined;
}

export function renderMemberCell({
  member,
  columnKey,
  categories,
  getMemberPaymentStatus,
}: RenderCellProps) {
  const t = translations.members.table;

  switch (columnKey) {
    case 'status':
      return <StatusCell isActive={member.is_active} />;

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

    case 'sex':
      return member.sex === Genders.MALE ? GENDER_LABELS.male : GENDER_LABELS.female;

    case 'membershipFee': {
      const status = getMemberPaymentStatus(member.id);
      if (!status) return <span className="text-gray-400">-</span>;

      return (
        <div className="flex flex-col gap-1">
          <Chip color={getPaymentStatusColor(status.payment_status)} size="sm" variant="flat">
            {getPaymentStatusLabel(status.payment_status)}
          </Chip>
          {status.payment_status !== 'not_required' && (
            <span className="text-xs text-gray-500">
              {status.net_paid} / {status.expected_fee_amount} {status.currency || 'CZK'}
            </span>
          )}
        </div>
      );
    }

    case 'functions':
      if (!member.is_active) {
        return <span className="text-gray-500">{t.noFunctionsFound}</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {member.functions.map((func) => (
            <Chip key={func} color="primary" variant="solid" size="sm">
              {getMemberFunctionOptions().find((option) => option.value === func)?.label || func}
            </Chip>
          ))}
        </div>
      );

    default:
      return null;
  }
}
