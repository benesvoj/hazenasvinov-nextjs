import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Selection,
  SortDescriptor,
} from '@heroui/react';
import {translations} from '@/lib/translations';

export type ColumnType<T = any> = {
  key: keyof T | string;
  label: React.ReactNode;
  allowsSorting?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  hideHeader?: boolean;
  isRowHeader?: boolean;
  textValue?: string;
};

export interface UnifiedTableProps<T = any> {
  columns: ColumnType<T>[];
  data: T[];
  ariaLabel: string;
  renderCell?: (item: T, columnKey: string) => React.ReactNode;
  getKey?: (item: T) => string | number;
  emptyContent?: React.ReactNode;
  isLoading?: boolean;
  loadingContent?: React.ReactNode;
  isStriped?: boolean;
  isCompact?: boolean;
  hideHeader?: boolean;
  removeWrapper?: boolean;
  selectionMode?: 'single' | 'multiple' | 'none';
  selectedKeys?: Selection;
  onSelectionChange?: (keys: Selection) => void;
  onRowAction?: (key: React.Key) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  classNames?: {
    base?: string;
    table?: string;
    thead?: string;
    tbody?: string;
    tr?: string;
    th?: string;
    td?: string;
  };
}

export default function UnifiedTable<T = any>({
  columns,
  data,
  ariaLabel,
  renderCell,
  getKey = (item: T) => (item as any).id || (item as any).key || Math.random().toString(),
  emptyContent,
  isLoading = false,
  loadingContent,
  isStriped = false,
  isCompact = false,
  hideHeader = false,
  removeWrapper = false,
  selectionMode = 'none',
  selectedKeys,
  onSelectionChange,
  onRowAction,
  sortDescriptor,
  onSortChange,
  classNames,
}: UnifiedTableProps<T>) {
  const t = translations.unifiedTable;

  // Default cell renderer that uses getKeyValue for simple data access
  const defaultRenderCell = (item: T, columnKey: string): React.ReactNode => {
    const value = (item as any)[columnKey];
    return value !== undefined && value !== null ? String(value) : '-';
  };

  const cellRenderer = renderCell || defaultRenderCell;

  return (
    <Table
      aria-label={ariaLabel}
      isStriped={isStriped}
      isCompact={isCompact}
      hideHeader={hideHeader}
      removeWrapper={removeWrapper}
      selectionMode={selectionMode}
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
      onRowAction={onRowAction}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      classNames={classNames}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={String(column.key)}
            allowsSorting={column.allowsSorting}
            align={column.align}
            width={column.width as any}
            minWidth={column.minWidth as any}
            maxWidth={column.maxWidth as any}
            hideHeader={column.hideHeader}
            isRowHeader={column.isRowHeader}
            textValue={column.textValue}
          >
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={data}
        emptyContent={emptyContent || t.emptyMessage}
        isLoading={isLoading}
        loadingContent={loadingContent}
      >
        {(item) => (
          <TableRow key={getKey(item)}>
            {(columnKey) => <TableCell>{cellRenderer(item, columnKey as string)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
