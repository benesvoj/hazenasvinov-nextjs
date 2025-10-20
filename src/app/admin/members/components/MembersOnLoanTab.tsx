import {useMemo} from 'react';

import {renderOnLoanMemberCell} from '@/components/shared/members/config/memberCellRenderers';
import {getOnLoanMemberColumns} from '@/components/shared/members/config/memberTableColumns';

import {MemberTableTab} from '@/components';
import {useFetchMembersOnLoan} from '@/hooks';
import {translations} from '@/lib';
import {MemberOnLoan} from '@/types';

interface MembersOnLoanTabProps {
  categoriesData: Record<string, string> | null;
  openEdit: (member: MemberOnLoan) => void;
  openDelete: (member: MemberOnLoan) => void;
  openDetail: (member: MemberOnLoan) => void;
}

export const MembersOnLoanTab = ({
  categoriesData,
  openEdit,
  openDelete,
  openDetail,
}: MembersOnLoanTabProps) => {
  const t = translations.members;
  const {data, loading} = useFetchMembersOnLoan();

  const categories = useMemo(() => {
    if (!categoriesData) return {};
    return categoriesData;
  }, [categoriesData]);

  const columns = getOnLoanMemberColumns(t, {
    onEdit: openEdit,
    onDelete: openDelete,
    onDetail: openDetail,
  });

  const renderCell = (member: MemberOnLoan, columnKey: string) =>
    renderOnLoanMemberCell(member, columnKey, categories);

  return (
    <MemberTableTab<MemberOnLoan>
      data={data}
      loading={loading}
      columns={columns}
      renderCell={renderCell}
      ariaLabel={t.table.ariaLabel}
    />
  );
};
