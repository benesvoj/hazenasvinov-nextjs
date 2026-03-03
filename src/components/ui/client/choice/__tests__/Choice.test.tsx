import React from 'react';

import {describe, it, expect, vi, beforeEach} from 'vitest';

import {act, render, screen} from '@/test/utils';

import {Choice, ChoiceItem} from '../Choice';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Capture the latest onSelectionChange so tests can trigger it directly
// without relying on simulated DOM interactions. This is necessary because
// HeroUI's SelectItem relies on the Collection API and does not receive `key`
// as a standard prop (React strips it before component invocation).
let capturedOnSelectionChange: ((keys: Set<string>) => void) | undefined;

vi.mock('@heroui/react', () => ({
  Select: ({
    selectedKeys,
    onSelectionChange,
    label,
    'aria-label': ariaLabel,
    placeholder,
    isDisabled,
    isLoading,
    className,
    children,
  }: any) => {
    capturedOnSelectionChange = onSelectionChange;
    const selectedKey = Array.from(selectedKeys ?? [])[0] as string | undefined;

    // Extract item keys from children via React.Children.toArray, which
    // preserves the React-internal key (prefixed with ".$").
    const itemKeys = React.Children.toArray(children).map((child: any) =>
      (child.key as string).replace(/^\.\$/, '')
    );

    return (
      <div className={className}>
        {label && <label>{label}</label>}
        {isLoading && <span data-testid="loading-indicator" />}
        <div
          data-testid="choice-select"
          aria-label={ariaLabel}
          data-disabled={isDisabled ? 'true' : undefined}
          data-selected={selectedKey ?? ''}
          data-items={itemKeys.join(',')}
        >
          {!selectedKey && placeholder && (
            <span data-testid="choice-placeholder">{placeholder}</span>
          )}
          {children}
        </div>
      </div>
    );
  },
  SelectItem: ({children}: any) => <div data-testid="choice-item">{children}</div>,
  SharedSelection: {},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const items: ChoiceItem[] = [
  {key: 'cat1', label: 'Kategorie 1'},
  {key: 'cat2', label: 'Kategorie 2'},
  {key: 'cat3', label: 'Kategorie 3'},
];

const defaultProps = {
  value: null as string | null,
  onChange: vi.fn<(value: string | null) => void>(),
  items,
};

function renderChoice(props: Partial<React.ComponentProps<typeof Choice>> = {}) {
  const merged = {...defaultProps, ...props} as React.ComponentProps<typeof Choice>;
  return render(<Choice {...merged} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Choice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnSelectionChange = undefined;
  });

  // -------------------------------------------------------------------------
  describe('Rendering', () => {
    it('renders the select element', () => {
      renderChoice();
      expect(screen.getByTestId('choice-select')).toBeInTheDocument();
    });

    it('renders a visible label when provided', () => {
      renderChoice({label: 'Kategorie'});
      expect(screen.getByText('Kategorie')).toBeInTheDocument();
    });

    it('does not render a label element when label is omitted', () => {
      renderChoice();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('sets aria-label for accessibility', () => {
      renderChoice({ariaLabel: 'Vyberte kategorii'});
      expect(screen.getByTestId('choice-select')).toHaveAttribute(
        'aria-label',
        'Vyberte kategorii'
      );
    });

    it('renders as disabled when isDisabled is true', () => {
      renderChoice({isDisabled: true});
      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-disabled', 'true');
    });

    it('does not set data-disabled when isDisabled is false', () => {
      renderChoice({isDisabled: false});
      expect(screen.getByTestId('choice-select')).not.toHaveAttribute('data-disabled');
    });

    it('forwards className to the wrapper', () => {
      const {container} = renderChoice({className: 'my-class'});
      expect(container.firstChild).toHaveClass('my-class');
    });

    it('renders the loading indicator when isLoading is true', () => {
      renderChoice({isLoading: true});
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('does not render the loading indicator by default', () => {
      renderChoice();
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    it('renders all provided items', () => {
      renderChoice();
      const renderedItems = screen.getAllByTestId('choice-item');
      expect(renderedItems).toHaveLength(3);
      expect(renderedItems[0]).toHaveTextContent('Kategorie 1');
      expect(renderedItems[1]).toHaveTextContent('Kategorie 2');
      expect(renderedItems[2]).toHaveTextContent('Kategorie 3');
    });

    it('renders an empty list when items is empty', () => {
      renderChoice({items: []});
      expect(screen.queryByTestId('choice-item')).not.toBeInTheDocument();
    });

    it('passes item keys to the Select via children', () => {
      renderChoice();
      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-items', 'cat1,cat2,cat3');
    });

    it('renders placeholder when value is null', () => {
      renderChoice({placeholder: 'Vyberte kategorii'});
      expect(screen.getByTestId('choice-placeholder')).toHaveTextContent('Vyberte kategorii');
    });

    it('does not render placeholder when an item is selected', () => {
      renderChoice({value: 'cat1', placeholder: 'Vyberte kategorii'});
      expect(screen.queryByTestId('choice-placeholder')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  describe('Controlled value', () => {
    it('passes empty selectedKeys when value is null', () => {
      renderChoice({value: null});
      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-selected', '');
    });

    it('passes the selected key when value is provided', () => {
      renderChoice({value: 'cat2'});
      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-selected', 'cat2');
    });

    it('updates the selected key when value prop changes externally', async () => {
      const onChange = vi.fn();
      const {rerender} = render(<Choice value="cat1" onChange={onChange} items={items} />);

      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-selected', 'cat1');

      await act(async () => {
        rerender(<Choice value="cat2" onChange={onChange} items={items} />);
      });

      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-selected', 'cat2');
    });

    it('clears the selected key when value prop changes to null', async () => {
      const onChange = vi.fn();
      const {rerender} = render(<Choice value="cat1" onChange={onChange} items={items} />);

      await act(async () => {
        rerender(<Choice value={null} onChange={onChange} items={items} />);
      });

      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-selected', '');
    });
  });

  // -------------------------------------------------------------------------
  describe('onChange', () => {
    it('calls onChange with the selected item key', () => {
      const onChange = vi.fn();
      renderChoice({onChange});

      act(() => {
        capturedOnSelectionChange?.(new Set(['cat1']));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('cat1');
    });

    it('calls onChange with null when selection is cleared (empty set)', () => {
      const onChange = vi.fn();
      renderChoice({onChange, value: 'cat1'});

      act(() => {
        capturedOnSelectionChange?.(new Set([]));
      });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('calls onChange with the new key when selection changes from one item to another', () => {
      const onChange = vi.fn();
      renderChoice({onChange, value: 'cat1'});

      act(() => {
        capturedOnSelectionChange?.(new Set(['cat3']));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('cat3');
    });

    it('does not call onChange on initial mount', () => {
      const onChange = vi.fn();
      renderChoice({onChange});
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
