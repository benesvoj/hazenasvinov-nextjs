import {useMemo} from 'react';

import {renderExternalMemberCell} from '@/components/shared/members/config/memberCellRenderers';
import {getExternalMemberColumns} from '@/components/shared/members/config/memberTableColumns';

import {MemberTableTab} from '@/components';
import {useFetchMembersExternal} from '@/hooks';
import {translations} from '@/lib';
import {MemberExternal} from '@/types';

interface MembersExternalTabProps {
  categoriesData: Record<string, string> | null;
  openEdit: (member: MemberExternal) => void;
  openDelete: (member: MemberExternal) => void;
  openDetail: (member: MemberExternal) => void;
}

export const MembersExternalTab = ({
  categoriesData,
  openEdit,
  openDelete,
  openDetail,
}: MembersExternalTabProps) => {
  const t = translations.members;
  const {data, loading} = useFetchMembersExternal();

  const categories = useMemo(() => {
    if (!categoriesData) return {};
    return categoriesData; // Already in correct format
  }, [categoriesData]);

  const columns = getExternalMemberColumns(t, {
    onEdit: openEdit,
    onDelete: openDelete,
    onDetail: openDetail,
  });

  const renderCell = (member: MemberExternal, columnKey: string) =>
    renderExternalMemberCell(member, columnKey, categories);

  return (
    <MemberTableTab<MemberExternal>
      data={data}
      loading={loading}
      columns={columns}
      renderCell={renderCell}
      ariaLabel={t.table.ariaLabel}
    />
  );
};
