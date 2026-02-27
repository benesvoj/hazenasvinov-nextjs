import {translations} from '@/lib/translations/index';

import {MemberTableTab, renderInternalMemberCell} from '@/components';
import {useFetchMembersInternal} from '@/hooks';
import {Category, MemberInternal, MemberTableFilters} from '@/types';

import {getInternalMemberColumns} from './config/memberTableColumns';
import {useCategoryMap} from './hooks/useCategoryMap';

interface MembersInternalSectionProps {
  // Data context
  categoryId?: string; // filter by category (coach portal)
  categoriesData: Category[] | null;

  // Search & filter (optional — coach portal may not expose all)
  searchTerm?: string;
  filters?: MemberTableFilters;

  // Actions (all optional — caller decides which are available)
  onPayment?: (member: MemberInternal) => void;
  onDelete?: (member: MemberInternal) => void;
  onEdit?: (member: MemberInternal) => void;

  // Selection (admin-only feature)
  enableSelection?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;

  // Aria
  ariaLabel: string;
}

export const MembersInternalSection = ({
  categoryId,
  categoriesData,
  searchTerm,
  filters,
  onPayment,
  onDelete,
  onEdit,
  enableSelection,
  selectedItems,
  onSelectionChange,
  ariaLabel,
}: MembersInternalSectionProps) => {
  const {data, loading, pagination, goToPage} = useFetchMembersInternal({
    search: searchTerm,
    filters: {...filters, category_id: categoryId ?? filters?.category_id},
  });

  const categories = useCategoryMap(categoriesData);
  const t = translations.members;

  const columns = getInternalMemberColumns(t, {
    onPayment: onPayment ?? (() => {}),
    onDelete: onDelete ?? (() => {}),
    onEdit: onEdit ?? (() => {}),
  });

  const renderCell = (member: MemberInternal, columnKey: string) =>
    renderInternalMemberCell(member, columnKey, categories);

  return (
    <MemberTableTab<MemberInternal>
      data={data}
      loading={loading}
      columns={columns}
      renderCell={renderCell}
      enableSelection={enableSelection}
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      pagination={pagination}
      onPageChange={goToPage}
      ariaLabel={ariaLabel}
    />
  );
};
