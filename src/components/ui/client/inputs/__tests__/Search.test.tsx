import React from 'react';

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

import {act, fireEvent, render, screen} from '@/test/utils';

import {Search} from '../Search';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@heroui/react', () => ({
  Input: ({
    value,
    onValueChange,
    onClear,
    placeholder,
    label,
    'aria-label': ariaLabel,
    className,
    isDisabled,
    isClearable,
    startContent,
  }: any) => (
    <div className={className}>
      {label && <label>{label}</label>}
      {startContent}
      <input
        data-testid="search-input"
        value={value ?? ''}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={isDisabled}
        onChange={(e) => onValueChange?.(e.target.value)}
      />
      {isClearable && (
        <button data-testid="clear-button" type="button" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/lib/icons/SearchIcon', () => ({
  SearchIcon: () => <span data-testid="search-icon" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  value: '',
  onChange: vi.fn(),
  placeholder: 'Hledat...',
};

function renderInput(props: Partial<React.ComponentProps<typeof Search>> = {}) {
  return render(<Search {...defaultProps} {...props} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  describe('Rendering', () => {
    it('renders the input element', () => {
      renderInput();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('renders the search icon', () => {
      renderInput();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders the clear button', () => {
      renderInput();
      expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    });

    it('displays the placeholder', () => {
      renderInput({placeholder: 'Hledat členy'});
      expect(screen.getByPlaceholderText('Hledat členy')).toBeInTheDocument();
    });

    it('renders a visible label when provided', () => {
      renderInput({label: 'Vyhledávání'});
      expect(screen.getByText('Vyhledávání')).toBeInTheDocument();
    });

    it('does not render a label element when label is omitted', () => {
      renderInput();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('sets aria-label for accessibility', () => {
      renderInput({ariaLabel: 'Hledat v seznamu'});
      expect(screen.getByRole('textbox', {name: 'Hledat v seznamu'})).toBeInTheDocument();
    });

    it('renders as disabled when isDisabled is true', () => {
      renderInput({isDisabled: true});
      expect(screen.getByTestId('search-input')).toBeDisabled();
    });

    it('renders as enabled by default', () => {
      renderInput();
      expect(screen.getByTestId('search-input')).not.toBeDisabled();
    });

    it('forwards className to the Input wrapper', () => {
      const {container} = renderInput({className: 'my-custom-class'});
      expect(container.firstChild).toHaveClass('my-custom-class');
    });
  });

  // -------------------------------------------------------------------------
  describe('Controlled value', () => {
    it('displays the initial value prop', () => {
      renderInput({value: 'novák'});
      expect(screen.getByTestId('search-input')).toHaveValue('novák');
    });

    it('updates displayed value when the value prop changes externally', async () => {
      const onChange = vi.fn();
      const {rerender} = render(
        <Search value="novák" onChange={onChange} placeholder="Hledat..." />
      );

      expect(screen.getByTestId('search-input')).toHaveValue('novák');

      await act(async () => {
        rerender(<Search value="" onChange={onChange} placeholder="Hledat..." />);
      });

      expect(screen.getByTestId('search-input')).toHaveValue('');
    });

    it('reflects intermediate typed value before parent state updates', () => {
      // The input uses localValue so the display updates immediately even
      // when the parent value prop hasn't caught up yet.
      const onChange = vi.fn();
      render(<Search value="" onChange={onChange} placeholder="Hledat..." />);

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, {target: {value: 'test'}});

      // localValue updated immediately, regardless of parent value still being "".
      expect(input).toHaveValue('test');
    });
  });

  // -------------------------------------------------------------------------
  describe('Without debounce', () => {
    it('calls onChange with the typed value on every keystroke', () => {
      const onChange = vi.fn();
      renderInput({onChange});

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, {target: {value: 'n'}});
      fireEvent.change(input, {target: {value: 'no'}});
      fireEvent.change(input, {target: {value: 'nov'}});

      expect(onChange).toHaveBeenCalledTimes(3);
      expect(onChange).toHaveBeenNthCalledWith(1, 'n');
      expect(onChange).toHaveBeenNthCalledWith(2, 'no');
      expect(onChange).toHaveBeenNthCalledWith(3, 'nov');
    });

    it('calls onChange with empty string when value is cleared via keyboard', () => {
      const onChange = vi.fn();
      renderInput({onChange, value: 'novák'});

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, {target: {value: ''}});

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('does not call onChange on initial mount', () => {
      const onChange = vi.fn();
      renderInput({onChange});
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('With debounceTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not call onChange immediately while typing', () => {
      const onChange = vi.fn();
      renderInput({onChange, debounceTime: 300});

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, {target: {value: 'novák'}});

      expect(onChange).not.toHaveBeenCalled();
    });

    it('still updates the display value immediately while debouncing', () => {
      const onChange = vi.fn();
      renderInput({onChange, debounceTime: 300});

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, {target: {value: 'novák'}});

      // localValue updates immediately — input is responsive.
      expect(input).toHaveValue('novák');
      // onChange has not fired yet.
      expect(onChange).not.toHaveBeenCalled();
    });

    it('calls onChange with the final value after the delay', async () => {
      const onChange = vi.fn();
      renderInput({onChange, debounceTime: 300});

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, {target: {value: 'novák'}});

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('novák');
    });

    it('debounces multiple rapid keystrokes into a single onChange call', async () => {
      const onChange = vi.fn();
      renderInput({onChange, debounceTime: 300});

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, {target: {value: 'n'}});
      fireEvent.change(input, {target: {value: 'no'}});
      fireEvent.change(input, {target: {value: 'nov'}});
      fireEvent.change(input, {target: {value: 'nová'}});
      fireEvent.change(input, {target: {value: 'novák'}});

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('novák');
    });

    it('does not call onChange if timer is reset before it fires', async () => {
      const onChange = vi.fn();
      renderInput({onChange, debounceTime: 300});

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, {target: {value: 'nov'}});

      // Advance only 200 ms — timer not yet fired.
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(onChange).not.toHaveBeenCalled();

      // New keystroke resets the timer.
      fireEvent.change(input, {target: {value: 'novák'}});

      // Advance another 300 ms — full delay from the last keystroke.
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('novák');
    });

    it('does not call onChange on mount even with debounceTime set', async () => {
      const onChange = vi.fn();
      renderInput({onChange, debounceTime: 300});

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('Clear button', () => {
    it('calls onChange with empty string when clear button is pressed', () => {
      const onChange = vi.fn();
      renderInput({onChange, value: 'novák'});

      fireEvent.click(screen.getByTestId('clear-button'));

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('calls the onClear callback when clear button is pressed', () => {
      const onChange = vi.fn();
      const onClear = vi.fn();
      renderInput({onChange, onClear, value: 'novák'});

      fireEvent.click(screen.getByTestId('clear-button'));

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('calls onChange before onClear so parent value is already empty', () => {
      const callOrder: string[] = [];
      const onChange = vi.fn(() => callOrder.push('onChange'));
      const onClear = vi.fn(() => callOrder.push('onClear'));
      renderInput({onChange, onClear, value: 'novák'});

      fireEvent.click(screen.getByTestId('clear-button'));

      expect(callOrder).toEqual(['onChange', 'onClear']);
    });

    it('works without an onClear prop (optional)', () => {
      const onChange = vi.fn();
      renderInput({onChange, value: 'novák'});

      // Must not throw.
      expect(() => fireEvent.click(screen.getByTestId('clear-button'))).not.toThrow();
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('clears the displayed value after pressing the clear button', async () => {
      const onChange = vi.fn();
      const {rerender} = render(
        <Search value="novák" onChange={onChange} placeholder="Hledat..." />
      );

      fireEvent.click(screen.getByTestId('clear-button'));

      // Simulate parent updating value after onChange("") fires.
      await act(async () => {
        rerender(<Search value="" onChange={onChange} placeholder="Hledat..." />);
      });

      expect(screen.getByTestId('search-input')).toHaveValue('');
    });
  });
});
