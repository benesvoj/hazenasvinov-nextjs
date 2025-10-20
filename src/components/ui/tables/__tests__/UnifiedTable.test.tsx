import React from 'react';

import {describe, it, expect, vi, beforeEach} from 'vitest';

import {ActionTypes, ColumnAlignType} from '@/enums';
import {render, screen, within} from '@/test/utils';
import {ColumnType} from '@/types';

import UnifiedTable from '../UnifiedTable';

// Mock HeroUI components
vi.mock('@heroui/react', () => ({
  Table: ({children, 'aria-label': ariaLabel, bottomContent, topContent, ...props}: any) => (
    <div data-testid="table" aria-label={ariaLabel} {...props}>
      {topContent && <div data-testid="top-content">{topContent}</div>}
      {children}
      {bottomContent && <div data-testid="bottom-content">{bottomContent}</div>}
    </div>
  ),
  TableHeader: ({children, columns}: any) => (
    <div data-testid="table-header">
      {typeof children === 'function' ? columns.map(children) : children}
    </div>
  ),
  TableColumn: ({children, ...props}: any) => (
    <div data-testid="table-column" {...props}>
      {children}
    </div>
  ),
  TableBody: ({children, items, emptyContent, isLoading, loadingContent}: any) => {
    if (isLoading) {
      return <div data-testid="table-loading">{loadingContent || 'Loading...'}</div>;
    }
    if (!items || items.length === 0) {
      return <div data-testid="table-empty">{emptyContent}</div>;
    }
    return (
      <div data-testid="table-body">
        {typeof children === 'function' ? items.map(children) : children}
      </div>
    );
  },
  TableRow: ({children, ...props}: any) => {
    // Handle function children (used by HeroUI for column rendering)
    const columns = ['name', 'email', 'role', 'actions'];
    return (
      <div data-testid="table-row" {...props}>
        {typeof children === 'function'
          ? columns.map((key) => <div key={key}>{children(key)}</div>)
          : children}
      </div>
    );
  },
  TableCell: ({children, ...props}: any) => (
    <div data-testid="table-cell" {...props}>
      {children}
    </div>
  ),
  Button: ({children, onPress, isDisabled, title, ...props}: any) => (
    <button
      onClick={onPress}
      disabled={isDisabled}
      title={title}
      data-testid="action-button"
      {...props}
    >
      {children}
    </button>
  ),
  Pagination: ({page, total, onChange, ...props}: any) => (
    <div data-testid="pagination" data-page={page} data-total={total} {...props}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}>
        Previous
      </button>
      <span>
        Page {page} of {total}
      </span>
      <button onClick={() => onChange(page + 1)} disabled={page === total}>
        Next
      </button>
    </div>
  ),
}));

// Mock helper functions
vi.mock('@/helpers', () => ({
  getDefaultActionIcon: (type: ActionTypes) => `icon-${type}`,
}));

// Test data
interface TestItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

const mockData: TestItem[] = [
  {id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin'},
  {id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User'},
  {id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User'},
];

const mockColumns: ColumnType<TestItem>[] = [
  {key: 'name', label: 'Name', allowsSorting: true},
  {key: 'email', label: 'Email', allowsSorting: true},
  {key: 'role', label: 'Role', allowsSorting: false},
];

describe('UnifiedTable', () => {
  describe('Basic Rendering', () => {
    it('should render table with data', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          enablePagination={false}
        />
      );

      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByLabelText('Test table')).toBeInTheDocument();
      expect(screen.getByTestId('table-header')).toBeInTheDocument();
      expect(screen.getByTestId('table-body')).toBeInTheDocument();
    });

    it('should render column headers', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          enablePagination={false}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={[]}
          ariaLabel="Test table"
          emptyContent="No data available"
          enablePagination={false}
        />
      );

      expect(screen.getByTestId('table-empty')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={[]}
          ariaLabel="Test table"
          isLoading={true}
          loadingContent="Loading data..."
          enablePagination={false}
        />
      );

      expect(screen.getByTestId('table-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });
  });

  describe('Cell Rendering', () => {
    it('should render cells with default renderer', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          enablePagination={false}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should use custom renderCell function', () => {
      const customRenderCell = vi.fn((item: TestItem, columnKey: string) => {
        if (columnKey === 'name') {
          return <span>Custom: {item.name}</span>;
        }
        return item[columnKey as keyof TestItem];
      });

      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          renderCell={customRenderCell}
          enablePagination={false}
        />
      );

      expect(screen.getByText('Custom: John Doe')).toBeInTheDocument();
      expect(customRenderCell).toHaveBeenCalled();
    });

    it('should render "-" for null/undefined values', () => {
      const dataWithNull = [{id: '1', name: null, email: undefined, role: 'Admin'}] as any;

      render(
        <UnifiedTable
          columns={mockColumns}
          data={dataWithNull}
          ariaLabel="Test table"
          enablePagination={false}
        />
      );

      const cells = screen.getAllByTestId('table-cell');
      const dashCells = cells.filter((cell) => cell.textContent === '-');
      expect(dashCells.length).toBeGreaterThan(0);
    });
  });

  describe('Action Column', () => {
    const columnsWithActions: ColumnType<TestItem>[] = [
      ...mockColumns,
      {
        key: 'actions',
        label: 'Actions',
        align: ColumnAlignType.CENTER,
        isActionColumn: true,
        actions: [
          {
            type: ActionTypes.UPDATE,
            onPress: vi.fn(),
            title: 'Edit',
          },
          {
            type: ActionTypes.DELETE,
            onPress: vi.fn(),
            title: 'Delete',
            color: 'danger',
          },
        ],
      },
    ];

    it('should render action buttons', () => {
      render(
        <UnifiedTable
          columns={columnsWithActions}
          data={mockData}
          ariaLabel="Test table"
          enablePagination={false}
        />
      );

      const actionButtons = screen.getAllByTestId('action-button');
      // 2 actions per row * 3 rows = 6 buttons
      expect(actionButtons).toHaveLength(6);
    });

    it('should call action handler when button clicked', async () => {
      const onEdit = vi.fn();
      const columnsWithHandler: ColumnType<TestItem>[] = [
        ...mockColumns,
        {
          key: 'actions',
          label: 'Actions',
          isActionColumn: true,
          actions: [
            {
              type: ActionTypes.UPDATE,
              onPress: onEdit,
              title: 'Edit',
            },
          ],
        },
      ];

      render(
        <UnifiedTable
          columns={columnsWithHandler}
          data={mockData}
          ariaLabel="Test table"
          enablePagination={false}
        />
      );

      const editButtons = screen.getAllByTitle('Edit');
      editButtons[0].click();

      expect(onEdit).toHaveBeenCalledWith(mockData[0]);
    });

    it('should disable action button when disabled function returns true', () => {
      const columnsWithDisabledAction: ColumnType<TestItem>[] = [
        ...mockColumns,
        {
          key: 'actions',
          label: 'Actions',
          isActionColumn: true,
          actions: [
            {
              type: ActionTypes.DELETE,
              onPress: vi.fn(),
              title: 'Delete',
              disabled: (item) => item.role === 'Admin',
            },
          ],
        },
      ];

      render(
        <UnifiedTable
          columns={columnsWithDisabledAction}
          data={mockData}
          ariaLabel="Test table"
          enablePagination={false}
        />
      );

      const deleteButtons = screen.getAllByTitle('Delete');
      // First row is Admin, should be disabled
      expect(deleteButtons[0]).toBeDisabled();
      // Other rows should be enabled
      expect(deleteButtons[1]).not.toBeDisabled();
    });
  });

  describe('Pagination', () => {
    // Generate 30 items for pagination testing
    const largeDataset = Array.from({length: 30}, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: i % 2 === 0 ? 'Admin' : 'User',
    }));

    it('should show pagination when data length > rowsPerPage', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={largeDataset}
          ariaLabel="Test table"
          rowsPerPage={25}
        />
      );

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-content')).toBeInTheDocument();
    });

    it('should not show pagination when data length <= rowsPerPage', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData} // Only 3 items
          ariaLabel="Test table"
          rowsPerPage={25}
        />
      );

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should not show pagination when enablePagination is false', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={largeDataset}
          ariaLabel="Test table"
          enablePagination={false}
        />
      );

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should show correct page count', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={largeDataset} // 30 items
          ariaLabel="Test table"
          rowsPerPage={10} // Should be 3 pages
        />
      );

      const pagination = screen.getByTestId('pagination');
      expect(pagination).toHaveAttribute('data-total', '3');
    });

    it('should display only items for current page', () => {
      const {container} = render(
        <UnifiedTable
          columns={mockColumns}
          data={largeDataset}
          ariaLabel="Test table"
          rowsPerPage={10}
        />
      );

      const rows = screen.getAllByTestId('table-row');
      // Should show 10 rows (page 1)
      expect(rows).toHaveLength(10);

      // First row should be "User 1"
      expect(screen.getByText('User 1')).toBeInTheDocument();
      // Should not show "User 11" (that's on page 2)
      expect(screen.queryByText('User 11')).not.toBeInTheDocument();
    });

    it('should update displayed items when page changes', () => {
      const {rerender} = render(
        <UnifiedTable
          columns={mockColumns}
          data={largeDataset}
          ariaLabel="Test table"
          rowsPerPage={10}
          page={1}
        />
      );

      expect(screen.getByText('User 1')).toBeInTheDocument();

      // Change to page 2
      rerender(
        <UnifiedTable
          columns={mockColumns}
          data={largeDataset}
          ariaLabel="Test table"
          rowsPerPage={10}
          page={2}
        />
      );

      expect(screen.queryByText('User 1')).not.toBeInTheDocument();
      expect(screen.getByText('User 11')).toBeInTheDocument();
    });

    it('should use controlled pagination', () => {
      const onPageChange = vi.fn();

      render(
        <UnifiedTable
          columns={mockColumns}
          data={largeDataset}
          ariaLabel="Test table"
          rowsPerPage={10}
          page={1}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByText('Next');
      nextButton.click();

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Sorting', () => {
    it('should pass sortDescriptor to Table', () => {
      const sortDescriptor = {column: 'name', direction: 'ascending' as const};

      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          sortDescriptor={sortDescriptor}
          enablePagination={false}
        />
      );

      // Verify table is rendered (prop is passed internally)
      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should accept onSortChange callback', () => {
      const onSortChange = vi.fn();

      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          onSortChange={onSortChange}
          enablePagination={false}
        />
      );

      // Verify table is rendered (callback is passed internally to HeroUI component)
      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should support single selection mode', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          selectionMode="single"
          enablePagination={false}
        />
      );

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should support multiple selection mode', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          selectionMode="multiple"
          enablePagination={false}
        />
      );

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should accept onSelectionChange callback', () => {
      const onSelectionChange = vi.fn();

      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
          enablePagination={false}
        />
      );

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom classNames', () => {
      const classNames = {
        base: 'custom-base',
        table: 'custom-table',
      };

      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          classNames={classNames}
          enablePagination={false}
        />
      );

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should apply getCellColor function', () => {
      const getCellColor = vi.fn((item: TestItem, columnKey: string) => {
        if (columnKey === 'role' && item.role === 'Admin') {
          return 'red-500';
        }
        return 'green-500';
      });

      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          getCellColor={getCellColor}
          enablePagination={false}
        />
      );

      expect(getCellColor).toHaveBeenCalled();
    });
  });

  describe('Table Props', () => {
    it('should accept isStriped prop', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          isStriped={true}
          enablePagination={false}
        />
      );

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should accept isCompact prop', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          isCompact={true}
          enablePagination={false}
        />
      );

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should accept hideHeader prop', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          hideHeader={true}
          enablePagination={false}
        />
      );

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });

    it('should accept removeWrapper prop', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          removeWrapper={true}
          enablePagination={false}
        />
      );

      const table = screen.getByTestId('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Top Content', () => {
    it('should render topContent when provided', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          topContent={<div data-testid="custom-top-content">Custom Top Content</div>}
          enablePagination={false}
        />
      );

      expect(screen.getByTestId('custom-top-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Top Content')).toBeInTheDocument();
    });
  });

  describe('Key Generation', () => {
    it('should use default getKey for items with id', () => {
      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          enablePagination={false}
        />
      );

      const rows = screen.getAllByTestId('table-row');
      expect(rows).toHaveLength(3);
    });

    it('should use custom getKey function', () => {
      const getKey = vi.fn((item: TestItem) => `custom-${item.id}`);

      render(
        <UnifiedTable
          columns={mockColumns}
          data={mockData}
          ariaLabel="Test table"
          getKey={getKey}
          enablePagination={false}
        />
      );

      expect(getKey).toHaveBeenCalled();
    });
  });
});
