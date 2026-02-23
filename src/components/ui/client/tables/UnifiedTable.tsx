'use client';

import React, {useMemo, useState} from 'react';

import {
  Button,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {isEmpty} from '@/utils/arrayHelper';

import {ActionTypes} from '@/enums';
import {getDefaultActionIcon} from '@/helpers';
import {ActionConfig, ColumnType, UnifiedTableProps} from '@/types';

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
  enablePagination = true,
  rowsPerPage = 25,
  page: externalPage,
  totalPages: externalTotalPages,
  onPageChange: externalOnPageChange,
}: UnifiedTableProps<T>) {
  // Determine if using server-side or client-side pagination
  const isServerPagination = externalPage !== undefined && externalOnPageChange !== undefined;

  // Pagination state - use internal state if not controlled externally (client-side)
  const [internalPage, setInternalPage] = useState(1);
  const page = isServerPagination ? externalPage : internalPage;
  const setPage = isServerPagination ? externalOnPageChange : setInternalPage;

  // Calculate pagination based on mode
  const totalPages = isServerPagination
    ? externalTotalPages || 1
    : Math.ceil(data.length / rowsPerPage);

  const shouldShowPagination =
    enablePagination && (isServerPagination ? totalPages > 1 : data.length > rowsPerPage);

  // Paginated data (only for client-side pagination)
  const paginatedData = useMemo(() => {
    if (isServerPagination) {
      // Server-side: data is already paginated
      return data;
    }

    // Client-side: paginate locally
    if (!enablePagination || data.length <= rowsPerPage) {
      return data;
    }
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return data.slice(start, end);
  }, [data, page, rowsPerPage, enablePagination, isServerPagination]);

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
        return 'default';
      case ActionTypes.DELETE:
        return 'danger';
      case ActionTypes.READ:
        return 'default';
      case ActionTypes.BLOCKED:
        return 'success';
      case ActionTypes.UNBLOCK:
        return 'danger';
      default:
        return 'default';
    }
  };

  // Render action column
  const renderActionColumn = (item: T, column: ColumnType<T>) => {
    const actions = typeof column.actions === 'function' ? column.actions(item) : column.actions;

    if (isEmpty(actions)) return null;

    return (
      <div className="flex justify-center gap-2">
        {actions?.map((action, index) => {
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

  // Pagination for table - only show if there are more than rowsPerPage items
  const bottomContent = shouldShowPagination ? (
    <div className="flex w-full justify-center">
      <Pagination
        aria-label="Pagination controls"
        isCompact
        showControls
        showShadow
        color="default"
        page={page}
        total={totalPages}
        onChange={setPage}
      />
    </div>
  ) : undefined;

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
      bottomContent={bottomContent}
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
        items={paginatedData}
        emptyContent={emptyContent || translations.components.unifiedTable.emptyMessage}
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
