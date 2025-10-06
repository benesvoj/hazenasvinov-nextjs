import {SortDescriptor, Selection} from '@heroui/react';

import {ActionTypes, ColumnAlignType} from '@/enums';

export interface ActionConfig<T = any> {
  type: ActionTypes;
  onPress: (item: T) => void;
  icon?: React.ReactNode;
  color?: 'primary' | 'danger' | 'warning' | 'success' | 'default';
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  disabled?: (item: T) => boolean;
}

export type ColumnType<T = any> = {
  key: keyof T | string;
  label: React.ReactNode;
  allowsSorting?: boolean;
  align?: ColumnAlignType;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  hideHeader?: boolean;
  isRowHeader?: boolean;
  textValue?: string;
  isActionColumn?: boolean;
  actions?: ActionConfig<T>[];
  className?: string;
};

export interface UnifiedTableProps<T = any> {
  columns: ColumnType<T>[];
  data: T[];
  ariaLabel: string;
  renderCell?: (item: T, columnKey: string) => React.ReactNode;
  getCellColor?: (item: T, columnKey: string) => string;
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
  topContent?: React.ReactNode;
}
