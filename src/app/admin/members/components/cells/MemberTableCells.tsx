import {Button, Chip} from '@heroui/react';

import {TrashIcon, PencilIcon, EyeIcon} from '@heroicons/react/24/solid';

import {getPaymentStatusColor, getPaymentStatusLabel} from '@/enums/membershipFeeStatus';

import {Genders, getMemberFunctionOptions} from '@/enums';
import {Member, MemberPaymentStatus} from '@/types';

import {StatusCell} from './StatusCell';

interface RenderCellProps {
  member: Member;
  columnKey: string;
  categories: Record<string, string>;
  getMemberPaymentStatus: (memberId: string) => MemberPaymentStatus | undefined;
  onView: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export function renderMemberCell({
  member,
  columnKey,
  categories,
  getMemberPaymentStatus,
  onView,
  onEdit,
  onDelete,
}: RenderCellProps) {
  switch (columnKey) {
    case 'status':
      return <StatusCell isActive={member.is_active} />;

    case 'registration_number':
      return <span className="font-medium">{member.registration_number || 'N/A'}</span>;

    case 'name':
      return <span className="font-medium">{member.name}</span>;

    case 'surname':
      return <span className="font-medium">{member.surname}</span>;

    case 'date_of_birth': {
      const birthDate = new Date(member.date_of_birth || '');
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return (
        <span>
          {birthDate.toLocaleDateString('cs-CZ')} ({age})
        </span>
      );
    }

    case 'category':
      return categories[member.category_id || ''] || 'N/A';

    case 'sex':
      return member.sex === Genders.MALE ? 'Muž' : 'Žena';

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
        return <span className="text-gray-500">Žádné funkce</span>;
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

    case 'actions':
      return (
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            startContent={<EyeIcon className="w-4 h-4" />}
            onPress={() => onView(member)}
          />
          <Button isIconOnly size="sm" variant="light" onPress={() => onEdit(member)}>
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onPress={() => onDelete(member)}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      );

    default:
      return null;
  }
}
