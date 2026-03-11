'use client';

import {Select, SelectItem, SharedSelection} from '@heroui/react';

export interface ChoiceItem {
  key: string;
  label: string;
}

interface BaseChoiceProps {
  /** Options rendered inside the select dropdown. */
  items: ChoiceItem[];

  /**
   * Visible label rendered above the select (HeroUI `Select` label prop).
   * When omitted the select has no visible label; provide `ariaLabel` in
   * that case to maintain accessibility.
   */
  label?: string;

  /**
   * Value for the `aria-label` attribute. Required for screen-reader
   * accessibility when `label` is not provided (i.e. label-free UI).
   */
  ariaLabel?: string;

  /** Placeholder text shown when no item is selected. */
  placeholder?: string;

  /** Additional Tailwind classes forwarded to the HeroUI `Select` wrapper. */
  className?: string;

  /** HeroUI Select size variant. Defaults to the HeroUI default (`md`). */
  size?: 'sm' | 'md' | 'lg';

  /** When `true` the select is rendered in a disabled state. */
  isDisabled?: boolean;

  /** When `true` the select shows a loading indicator. */
  isLoading?: boolean;

  /** When `true` the select is marked as required (adds `aria-required`). */
  isRequired?: boolean;

  /** Optional description text rendered below the select. */
  description?: string;

  /** When `true` the user can clear the selection. */
  isClearable?: boolean;
}

/**
 * Props for the Choice component.
 *
 * The union enforces a compile-time contract between `disallowEmptySelection`,
 * `value`, and `onChange`:
 * - When `disallowEmptySelection` is `true`, `value` must be `string` (never
 *   `null`) and `onChange` receives `string` — the caller is guaranteed a
 *   value is always present.
 * - Otherwise `value` may be `string | null` and `onChange` receives
 *   `string | null` to handle the cleared state.
 */
type ChoiceProps = BaseChoiceProps &
  (
    | {
        /**
         * Prevents the user from clearing the selection. Once an item is chosen
         * it cannot be deselected. Use when an empty state is invalid (e.g. a
         * required category filter).
         *
         * When `true`, `value` must be `string` and `onChange` receives `string`.
         */
        disallowEmptySelection: true;
        /** Currently selected key. Must never be `null` when `disallowEmptySelection` is set. */
        value: string;
        /** Called with the newly selected key. Never called with `null`. */
        onChange: (value: string) => void;
      }
    | {
        disallowEmptySelection?: false;
        /**
         * Key of the currently selected item, or `null` when nothing is selected.
         * Must be controlled by the parent via `useState` or similar.
         */
        value: string | null;
        /**
         * Called with the key of the newly selected item, or `null` when the
         * selection is cleared. The parent is responsible for updating `value` and
         * for any side-effects (API refetch, pagination reset, etc.).
         */
        onChange: (value: string | null) => void;
      }
  );

/**
 * Controlled single-select dropdown backed by HeroUI `Select`. Designed for
 * use across the coach and admin portals wherever a categorical filter or
 * option picker is needed.
 *
 * The component is fully controlled — the parent owns `value` and updates it
 * in response to `onChange`. This mirrors the pattern used by `Search`.
 *
 * ## Basic usage (nullable)
 * ```tsx
 * const [categoryId, setCategoryId] = useState<string | null>(null);
 *
 * <Choice
 *   value={categoryId}
 *   onChange={setCategoryId}
 *   items={categories.map(c => ({ key: c.id, label: c.name }))}
 *   label="Kategorie"
 *   placeholder="Vyberte kategorii"
 * />
 * ```
 *
 * ## Required selection (never null)
 * Use `disallowEmptySelection` when an empty state is invalid. TypeScript
 * enforces `value: string` and `onChange: (value: string) => void`:
 * ```tsx
 * const [categoryId, setCategoryId] = useState<string>(defaultCategoryId);
 *
 * <Choice
 *   disallowEmptySelection
 *   value={categoryId}
 *   onChange={setCategoryId}
 *   items={categories.map(c => ({ key: c.id, label: c.name }))}
 *   label="Kategorie"
 * />
 * ```
 *
 * ## With side-effects on change
 * ```tsx
 * <Choice
 *   value={categoryId}
 *   onChange={(id) => { setCategoryId(id); goToPage(1); }}
 *   items={items}
 *   ariaLabel="Vyberte kategorii"
 * />
 * ```
 */
export const Choice = (props: ChoiceProps) => {
  const {
    value,
    onChange,
    items,
    label,
    ariaLabel,
    placeholder,
    className,
    size = 'sm',
    isDisabled,
    isLoading,
    isRequired,
    description,
    disallowEmptySelection,
    isClearable,
  } = props;

  const handleSelectionChange = (keys: SharedSelection) => {
    const key = Array.from(keys)[0] as string | undefined;
    if (disallowEmptySelection) {
      // HeroUI guarantees a key is always present when disallowEmptySelection
      // is true — the user cannot deselect the current item.
      (onChange as (value: string) => void)(key!);
    } else {
      (onChange as (value: string | null) => void)(key ?? null);
    }
  };

  return (
    <Select
      className={className}
      label={label}
      placeholder={placeholder}
      description={description}
      size={size}
      aria-label={ariaLabel}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isRequired={isRequired}
      disallowEmptySelection={disallowEmptySelection}
      selectedKeys={value ? [value] : []}
      onSelectionChange={handleSelectionChange}
      isClearable={isClearable}
    >
      {items.map((item) => (
        <SelectItem key={item.key}>{item.label}</SelectItem>
      ))}
    </Select>
  );
};
