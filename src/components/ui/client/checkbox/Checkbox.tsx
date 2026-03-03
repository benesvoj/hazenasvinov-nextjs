'use client';

import {Checkbox as HeroUICheckbox} from '@heroui/react';

/**
 * Props for the Checkbox component.
 *
 * The component is fully controlled — the parent owns the checked state and
 * receives change notifications via `onChange`.
 */
interface CheckboxProps {
  /**
   * Whether the checkbox is currently checked. Must be controlled by the
   * parent via `useState` or similar.
   */
  isSelected: boolean;

  /**
   * Called with the new boolean state whenever the user toggles the checkbox.
   * The parent is responsible for updating `isSelected`.
   */
  onChange: (isChecked: boolean) => void;

  /**
   * Visible label rendered next to the checkbox. When omitted the checkbox
   * has no visible label; provide `ariaLabel` in that case to maintain
   * accessibility.
   */
  label?: string;

  /**
   * Value for the `aria-label` attribute. Required for screen-reader
   * accessibility when `label` is not provided (i.e. icon-only or
   * label-free UI).
   */
  ariaLabel?: string;

  /** When `true` the checkbox is rendered in a disabled state. */
  isDisabled?: boolean;

  /** HeroUI Checkbox size variant. Defaults to the HeroUI default (`md`). */
  size?: 'sm' | 'md' | 'lg';

  /** Additional Tailwind classes forwarded to the HeroUI `Checkbox` wrapper. */
  className?: string;

  /** When `true` the checkbox is marked as required (e.g. inside a form). */
  isRequired?: boolean;

  /** HeroUI colour variant for the checkbox fill. Defaults to `'primary'`. */
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'default';
}

/**
 * Controlled checkbox backed by HeroUI `Checkbox`. Designed for use across
 * the coach and admin portals wherever a boolean toggle is needed.
 *
 * The component is fully controlled — the parent owns `isSelected` and
 * updates it in response to `onChange`. This mirrors the pattern used by
 * `Search` and `Choice`.
 *
 * ## Basic usage
 * ```tsx
 * const [active, setActive] = useState(false);
 *
 * <Checkbox
 *   isSelected={active}
 *   onChange={setActive}
 *   label="Aktivní člen"
 * />
 * ```
 *
 * ## With side-effects on change
 * ```tsx
 * <Checkbox
 *   isSelected={showArchived}
 *   onChange={(checked) => { setShowArchived(checked); goToPage(1); }}
 *   label="Zobrazit archivované"
 * />
 * ```
 *
 * ## Label-free (accessibility via ariaLabel)
 * ```tsx
 * <Checkbox
 *   isSelected={isRowSelected}
 *   onChange={onRowSelect}
 *   ariaLabel="Vybrat řádek"
 * />
 * ```
 */
export const Checkbox = ({
  isSelected,
  label,
  ariaLabel,
  isDisabled,
  size,
  className,
  isRequired,
  onChange,
  color,
}: CheckboxProps) => {
  return (
    <HeroUICheckbox
      isSelected={isSelected}
      aria-label={ariaLabel}
      isDisabled={isDisabled}
      size={size}
      className={className}
      isRequired={isRequired}
      onValueChange={onChange}
      color={color}
    >
      {label}
    </HeroUICheckbox>
  );
};
