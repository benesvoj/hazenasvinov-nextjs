import React from 'react';

import {describe, it, expect, vi, beforeEach} from 'vitest';

import {act, render, screen} from '@/test/utils';

import {Checkbox} from '../Checkbox';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Capture the latest onValueChange so tests can trigger it directly without
// relying on simulated DOM interactions.
let capturedOnValueChange: ((isChecked: boolean) => void) | undefined;

vi.mock('@heroui/react', () => ({
  Checkbox: ({
    isSelected,
    onValueChange,
    'aria-label': ariaLabel,
    isDisabled,
    isRequired,
    isLoading,
    size,
    className,
    color,
    children,
  }: any) => {
    capturedOnValueChange = onValueChange;

    return (
      <div className={className}>
        <input
          data-testid="checkbox-input"
          type="checkbox"
          checked={isSelected ?? false}
          aria-label={ariaLabel}
          disabled={isDisabled}
          required={isRequired}
          data-size={size}
          data-color={color}
          onChange={(e) => onValueChange?.(e.target.checked)}
        />
        {children && <label data-testid="checkbox-label">{children}</label>}
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  isSelected: false,
  onChange: vi.fn(),
};

function renderCheckbox(props: Partial<React.ComponentProps<typeof Checkbox>> = {}) {
  return render(<Checkbox {...defaultProps} {...props} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Checkbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnValueChange = undefined;
  });

  // -------------------------------------------------------------------------
  describe('Rendering', () => {
    it('renders the checkbox input', () => {
      renderCheckbox();
      expect(screen.getByTestId('checkbox-input')).toBeInTheDocument();
    });

    it('renders a visible label when provided', () => {
      renderCheckbox({label: 'Aktivní člen'});
      expect(screen.getByTestId('checkbox-label')).toHaveTextContent('Aktivní člen');
    });

    it('does not render a label element when label is omitted', () => {
      renderCheckbox();
      expect(screen.queryByTestId('checkbox-label')).not.toBeInTheDocument();
    });

    it('sets aria-label for accessibility', () => {
      renderCheckbox({ariaLabel: 'Vybrat řádek'});
      expect(screen.getByTestId('checkbox-input')).toHaveAttribute('aria-label', 'Vybrat řádek');
    });

    it('renders as checked when isSelected is true', () => {
      renderCheckbox({isSelected: true});
      expect(screen.getByTestId('checkbox-input')).toBeChecked();
    });

    it('renders as unchecked when isSelected is false', () => {
      renderCheckbox({isSelected: false});
      expect(screen.getByTestId('checkbox-input')).not.toBeChecked();
    });

    it('renders as disabled when isDisabled is true', () => {
      renderCheckbox({isDisabled: true});
      expect(screen.getByTestId('checkbox-input')).toBeDisabled();
    });

    it('renders as enabled by default', () => {
      renderCheckbox();
      expect(screen.getByTestId('checkbox-input')).not.toBeDisabled();
    });

    it('forwards className to the wrapper', () => {
      const {container} = renderCheckbox({className: 'my-class'});
      expect(container.firstChild).toHaveClass('my-class');
    });

    it('forwards the size prop', () => {
      renderCheckbox({size: 'lg'});
      expect(screen.getByTestId('checkbox-input')).toHaveAttribute('data-size', 'lg');
    });

    it('forwards the color prop', () => {
      renderCheckbox({color: 'success'});
      expect(screen.getByTestId('checkbox-input')).toHaveAttribute('data-color', 'success');
    });
  });

  // -------------------------------------------------------------------------
  describe('Controlled value', () => {
    it('updates to checked when isSelected changes to true', async () => {
      const onChange = vi.fn();
      const {rerender} = render(<Checkbox isSelected={false} onChange={onChange} />);

      expect(screen.getByTestId('checkbox-input')).not.toBeChecked();

      await act(async () => {
        rerender(<Checkbox isSelected={true} onChange={onChange} />);
      });

      expect(screen.getByTestId('checkbox-input')).toBeChecked();
    });

    it('updates to unchecked when isSelected changes to false', async () => {
      const onChange = vi.fn();
      const {rerender} = render(<Checkbox isSelected={true} onChange={onChange} />);

      await act(async () => {
        rerender(<Checkbox isSelected={false} onChange={onChange} />);
      });

      expect(screen.getByTestId('checkbox-input')).not.toBeChecked();
    });
  });

  // -------------------------------------------------------------------------
  describe('onChange', () => {
    it('calls onChange with true when the checkbox is checked', () => {
      const onChange = vi.fn();
      renderCheckbox({onChange});

      act(() => {
        capturedOnValueChange?.(true);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange with false when the checkbox is unchecked', () => {
      const onChange = vi.fn();
      renderCheckbox({onChange, isSelected: true});

      act(() => {
        capturedOnValueChange?.(false);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('does not call onChange on initial mount', () => {
      const onChange = vi.fn();
      renderCheckbox({onChange});
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
