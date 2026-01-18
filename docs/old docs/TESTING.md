# Testing Guide

This project uses **Vitest** for testing, along with React Testing Library for component tests.

## Test Stack

- **Vitest** - Fast test runner with native ESM support
- **@testing-library/react** - Component testing utilities
- **@testing-library/jest-dom** - Custom DOM matchers
- **@testing-library/user-event** - User interaction simulation
- **MSW (Mock Service Worker)** - API mocking
- **jsdom** - DOM environment for tests

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Git Hooks

The project uses Husky to run tests automatically:

- **pre-commit**: Runs linting, formatting, and type checking on staged files
- **pre-push**: Runs all tests before pushing to ensure nothing is broken

If tests fail during push, the push will be blocked. Fix the failing tests before pushing again.

## Project Structure

```
src/
├── test/
│   ├── setup.ts              # Test setup and global mocks
│   ├── utils.tsx             # Custom render function with providers
│   └── mocks/
│       ├── handlers.ts       # MSW request handlers
│       └── server.ts         # MSW server setup
├── helpers/
│   └── __tests__/            # Tests for helper functions
├── components/
│   └── ui/
│       └── buttons/
│           └── __tests__/    # Tests for components
└── utils/
    └── __tests__/            # Tests for utilities
```

## Writing Tests

### Testing Utility Functions

Place tests in `__tests__` folders next to the files being tested.

**Example:** `src/helpers/__tests__/formatDate.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { formatDate } from '../formatDate'

describe('formatDate', () => {
  it('should format date in Czech locale', () => {
    const date = new Date('2024-03-15T10:30:00')
    const result = formatDate(date)
    expect(result).toMatch(/15\.\s*03\.\s*2024/)
  })
})
```

### Testing React Components

Use the custom render function from `src/test/utils.tsx` which includes providers.

**Example:** `src/components/ui/buttons/__tests__/ButtonWithTooltip.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { ButtonWithTooltip } from '../ButtonWithTooltip'

describe('ButtonWithTooltip', () => {
  it('should render button with tooltip', () => {
    const handlePress = vi.fn()

    render(
      <ButtonWithTooltip
        tooltip="Click me"
        onPress={handlePress}
        ariaLabel="Test button"
        isIconOnly={false}
      >
        Button Text
      </ButtonWithTooltip>
    )

    expect(screen.getByText('Button Text')).toBeInTheDocument()
  })

  it('should call onPress when clicked', async () => {
    const user = userEvent.setup()
    const handlePress = vi.fn()

    render(
      <ButtonWithTooltip
        tooltip="Click me"
        onPress={handlePress}
        ariaLabel="Test button"
        isIconOnly={false}
      >
        Click
      </ButtonWithTooltip>
    )

    await user.click(screen.getByText('Click'))
    expect(handlePress).toHaveBeenCalledTimes(1)
  })
})
```

## Mocking

### Mocking Modules

```typescript
import { vi } from 'vitest'

// Mock a module
vi.mock('@heroui/react', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}))
```

### Mocking Functions

```typescript
import { vi } from 'vitest'

// Create a mock function
const mockFn = vi.fn()

// Mock return value
mockFn.mockReturnValue('mocked value')

// Mock implementation
mockFn.mockImplementation((arg) => `result: ${arg}`)

// Check calls
expect(mockFn).toHaveBeenCalledTimes(1)
expect(mockFn).toHaveBeenCalledWith('expected arg')
```

### Mocking API Calls with MSW

Add handlers to `src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://test.supabase.co/rest/v1/matches', () => {
    return HttpResponse.json([
      { id: 1, team_home: 'Team A', team_away: 'Team B' },
    ])
  }),
]
```

## Pre-configured Mocks

The test setup includes mocks for:

- **Next.js Router** - `useRouter`, `usePathname`, `useSearchParams`, `useParams`
- **Next.js Image** - Simplified `<Image>` component
- **Environment Variables** - Supabase URL and key

## Best Practices

1. **Test behavior, not implementation** - Focus on what the user sees and does
2. **Use semantic queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Keep tests simple** - One assertion per test when possible
4. **Use descriptive test names** - Clearly state what is being tested
5. **Arrange-Act-Assert** - Structure tests clearly
6. **Clean up** - Tests are automatically cleaned up after each test

## Testing Checklist

When writing tests, consider:

- ✅ Happy path scenarios
- ✅ Error cases and edge cases
- ✅ Loading states
- ✅ User interactions (clicks, input)
- ✅ Conditional rendering
- ✅ Async operations
- ✅ Accessibility (ARIA labels, roles)

## Coverage

Generate a coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Common Testing Patterns

### Testing Async Components

```typescript
import { waitFor } from '@testing-library/react'

it('should load data', async () => {
  render(<AsyncComponent />)

  await waitFor(() => {
    expect(screen.getByText('Loaded data')).toBeInTheDocument()
  })
})
```

### Testing Forms

```typescript
import userEvent from '@testing-library/user-event'

it('should submit form', async () => {
  const user = userEvent.setup()
  const handleSubmit = vi.fn()

  render(<Form onSubmit={handleSubmit} />)

  await user.type(screen.getByLabelText('Name'), 'John')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(handleSubmit).toHaveBeenCalledWith({ name: 'John' })
})
```

### Testing with TanStack Query

The custom render function includes `QueryClientProvider` with test-friendly settings (no retries, no caching).

```typescript
import { render, screen } from '@/test/utils'

it('should fetch and display data', async () => {
  render(<ComponentWithQuery />)

  expect(screen.getByText('Loading...')).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [MSW Documentation](https://mswjs.io/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
