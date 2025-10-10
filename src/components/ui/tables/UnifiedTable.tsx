import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Button,
} from '@heroui/react';

import {translations} from '@/lib/translations';

import {ActionTypes} from '@/enums';
import {getDefaultActionIcon} from '@/helpers';
import {UnifiedTableProps, ColumnType, ActionConfig} from '@/types';

export default function UnifiedTable<T = any>({
  columns,
  data,
  ariaLabel,
  renderCell,
  getCellColor,
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
  topContent,
}: UnifiedTableProps<T>) {
  const t = translations.unifiedTable;

  // Default cell renderer that uses getKeyValue for simple data access
  const defaultRenderCell = (item: T, columnKey: string): React.ReactNode => {
    const value = (item as any)[columnKey];
    return value !== undefined && value !== null ? String(value) : '-';
  };

  const cellRenderer = renderCell || defaultRenderCell;

  // Default icons for action types
  const getDefaultIcon = (type: ActionTypes) => {
    return getDefaultActionIcon(type);
  };

  // Default colors for action types
  const getDefaultColor = (type: ActionTypes): ActionConfig['color'] => {
    switch (type) {
      case ActionTypes.UPDATE:
        return 'primary';
      case ActionTypes.DELETE:
        return 'danger';
      case ActionTypes.READ:
        return 'primary';
      default:
        return 'default';
    }
  };

  // Render action column
  const renderActionColumn = (item: T, column: ColumnType<T>) => {
    if (!column.actions || column.actions.length === 0) return null;

    return (
      <div className="flex justify-center gap-2">
        {column.actions.map((action, index) => {
          const isDisabled = action.disabled ? action.disabled(item) : false;
          const icon = action.icon || getDefaultIcon(action.type);
          const color = action.color || getDefaultColor(action.type);

          return (
            <Button
              key={`${action.type}-${index}`}
              size={action.size || 'sm'}
              variant={action.variant || 'light'}
              color={color}
              isIconOnly
              isDisabled={isDisabled}
              title={action.title}
              onPress={() => action.onPress(item)}
            >
              {icon}
            </Button>
          );
        })}
      </div>
    );
  };

  // Enhanced cell renderer that handles action columns
  const enhancedCellRenderer = (item: T, columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);

    if (column?.isActionColumn && column.actions) {
      return renderActionColumn(item, column);
    }

    return cellRenderer(item, columnKey);
  };

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
      topContent={topContent}
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
            className={column.className}
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
            {(columnKey) => {
              const cellColor = getCellColor?.(item, columnKey as string);
              const column = columns.find((col) => col.key === columnKey);
              const cellClassName = [cellColor ? `text-${cellColor}` : undefined, column?.className]
                .filter(Boolean)
                .join(' ');

              return (
                <TableCell className={cellClassName || undefined}>
                  {enhancedCellRenderer(item, columnKey as string)}
                </TableCell>
              );
            }}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
