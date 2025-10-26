# UnifiedTable Test Fixes - Pagination Changes

## Problem

After implementing server-side pagination support in `UnifiedTable`, two pagination tests were failing:

1. **"should update displayed items when page changes"** - Expected `User 1` not to be in the document after clicking "Next", but it was still there
2. **"should use controlled pagination"** - Could not find "Next" button

---

## Root Cause

The tests were written for the old **client-side-only pagination** behavior. After the pagination refactor to support both client-side and server-side modes, the component behavior changed:

### Server-Side vs Client-Side Pagination Detection

```typescript
// UnifiedTable.tsx line 53
const isServerPagination = externalPage !== undefined && externalOnPageChange !== undefined;
```

**Client-side mode:**
- No `page` or `onPageChange` props passed
- Component maintains internal pagination state
- Data is sliced locally based on `rowsPerPage`

**Server-side mode:**
- Both `page` AND `onPageChange` props passed
- Pagination is controlled externally
- Data is expected to be pre-paginated by the server
- Must also pass `totalPages` for pagination UI to show

---

## Issue 1: Page Change Test

### Original Test (Broken)
```typescript
it('should update displayed items when page changes', () => {
  const {rerender} = render(
    <UnifiedTable
      columns={mockColumns}
      data={largeDataset}
      ariaLabel="Test table"
      rowsPerPage={10}
      page={1}  // ← This triggered server-side mode!
    />
  );

  expect(screen.getByText('User 1')).toBeInTheDocument();

  // Rerender with page={2}
  rerender(
    <UnifiedTable
      columns={mockColumns}
      data={largeDataset}
      ariaLabel="Test table"
      rowsPerPage={10}
      page={2}  // ← But no onPageChange, so inconsistent state!
    />
  );

  expect(screen.queryByText('User 1')).not.toBeInTheDocument(); // ❌ FAILED
  expect(screen.getByText('User 11')).toBeInTheDocument();
});
```

**Why it failed:**
1. Test passed `page={1}` prop, but no `onPageChange`
2. `isServerPagination` = false (needs both props)
3. Component used **client-side pagination**
4. But the test was rerendering with different `page` values expecting controlled behavior
5. The internal state didn't change, so pagination stayed on page 1

### Fixed Test
```typescript
it('should update displayed items when page changes', async () => {
  // For client-side pagination, DON'T pass external page prop
  const {container} = render(
    <UnifiedTable
      columns={mockColumns}
      data={largeDataset}
      ariaLabel="Test table"
      rowsPerPage={10}  // No page prop = client-side mode
    />
  );

  // Page 1 should show User 1
  expect(screen.getByText('User 1')).toBeInTheDocument();
  expect(screen.queryByText('User 11')).not.toBeInTheDocument();

  // Click next page button (triggers internal state change)
  const pagination = screen.getByTestId('pagination');
  const nextButton = within(pagination).getByText('Next');

  await act(async () => {
    nextButton.click();
  });

  // Page 2 should show User 11, not User 1
  expect(screen.queryByText('User 1')).not.toBeInTheDocument(); // ✅ PASSES
  expect(screen.getByText('User 11')).toBeInTheDocument();
});
```

**Why it works:**
- No `page` prop = client-side pagination mode
- Clicking "Next" updates internal `internalPage` state
- Component re-renders and slices data for page 2
- Wrapped in `act()` to handle state updates properly

---

## Issue 2: Controlled Pagination Test

### Original Test (Broken)
```typescript
it('should use controlled pagination', () => {
  const onPageChange = vi.fn();

  render(
    <UnifiedTable
      columns={mockColumns}
      data={largeDataset}  // ← All 30 items
      ariaLabel="Test table"
      rowsPerPage={10}
      page={1}
      onPageChange={onPageChange}  // ← Server-side mode activated!
      // Missing totalPages!
    />
  );

  const nextButton = screen.getByText('Next');  // ❌ Not found!
  nextButton.click();

  expect(onPageChange).toHaveBeenCalledWith(2);
});
```

**Why it failed:**
1. Test passed `page` and `onPageChange`, so server-side mode was activated
2. But didn't pass `totalPages`
3. Without `totalPages`, component calculated: `totalPages = Math.ceil(30 / 10) = 3`
4. But wait... server-side mode should show `externalTotalPages || 1`
5. Since `externalTotalPages` was undefined, it defaulted to `1`
6. With `totalPages = 1`, pagination UI didn't show (line 66: `totalPages > 1` = false)
7. No "Next" button rendered

### Fixed Test
```typescript
it('should use controlled pagination', () => {
  const onPageChange = vi.fn();

  // For server-side pagination, must pass totalPages
  render(
    <UnifiedTable
      columns={mockColumns}
      data={largeDataset.slice(0, 10)}  // ✅ Server returns only page 1 data
      ariaLabel="Test table"
      rowsPerPage={10}
      page={1}
      totalPages={3}  // ✅ 30 items / 10 per page = 3 pages
      onPageChange={onPageChange}
    />
  );

  const pagination = screen.getByTestId('pagination');
  const nextButton = within(pagination).getByText('Next');
  nextButton.click();

  expect(onPageChange).toHaveBeenCalledWith(2);  // ✅ PASSES
});
```

**Why it works:**
- Correctly simulates server-side pagination behavior
- Data is pre-sliced (server only returned 10 items for page 1)
- `totalPages={3}` explicitly tells component there are 3 pages
- Pagination UI shows because `totalPages > 1`
- Clicking "Next" calls `onPageChange(2)`

---

## Key Learnings

### 1. Client-Side Pagination Tests
```typescript
// ✅ DO: Omit page prop, let component manage state internally
<UnifiedTable
  data={allData}
  rowsPerPage={10}
/>

// ❌ DON'T: Pass page without onPageChange
<UnifiedTable
  data={allData}
  rowsPerPage={10}
  page={1}  // Confusing - is this controlled or not?
/>
```

### 2. Server-Side Pagination Tests
```typescript
// ✅ DO: Pass all three props (page, totalPages, onPageChange)
<UnifiedTable
  data={paginatedData}  // Pre-sliced by server
  page={1}
  totalPages={5}
  onPageChange={handlePageChange}
/>

// ❌ DON'T: Pass page and onPageChange without totalPages
<UnifiedTable
  data={allData}
  page={1}
  onPageChange={handlePageChange}
  // Missing totalPages - will default to 1!
/>
```

### 3. React State Updates in Tests
```typescript
// ✅ DO: Wrap state-changing interactions in act()
await act(async () => {
  button.click();
});

// ❌ DON'T: Click without act() when it causes state updates
button.click();  // Will cause "not wrapped in act()" warnings
```

---

## Code Changes Summary

### Test File: `src/components/ui/tables/__tests__/UnifiedTable.test.tsx`

1. **Added `act` import** from React (line 4)
   ```typescript
   import {act} from 'react';
   ```

2. **Fixed "should update displayed items when page changes"** (lines 422-449)
   - Removed `page` prop to use client-side mode
   - Removed `rerender` approach
   - Added button click interaction
   - Wrapped click in `act()`
   - Made test `async`

3. **Fixed "should use controlled pagination"** (lines 451-472)
   - Added `totalPages={3}` prop
   - Sliced data to simulate server response: `data={largeDataset.slice(0, 10)}`
   - Added comment explaining server-side behavior

---

## Testing Checklist

- [x] All 31 tests passing
- [x] Client-side pagination works (internal state)
- [x] Server-side pagination works (controlled)
- [x] Page changes update displayed items correctly
- [x] Pagination UI shows/hides based on totalPages
- [x] No React `act()` warnings
- [x] Mock HeroUI components handle both modes

---

## Related Changes

This test fix is related to the pagination feature implemented in:
- `SERVER_SIDE_PAGINATION_IMPLEMENTATION.md` - Feature documentation
- `UnifiedTable.tsx` - Dual-mode pagination support
- `MemberTableTab.tsx` - Server-side pagination integration

---

**Fix Date:** 2025-10-21
**Status:** ✅ All tests passing
**Test Suite:** 31 tests | 31 passed

---

## Lessons for Future Test Writing

### 1. Match Test Mode to Feature Mode
If testing client-side pagination, don't pass server-side props.
If testing server-side pagination, pass all required props.

### 2. Explicitly State Test Intent
Add comments explaining which mode is being tested:
```typescript
// Testing client-side pagination (internal state)
// Testing server-side pagination (controlled)
```

### 3. Simulate Real-World Usage
Server-side tests should slice data as a real server would:
```typescript
data={items.slice((page - 1) * limit, page * limit)}
```

### 4. Always Wrap State Changes in act()
When user interactions cause React state updates, wrap in `act()`:
```typescript
await act(async () => {
  button.click();
});
```

---

## Future Improvements

### Test Coverage to Add
- [ ] Test transitioning from client-side to server-side mode
- [ ] Test error handling when `totalPages` is missing in server mode
- [ ] Test pagination with different `rowsPerPage` values
- [ ] Test pagination persists selection state

### Documentation to Create
- [ ] Add JSDoc comments to UnifiedTable props explaining modes
- [ ] Create examples folder with client-side and server-side samples
- [ ] Add Storybook stories for both pagination modes
