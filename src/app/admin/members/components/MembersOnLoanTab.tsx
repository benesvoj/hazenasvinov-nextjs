import {renderOnLoanMemberCell} from '@/components/shared/members/config/memberCellRenderers';
import {getOnLoanMemberColumns} from '@/components/shared/members/config/memberTableColumns';
import {useCategoryMap} from '@/components/shared/members/hooks/useCategoryMap';

import {translations} from '@/lib/translations/index';

import {MemberTableTab} from '@/components';
import {useFetchMembersOnLoan} from '@/hooks';
import {MemberOnLoan} from '@/types';

interface MembersOnLoanTabProps {
  categoriesData: Record<string, string> | null;
  openEdit: (member: MemberOnLoan) => void;
  openDelete: (member: MemberOnLoan) => void;
}

export const MembersOnLoanTab = ({categoriesData, openEdit, openDelete}: MembersOnLoanTabProps) => {
  const t = translations.members;
  const {data, loading} = useFetchMembersOnLoan();

  const categories = useCategoryMap(categoriesData);

  const columns = getOnLoanMemberColumns(t, {
    onEdit: openEdit,
    onDelete: openDelete,
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
