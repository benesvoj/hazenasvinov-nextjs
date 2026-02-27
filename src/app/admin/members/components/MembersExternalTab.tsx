import {renderExternalMemberCell} from '@/components/shared/members/config/memberCellRenderers';
import {getExternalMemberColumns} from '@/components/shared/members/config/memberTableColumns';
import {useCategoryMap} from '@/components/shared/members/hooks/useCategoryMap';

import {translations} from '@/lib/translations/index';

import {MemberTableTab} from '@/components';
import {useFetchMembersExternal} from '@/hooks';
import {MemberExternal} from '@/types';

interface MembersExternalTabProps {
  categoriesData: Record<string, string> | null;
  openEdit: (member: MemberExternal) => void;
  openDelete: (member: MemberExternal) => void;
}

export const MembersExternalTab = ({
  categoriesData,
  openEdit,
  openDelete,
}: MembersExternalTabProps) => {
  const t = translations.members;
  const {data, loading} = useFetchMembersExternal();

  const categories = useCategoryMap(categoriesData);

  const columns = getExternalMemberColumns(t, {
    onEdit: openEdit,
    onDelete: openDelete,
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
