# AdminContainer Tests

## Overview
Comprehensive test suite for the `AdminContainer` component with **29 test cases** covering all functionality.

## Test Coverage

### 1. Basic Rendering (4 tests)
- ✅ Renders children when no tabs provided
- ✅ Shows loading spinner when `loading={true}`
- ✅ Renders header with title, description, and icon
- ✅ Hides header when none of title/description/icon provided

### 2. Actions and Filters - No Tabs Mode (5 tests)
- ✅ Renders global actions
- ✅ Calls action `onClick` handler
- ✅ Renders global filters
- ✅ Renders both actions and filters together
- ✅ Hides actions/filters section when neither provided

### 3. Tabs Rendering (6 tests)
- ✅ Renders tabs structure with all tabs
- ✅ Shows correct tab content based on `activeTab`
- ✅ Defaults to first tab when no `activeTab` provided
- ✅ Calls `onTabChange` when tab is clicked
- ✅ Ignores `children` prop when tabs are provided
- ✅ Uses custom `tabsAriaLabel`

### 4. Tab-Specific Actions and Filters (4 tests)
- ✅ Renders tab-specific actions
- ✅ Renders tab-specific filters
- ✅ Hides actions/filters when tab has none
- ✅ Switches actions/filters when switching tabs

### 5. Tab Inheritance (3 tests)
- ✅ Uses global actions when `inheritGlobalActions: true`
- ✅ Uses global filters when `inheritGlobalFilters: true`
- ✅ Prioritizes inheritance over tab-specific (mixed config)

### 6. Edge Cases (5 tests)
- ✅ Handles empty tabs array
- ✅ Handles empty actions array
- ✅ Handles undefined/invalid activeTab gracefully
- ✅ Handles tab without content
- ✅ Doesn't crash when `onTabChange` is not provided

### 7. Integration Scenarios (2 tests)
- ✅ Renders complete admin page with all features
- ✅ Handles realistic tab switching workflow

## Running Tests

```bash
# Run all tests
npm run test

# Run AdminContainer tests only
npm run test:run -- src/components/features/admin/__tests__/AdminContainer.test.tsx

# Run tests in watch mode
npm run test -- src/components/features/admin/__tests__/AdminContainer.test.tsx

# Run with coverage
npm run test:coverage -- src/components/features/admin/__tests__/AdminContainer.test.tsx

# Run tests with UI
npm run test:ui
```

## Test Structure

```typescript
describe('AdminContainer', () => {
  describe('Basic Rendering', () => { ... });
  describe('Actions and Filters (No Tabs)', () => { ... });
  describe('Tabs Rendering', () => { ... });
  describe('Tab-Specific Actions and Filters', () => { ... });
  describe('Tab Inheritance', () => { ... });
  describe('Edge Cases', () => { ... });
  describe('Integration Scenarios', () => { ... });
});
```

## Key Testing Patterns

### 1. Component Mocking
```typescript
// Mock child components for isolation
vi.mock('../AdminHeader', () => ({
  AdminHeader: ({title, description, icon}: any) => (
    <div data-testid="admin-header">
      {title && <h1>{title}</h1>}
      {description && <p>{description}</p>}
      {icon && <span data-testid="header-icon">{icon}</span>}
    </div>
  ),
}));
```

### 2. User Interactions
```typescript
// Test user interactions with userEvent
const user = userEvent.setup();
await user.click(screen.getByTestId('tab-statistics'));
expect(handleTabChange).toHaveBeenCalledWith('statistics');
```

### 3. State Changes
```typescript
// Test component behavior with state changes
const {rerender} = render(<AdminContainer activeTab="tab1" />);
rerender(<AdminContainer activeTab="tab2" />);
expect(screen.getByText('Tab 2 Content')).toBeInTheDocument();
```

### 4. Conditional Rendering
```typescript
// Test that elements show/hide correctly
expect(screen.queryByTestId('admin-actions')).not.toBeInTheDocument();
```

## What's Tested

### ✅ Functionality
- Component rendering
- Props handling
- User interactions
- State management
- Conditional rendering
- Event handlers
- Default values
- Edge cases

### ✅ Tab System
- Tab rendering
- Tab switching
- Active tab state
- Tab content display
- Tab-specific actions/filters
- Global action/filter inheritance
- Mixed configurations

### ✅ Actions & Filters
- Global actions/filters (no tabs mode)
- Tab-specific actions/filters
- Inheritance from global
- Priority rules (inheritance > tab-specific)
- Hiding when not provided

### ✅ Edge Cases
- Empty arrays
- Undefined values
- Invalid activeTab
- Missing callbacks
- Null content

## Example Test Cases

### Example 1: Basic Rendering
```typescript
it('should render children when no tabs provided', () => {
  render(
    <AdminContainer>
      <div>Test Content</div>
    </AdminContainer>
  );

  expect(screen.getByText('Test Content')).toBeInTheDocument();
});
```

### Example 2: Tab Switching
```typescript
it('should call onTabChange when tab is clicked', async () => {
  const user = userEvent.setup();
  const handleTabChange = vi.fn();
  const tabs = [
    {key: 'tab1', title: 'Tab 1', content: <div>Content 1</div>},
    {key: 'tab2', title: 'Tab 2', content: <div>Content 2</div>},
  ];

  render(
    <AdminContainer
      tabs={tabs}
      activeTab="tab1"
      onTabChange={handleTabChange}
    />
  );

  await user.click(screen.getByTestId('tab-tab2'));
  expect(handleTabChange).toHaveBeenCalledWith('tab2');
});
```

### Example 3: Tab Inheritance
```typescript
it('should use global actions when inheritGlobalActions is true', () => {
  const globalActions = [
    {label: 'Global Action', onClick: vi.fn(), ...}
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
```

## Dependencies

- **Vitest**: Test runner
- **@testing-library/react**: React component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom matchers

## Maintenance

### Adding New Tests
1. Identify the feature/scenario to test
2. Add a new `it()` block in the appropriate `describe()` section
3. Follow existing patterns for mocking and assertions
4. Run tests to verify they pass

### Updating Tests
When modifying AdminContainer component:
1. Update relevant tests
2. Add new tests for new features
3. Ensure all tests pass before committing

### Common Issues

**Issue**: Tests fail after component changes
**Solution**: Update mocks to match new component structure

**Issue**: Async interactions not working
**Solution**: Use `userEvent.setup()` and `await` interactions

**Issue**: Element not found
**Solution**: Check `data-testid` attributes and query methods

## Best Practices

1. ✅ Use `data-testid` for stable selectors
2. ✅ Test user behavior, not implementation
3. ✅ Mock external dependencies
4. ✅ Test edge cases and error states
5. ✅ Keep tests isolated and independent
6. ✅ Use descriptive test names
7. ✅ Follow AAA pattern (Arrange, Act, Assert)

## Coverage Goals

- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: > 90%
- **Statement Coverage**: > 90%

## Related Documentation

- [AdminContainer Component](../AdminContainer.tsx)
- [AdminContainer Types](../../../../types/components/adminContainer.ts)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Docs](https://vitest.dev/)
