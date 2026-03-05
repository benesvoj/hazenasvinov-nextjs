import React from 'react';

import {describe, it, expect, vi, beforeEach} from 'vitest';

import {Genders} from '@/enums';
import {act, render, screen} from '@/test/utils';

import {GenderSelect} from '../GenderSelect';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let capturedOnSelectionChange: ((keys: Set<string>) => void) | undefined;

vi.mock('@heroui/react', () => ({
  Select: ({
    selectedKeys,
    onSelectionChange,
    label,
    isDisabled,
    isRequired,
    disallowEmptySelection,
    className,
    children,
  }: any) => {
    capturedOnSelectionChange = onSelectionChange;
    const selectedKey = Array.from(selectedKeys ?? [])[0] as string | undefined;

    return (
      <div data-testid="choice-wrapper" className={className}>
        {label && <label>{label}</label>}
        <div
          data-testid="choice-select"
          data-disabled={isDisabled ? 'true' : undefined}
          data-selected={selectedKey ?? ''}
          data-required={isRequired ? 'true' : undefined}
          data-disallow-empty={disallowEmptySelection ? 'true' : undefined}
        >
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

describe('GenderSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnSelectionChange = undefined;
  });

  // -------------------------------------------------------------------------
  describe('Rendering', () => {
    it('renders male and female options', () => {
      render(<GenderSelect value={Genders.MALE} onChange={vi.fn()} />);
      const items = screen.getAllByTestId('choice-item');
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent('Muž');
      expect(items[1]).toHaveTextContent('Žena');
    });

    it('renders a visible label "Pohlaví"', () => {
      render(<GenderSelect value={Genders.MALE} onChange={vi.fn()} />);
      expect(screen.getByText('Pohlaví')).toBeInTheDocument();
    });

    it('marks the select as required', () => {
      render(<GenderSelect value={Genders.MALE} onChange={vi.fn()} />);
      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-required', 'true');
    });

    it('disallows empty selection', () => {
      render(<GenderSelect value={Genders.MALE} onChange={vi.fn()} />);
      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-disallow-empty', 'true');
    });

    it('passes selected value to the select', () => {
      render(<GenderSelect value={Genders.FEMALE} onChange={vi.fn()} />);
      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-selected', 'female');
    });

    it('renders as disabled when isDisabled is true', () => {
      render(<GenderSelect value={Genders.MALE} onChange={vi.fn()} isDisabled />);
      expect(screen.getByTestId('choice-select')).toHaveAttribute('data-disabled', 'true');
    });

    it('is not disabled by default', () => {
      render(<GenderSelect value={Genders.MALE} onChange={vi.fn()} />);
      expect(screen.getByTestId('choice-select')).not.toHaveAttribute('data-disabled');
    });

    it('forwards className prop', () => {
      const {container} = render(
        <GenderSelect value={Genders.MALE} onChange={vi.fn()} className="my-class" />
      );
      expect(screen.getByTestId('choice-wrapper')).toHaveClass('my-class');
    });
  });

  // -------------------------------------------------------------------------
  describe('onChange', () => {
    it('calls onChange with MALE when male is selected', () => {
      const onChange = vi.fn();
      render(<GenderSelect value={Genders.FEMALE} onChange={onChange} />);

      act(() => {
        capturedOnSelectionChange?.(new Set([Genders.MALE]));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(Genders.MALE);
    });

    it('calls onChange with FEMALE when female is selected', () => {
      const onChange = vi.fn();
      render(<GenderSelect value={Genders.MALE} onChange={onChange} />);

      act(() => {
        capturedOnSelectionChange?.(new Set([Genders.FEMALE]));
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(Genders.FEMALE);
    });

    it('does not call onChange on mount', () => {
      const onChange = vi.fn();
      render(<GenderSelect value={Genders.MALE} onChange={onChange} />);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
