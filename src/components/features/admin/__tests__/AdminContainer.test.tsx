import React from 'react';

import userEvent from '@testing-library/user-event';
import {describe, it, expect, vi, beforeEach} from 'vitest';

import {AdminContainer} from '@/components';
import {ActionTypes} from '@/enums';
import {render, screen} from '@/test/utils';
import {ActionsProps, TabConfig} from '@/types';

// Mock child components
vi.mock('../AdminHeader', () => ({
  AdminHeader: ({title, description, icon}: any) => (
    <div data-testid="admin-header">
      {title && <h1>{title}</h1>}
      {description && <p>{description}</p>}
      {icon && <span data-testid="header-icon">{icon}</span>}
    </div>
  ),
}));

vi.mock('../AdminActions', () => ({
  AdminActions: ({actions}: any) => (
    <div data-testid="admin-actions">
      {actions.map((action: ActionsProps, index: number) => (
        <button key={index} onClick={action.onClick} data-testid={`action-${index}`}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../AdminFilters', () => ({
  AdminFilters: ({children}: any) => <div data-testid="admin-filters">{children}</div>,
}));

vi.mock('../AdminContent', () => ({
  AdminContent: ({children}: any) => <div data-testid="admin-content">{children}</div>,
}));

vi.mock('@/components', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock HeroUI Tabs
vi.mock('@heroui/react', () => ({
  Tabs: ({children, selectedKey, onSelectionChange, 'aria-label': ariaLabel}: any) => (
    <div data-testid="tabs" aria-label={ariaLabel} data-selected-key={selectedKey}>
      <div data-testid="tabs-list">
        {React.Children.map(children, (child: any) => {
          if (child && child.props) {
            return (
              <button
                key={child.key}
                data-testid={`tab-${child.key}`}
                onClick={() => onSelectionChange?.(child.key)}
                aria-selected={selectedKey === child.key}
              >
                {child.props.title}
              </button>
            );
          }
          return null;
        })}
      </div>
      <div data-testid="tabs-content">
        {React.Children.map(children, (child: any) => {
          if (child && child.key === selectedKey) {
            return child.props.children;
          }
          return null;
        })}
      </div>
    </div>
  ),
  Tab: ({children, title}: any) => <div>{children}</div>,
}));

describe('AdminContainer', () => {
  describe('Basic Rendering', () => {
    it('should render children when no tabs provided', () => {
      render(
        <AdminContainer>
          <div>Test Content</div>
        </AdminContainer>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });

    it('should render loading spinner when loading is true', () => {
      render(<AdminContainer loading={true}>Content</AdminContainer>);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('should render header when title, description, or icon provided', () => {
      render(
        <AdminContainer title="Test Title" description="Test Description" icon={<span>Icon</span>}>
          Content
        </AdminContainer>
      );

      expect(screen.getByTestId('admin-header')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByTestId('header-icon')).toBeInTheDocument();
    });

    it('should not render header when no title, description, or icon', () => {
      render(<AdminContainer>Content</AdminContainer>);

      expect(screen.queryByTestId('admin-header')).not.toBeInTheDocument();
    });
  });

  describe('Actions and Filters (No Tabs)', () => {
    it('should render global actions when provided', () => {
      const handleClick = vi.fn();
      const actions: ActionsProps[] = [
        {label: 'Add', onClick: handleClick, variant: 'solid', buttonType: ActionTypes.CREATE},
      ];

      render(<AdminContainer actions={actions}>Content</AdminContainer>);

      expect(screen.getByTestId('admin-actions')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('should call action onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const actions: ActionsProps[] = [
        {label: 'Add', onClick: handleClick, variant: 'solid', buttonType: ActionTypes.CREATE},
      ];

      render(<AdminContainer actions={actions}>Content</AdminContainer>);

      await user.click(screen.getByText('Add'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render global filters when provided', () => {
      const filters = <input placeholder="Search..." />;

      render(<AdminContainer filters={filters}>Content</AdminContainer>);

      expect(screen.getByTestId('admin-filters')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('should render both actions and filters', () => {
      const actions: ActionsProps[] = [
        {label: 'Add', onClick: vi.fn(), variant: 'solid', buttonType: ActionTypes.CREATE},
      ];
      const filters = <input placeholder="Search..." />;

      render(
        <AdminContainer actions={actions} filters={filters}>
          Content
        </AdminContainer>
      );

      expect(screen.getByTestId('admin-actions')).toBeInTheDocument();
      expect(screen.getByTestId('admin-filters')).toBeInTheDocument();
    });

    it('should not render actions/filters section when neither provided', () => {
      render(<AdminContainer>Content</AdminContainer>);

      expect(screen.queryByTestId('admin-actions')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-filters')).not.toBeInTheDocument();
    });
  });

  describe('Tabs Rendering', () => {
    it('should render tabs when provided', () => {
      const tabs = [
        {key: 'tab1', title: 'Tab 1', content: <div>Tab 1 Content</div>},
        {key: 'tab2', title: 'Tab 2', content: <div>Tab 2 Content</div>},
      ];

      render(<AdminContainer tabs={tabs} activeTab="tab1" />);

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-tab1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-tab2')).toBeInTheDocument();
    });

    it('should render correct tab content based on activeTab', () => {
      const tabs = [
        {key: 'tab1', title: 'Tab 1', content: <div>Tab 1 Content</div>},
        {key: 'tab2', title: 'Tab 2', content: <div>Tab 2 Content</div>},
      ];

      render(<AdminContainer tabs={tabs} activeTab="tab1" />);

      expect(screen.getByText('Tab 1 Content')).toBeInTheDocument();
      expect(screen.queryByText('Tab 2 Content')).not.toBeInTheDocument();
    });

    it('should default to first tab when no activeTab provided', () => {
      const tabs = [
        {key: 'tab1', title: 'Tab 1', content: <div>Tab 1 Content</div>},
        {key: 'tab2', title: 'Tab 2', content: <div>Tab 2 Content</div>},
      ];

      render(<AdminContainer tabs={tabs} />);

      expect(screen.getByText('Tab 1 Content')).toBeInTheDocument();
    });

    it('should call onTabChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();
      const tabs = [
        {key: 'tab1', title: 'Tab 1', content: <div>Tab 1 Content</div>},
        {key: 'tab2', title: 'Tab 2', content: <div>Tab 2 Content</div>},
      ];

      render(<AdminContainer tabs={tabs} activeTab="tab1" onTabChange={handleTabChange} />);

      await user.click(screen.getByTestId('tab-tab2'));
      expect(handleTabChange).toHaveBeenCalledWith('tab2');
    });

    it('should ignore children when tabs are provided', () => {
      const tabs = [{key: 'tab1', title: 'Tab 1', content: <div>Tab Content</div>}];

      render(
        <AdminContainer tabs={tabs} activeTab="tab1">
          <div>Ignored Content</div>
        </AdminContainer>
      );

      expect(screen.getByText('Tab Content')).toBeInTheDocument();
      expect(screen.queryByText('Ignored Content')).not.toBeInTheDocument();
    });

    it('should use custom aria label for tabs', () => {
      const tabs = [{key: 'tab1', title: 'Tab 1', content: <div>Content</div>}];

      render(<AdminContainer tabs={tabs} activeTab="tab1" tabsAriaLabel="Custom tabs label" />);

      const tabsElement = screen.getByTestId('tabs');
      expect(tabsElement).toHaveAttribute('aria-label', 'Custom tabs label');
    });
  });

  describe('Tab-Specific Actions and Filters', () => {
    it('should render tab-specific actions', () => {
      const tabActions: ActionsProps[] = [
        {label: 'Tab Action', onClick: vi.fn(), variant: 'solid', buttonType: ActionTypes.CREATE},
      ];
      const tabs = [
        {key: 'tab1', title: 'Tab 1', content: <div>Content</div>, actions: tabActions},
      ];

      render(<AdminContainer tabs={tabs} activeTab="tab1" />);

      expect(screen.getByTestId('admin-actions')).toBeInTheDocument();
      expect(screen.getByText('Tab Action')).toBeInTheDocument();
    });

    it('should render tab-specific filters', () => {
      const tabs = [
        {
          key: 'tab1',
          title: 'Tab 1',
          content: <div>Content</div>,
          filters: <input placeholder="Tab Filter" />,
        },
      ];

      render(<AdminContainer tabs={tabs} activeTab="tab1" />);

      expect(screen.getByTestId('admin-filters')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tab Filter')).toBeInTheDocument();
    });

    it('should hide actions/filters when tab has none', () => {
      const globalActions: ActionsProps[] = [
        {label: 'Global', onClick: vi.fn(), variant: 'solid', buttonType: ActionTypes.CREATE},
      ];
      const tabs = [
        {key: 'tab1', title: 'Tab 1', content: <div>Content</div>}, // No actions/filters
      ];

      render(<AdminContainer actions={globalActions} tabs={tabs} activeTab="tab1" />);

      expect(screen.queryByTestId('admin-actions')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-filters')).not.toBeInTheDocument();
    });

    it('should switch actions/filters when switching tabs', async () => {
      const user = userEvent.setup();
      const tab1Actions: ActionsProps[] = [
        {label: 'Tab 1 Action', onClick: vi.fn(), variant: 'solid', buttonType: ActionTypes.CREATE},
      ];
      const tab2Actions: ActionsProps[] = [
        {label: 'Tab 2 Action', onClick: vi.fn(), variant: 'solid', buttonType: ActionTypes.CREATE},
      ];
      const tabs = [
        {key: 'tab1', title: 'Tab 1', content: <div>Tab 1</div>, actions: tab1Actions},
        {key: 'tab2', title: 'Tab 2', content: <div>Tab 2</div>, actions: tab2Actions},
      ];

      const {rerender} = render(<AdminContainer tabs={tabs} activeTab="tab1" />);
      expect(screen.getByText('Tab 1 Action')).toBeInTheDocument();

      // Switch to tab 2
      rerender(<AdminContainer tabs={tabs} activeTab="tab2" />);
      expect(screen.getByText('Tab 2 Action')).toBeInTheDocument();
      expect(screen.queryByText('Tab 1 Action')).not.toBeInTheDocument();
    });
  });

  describe('Tab Inheritance', () => {
    it('should use global actions when inheritGlobalActions is true', () => {
      const globalActions: ActionsProps[] = [
        {
          label: 'Global Action',
          onClick: vi.fn(),
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
        },
      ];
      const tabs = [
        {
          key: 'tab1',
          title: 'Tab 1',
          content: <div>Content</div>,
          inheritGlobalActions: true,
        },
      ];

      render(<AdminContainer actions={globalActions} tabs={tabs} activeTab="tab1" />);

      expect(screen.getByText('Global Action')).toBeInTheDocument();
    });

    it('should use global filters when inheritGlobalFilters is true', () => {
      const globalFilters = <input placeholder="Global Filter" />;
      const tabs = [
        {
          key: 'tab1',
          title: 'Tab 1',
          content: <div>Content</div>,
          inheritGlobalFilters: true,
        },
      ];

      render(<AdminContainer filters={globalFilters} tabs={tabs} activeTab="tab1" />);

      expect(screen.getByPlaceholderText('Global Filter')).toBeInTheDocument();
    });

    it('should prioritize inheritance over tab-specific (mixed config)', () => {
      const globalActions: ActionsProps[] = [
        {
          label: 'Global Action',
          onClick: vi.fn(),
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
        },
      ];
      const tabActions: ActionsProps[] = [
        {label: 'Tab Action', onClick: vi.fn(), variant: 'solid', buttonType: ActionTypes.CREATE},
      ];
      const tabs = [
        {
          key: 'tab1',
          title: 'Tab 1',
          content: <div>Content</div>,
          actions: tabActions,
          inheritGlobalActions: true, // Should take precedence
        },
      ];

      render(<AdminContainer actions={globalActions} tabs={tabs} activeTab="tab1" />);

      expect(screen.getByText('Global Action')).toBeInTheDocument();
      expect(screen.queryByText('Tab Action')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tabs array', () => {
      render(<AdminContainer tabs={[]}>Fallback Content</AdminContainer>);

      expect(screen.getByText('Fallback Content')).toBeInTheDocument();
    });

    it('should handle empty actions array', () => {
      render(<AdminContainer actions={[]}>Content</AdminContainer>);

      expect(screen.queryByTestId('admin-actions')).not.toBeInTheDocument();
    });

    it('should handle undefined currentTab gracefully', () => {
      const tabs = [{key: 'tab1', title: 'Tab 1', content: <div>Content</div>}];

      // Try to render with an invalid activeTab
      render(<AdminContainer tabs={tabs} activeTab="invalid-key" />);

      // With invalid key, the mock returns no content (tabs-content is empty)
      // But the tabs structure should still render
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-tab1')).toBeInTheDocument();
    });

    it('should handle tab without content', () => {
      const tabs = [{key: 'tab1', title: 'Tab 1', content: null}];

      render(<AdminContainer tabs={tabs} activeTab="tab1" />);

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('should not crash when onTabChange is not provided', async () => {
      const user = userEvent.setup();
      const tabs = [
        {key: 'tab1', title: 'Tab 1', content: <div>Content 1</div>},
        {key: 'tab2', title: 'Tab 2', content: <div>Content 2</div>},
      ];

      render(<AdminContainer tabs={tabs} activeTab="tab1" />);

      // Should not crash
      await user.click(screen.getByTestId('tab-tab2'));
    });
  });

  describe('Integration Scenarios', () => {
    it('should render complete admin page with header, actions, filters, and tabs', () => {
      const handleAction = vi.fn();
      const handleTabChange = vi.fn();
      const actions: ActionsProps[] = [
        {label: 'Add', onClick: handleAction, variant: 'solid', buttonType: ActionTypes.CREATE},
      ];
      const filters = <input placeholder="Search..." />;
      const tabs: TabConfig[] = [
        {
          key: 'list',
          title: 'List',
          content: <div>List Content</div>,
          actions: [
            {
              label: 'List Action',
              onClick: vi.fn(),
              variant: 'solid',
              buttonType: ActionTypes.CREATE,
            },
          ],
        },
        {
          key: 'stats',
          title: 'Statistics',
          content: <div>Stats Content</div>,
        },
      ];

      render(
        <AdminContainer
          title="Members"
          description="Manage members"
          icon={<span>👥</span>}
          actions={actions}
          filters={filters}
          tabs={tabs}
          activeTab="list"
          onTabChange={handleTabChange}
        />
      );

      // Header
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('Manage members')).toBeInTheDocument();

      // Tab-specific action (not global)
      expect(screen.getByText('List Action')).toBeInTheDocument();

      // Tabs
      expect(screen.getByTestId('tab-list')).toBeInTheDocument();
      expect(screen.getByTestId('tab-stats')).toBeInTheDocument();

      // Content
      expect(screen.getByText('List Content')).toBeInTheDocument();
    });

    it('should handle tab switching in real scenario', async () => {
      const user = userEvent.setup();
      const handleTabChange = vi.fn();

      const tabs: TabConfig[] = [
        {
          key: 'members',
          title: 'Members',
          content: <div>Members List</div>,
          actions: [
            {
              label: 'Add Member',
              onClick: vi.fn(),
              variant: 'solid',
              buttonType: ActionTypes.CREATE,
            },
          ],
          filters: <input placeholder="Search members..." />,
        },
        {
          key: 'statistics',
          title: 'Statistics',
          content: <div>Statistics View</div>,
        },
      ];

      const {rerender} = render(
        <AdminContainer tabs={tabs} activeTab="members" onTabChange={handleTabChange} />
      );

      // Initially on members tab
      expect(screen.getByText('Members List')).toBeInTheDocument();
      expect(screen.getByText('Add Member')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument();

      // Click statistics tab
      await user.click(screen.getByTestId('tab-statistics'));
      expect(handleTabChange).toHaveBeenCalledWith('statistics');

      // Rerender with new activeTab
      rerender(<AdminContainer tabs={tabs} activeTab="statistics" onTabChange={handleTabChange} />);

      // Now on statistics tab
      expect(screen.getByText('Statistics View')).toBeInTheDocument();
      expect(screen.queryByText('Add Member')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Search members...')).not.toBeInTheDocument();
    });
  });
});
