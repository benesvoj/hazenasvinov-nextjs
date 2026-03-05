import React from 'react';

import {describe, it, expect, vi, beforeEach} from 'vitest';

import {Genders} from '@/enums';
import {act, render, screen} from '@/test/utils';

import {GenderFilter} from '../GenderFilter';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let capturedOnSelectionChange: ((keys: Set<string>) => void) | undefined;

vi.mock('@heroui/react', () => ({
  Select: ({
    selectedKeys,
    onSelectionChange,
    'aria-label': ariaLabel,
    placeholder,
    isDisabled,
    className,
    children,
  }: any) => {
    capturedOnSelectionChange = onSelectionChange;
    const selectedKey = Array.from(selectedKeys ?? [])[0] as string | undefined;

    return (
      <div data-testid="choice-wrapper" className={className}>
        <div
          data-testid="choice-select"
          aria-label={ariaLabel}
          data-disabled={isDisabled ? 'true' : undefined}
          data-selected={selectedKey ?? ''}
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
// Tests
// ---------------------------------------------------------------------------

describe('GenderFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnSelectionChange = undefined;
  });

  // -------------------------------------------------------------------------
  describe('Rendering', () => {
    it('renders male and female options', () => {
      render(<GenderFilter value={null} onChange={vi.fn()} />);
      const items = screen.getAllByTestId('choice-item');
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent('Muž');
      expect(items[1]).toHaveTextContent('Žena');
    });

    it('renders placeholder "Vše" when no value is selected', () => {
      render(<GenderFilter value={null} onChange={vi.fn()} />);
      expect(screen.getByTestId('choice-placeholder')).toHaveTextContent('Vše');
    });

    it('does not render placeholder when a value is selected', () => {
      render(<GenderFilter value={Genders.MALE} onChange={vi.fn()} />);
      expect(screen.queryByTestId('choice-placeholder')).not.toBeInTheDocument();
    });

    it('sets aria-label for accessibility', () => {
      render(<GenderFilter value={null} onChange={vi.fn()} />);
      expect(screen.getByTestId('choice-select')).toHaveAttribute('aria-label', 'Pohlaví');
    });

    it('passes selected value to the select', () => {
      render(<GenderFilter value={Genders.FEMALE} onChange={vi.fn()} />);
      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-selected', 'female');
    });

    it('forwards className prop', () => {
      const {container} = render(
        <GenderFilter value={null} onChange={vi.fn()} className="my-class" />
      );
      expect(screen.getByTestId('choice-wrapper')).toHaveClass('my-class');
    });
  });

  // -------------------------------------------------------------------------
  describe('onChange', () => {
    it('calls onChange with MALE when male is selected', () => {
      const onChange = vi.fn();
      render(<GenderFilter value={null} onChange={onChange} />);

      act(() => {
        capturedOnSelectionChange?.(new Set([Genders.MALE]));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(Genders.MALE);
    });

    it('calls onChange with FEMALE when female is selected', () => {
      const onChange = vi.fn();
      render(<GenderFilter value={null} onChange={onChange} />);

      act(() => {
        capturedOnSelectionChange?.(new Set([Genders.FEMALE]));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(Genders.FEMALE);
    });

    it('calls onChange with null when selection is cleared', () => {
      const onChange = vi.fn();
      render(<GenderFilter value={Genders.MALE} onChange={onChange} />);

      act(() => {
        capturedOnSelectionChange?.(new Set([]));
      });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('does not call onChange on mount', () => {
      const onChange = vi.fn();
      render(<GenderFilter value={null} onChange={onChange} />);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
