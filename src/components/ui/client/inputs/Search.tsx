'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

import {Input} from '@heroui/react';

import {SearchIcon} from '@/lib/icons/SearchIcon';

import {useDebounce} from '@/hooks';

/**
 * Props for the SearchInput component.
 *
 * The component is fully controlled — the parent owns the search value and
 * decides what to do when it changes (filter, fetch, reset pagination, etc.).
 * When `debounceTime` is set the component manages an internal display value
 * so the input feels responsive, while `onChange` is fired only after the
 * delay. Without `debounceTime` no internal state is kept and `onChange` fires
 * on every keystroke.
 */
interface SearchProps {
  /**
   * Current search term. Must be controlled by the parent via `useState` or
   * similar. The component does not maintain its own copy of this value unless
   * `debounceTime` is set, in which case it keeps an internal display value
   * that is always in sync with — but may temporarily lead — the parent value.
   */
  value: string;

  /**
   * Called with the new value on every keystroke (no `debounceTime`) or after
   * the debounce delay (`debounceTime` set). Also called with `""` when the
   * input is cleared. The parent is responsible for updating `value` and for
   * any side-effects (API refetch, pagination reset, etc.).
   */
  onChange: (value: string) => void;

  /**
   * Optional callback fired additionally when the user presses the ✕ button.
   * Useful when clearing requires a side-effect beyond resetting the search
   * term (e.g. resetting separate pagination state).
   * `onChange("")` is always called first — the parent value is already empty
   * by the time `onClear` runs.
   */
  onClear?: () => void;

  /** Placeholder text shown inside the input when empty. */
  placeholder: string;

  /**
   * Visible label rendered above the input (HeroUI `Input` label prop).
   * When omitted the input has no visible label; provide `ariaLabel` in that
   * case to maintain accessibility.
   */
  label?: string;

  /**
   * Value for the `aria-label` attribute. Required for screen-reader
   * accessibility when `label` is not provided (i.e. placeholder-only UI).
   */
  ariaLabel?: string;

  /**
   * Debounce delay in milliseconds. When set, `onChange` is called only after
   * the user stops typing for this duration. The input display still updates
   * immediately on every keystroke.
   *
   * **When to use:** pass `debounceTime` when the caller does not debounce
   * on its own side. Hooks such as `useFetchMembersInternal` already apply a
   * 300 ms debounce internally — do not set `debounceTime` in those cases or
   * the effective delay will double.
   */
  debounceTime?: number;

  /** Additional Tailwind classes forwarded to the HeroUI `Input` wrapper. */
  className?: string;

  /** HeroUI Input size variant. Defaults to the HeroUI default (`md`). */
  size?: 'sm' | 'md' | 'lg';

  /** When `true` the input is rendered in a disabled state. */
  isDisabled?: boolean;
}

/**
 * Controlled full-text search input with a leading search icon and a clear
 * button. Designed for use across the coach and admin portals wherever a
 * server-side or client-side text filter is needed.
 *
 * ## Controlled usage (no built-in debounce)
 * Use when the caller's hook already debounces (e.g. `useFetchMembersInternal`
 * debounces the `search` option at 300 ms internally):
 * ```tsx
 * const [search, setSearch] = useState('');
 * const { data } = useFetchMembersInternal({ search });
 *
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Hledat..."
 *   ariaLabel="Hledat členy"
 * />
 * ```
 *
 * ## With built-in debounce
 * Use when there is no debounce in the data layer (e.g. plain client-side
 * filtering):
 * ```tsx
 * const [search, setSearch] = useState('');
 * const filtered = useMemo(
 *   () => members.filter(m => m.name.includes(search)),
 *   [members, search]
 * );
 *
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   debounceTime={300}
 *   placeholder="Hledat..."
 * />
 * ```
 *
 * ## With pagination reset
 * Handle reset inside `onChange` — no need for `onClear`:
 * ```tsx
 * <SearchInput
 *   value={search}
 *   onChange={(v) => { setSearch(v); goToPage(1); }}
 *   placeholder="Hledat..."
 * />
 * ```
 */
export const Search = ({
  value,
  onChange,
  onClear,
  placeholder,
  label,
  ariaLabel,
  className,
  size = 'sm',
  isDisabled,
  debounceTime,
}: SearchProps) => {
  // localValue drives the input's displayed text and is updated on every
  // keystroke regardless of debounceTime, keeping the UI responsive.
  const [localValue, setLocalValue] = useState(value);

  // Settled value used to fire onChange when debounceTime is active.
  // When debounceTime is 0/undefined, debouncedValue still updates (on the
  // next tick via setTimeout 0) but onChange is called directly from
  // handleChange so the debounce effect below is a no-op.
  const debouncedValue = useDebounce(localValue, debounceTime ?? 0);

  // Ref to onChange so the debounce effect always calls the latest version
  // without listing onChange in the effect's dep array. If onChange were in
  // the deps, any parent re-render that recreates the function (without
  // useCallback) would trigger a spurious onChange call with the current
  // debouncedValue.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Skip the initial mount run so onChange is not called with the initial
  // value (which the parent already knows).
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (debounceTime) {
      onChangeRef.current(debouncedValue);
    }
  }, [debouncedValue, debounceTime]);

  // Propagate external value changes into localValue. Covers cases where the
  // parent resets the search term (e.g. clearing all filters). When debounce
  // is active, localValue temporarily leads value — the parent update on the
  // same tick is a no-op (React bails out when new state === current state).
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (val?: string) => {
      const v = val ?? '';
      setLocalValue(v);
      // Without debounce, fire onChange immediately (fully controlled mode).
      // With debounce, the effect above picks it up after the delay.
      if (!debounceTime) {
        onChange(v);
      }
    },
    [onChange, debounceTime]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    onClear?.();
  }, [onChange, onClear]);

  return (
    <Input
      isClearable
      className={className}
      placeholder={placeholder}
      label={label}
      aria-label={ariaLabel}
      startContent={<SearchIcon />}
      value={localValue}
      onClear={handleClear}
      onValueChange={handleChange}
      size={size}
      isDisabled={isDisabled}
    />
  );
};
