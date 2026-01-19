/**
 * Checks if an array has items (non-empty)
 * Safely handles null and undefined values
 *
 * @template T - Type of array elements
 * @param arr - Array to check (can be null or undefined)
 * @returns true if array exists and has at least one item, false otherwise
 *
 * @example
 * ```typescript
 * // Instead of:
 * if (posts && posts.length > 0) { ... }
 *
 * // Use:
 * if (hasItems(posts)) { ... }
 *
 * // Examples:
 * hasItems([1, 2, 3])  // true
 * hasItems([])         // false
 * hasItems(null)       // false
 * hasItems(undefined)  // false
 * ```
 */
export const hasItems = <T>(arr: T[] | null | undefined): boolean => !!arr && arr.length > 0;

/**
 * Checks if an array is empty or doesn't exist
 * Safely handles null and undefined values
 *
 * @template T - Type of array elements
 * @param arr - Array to check (can be null or undefined)
 * @returns true if array is null, undefined, or has no items, false otherwise
 *
 * @example
 * ```typescript
 * // Instead of:
 * if (!users || users.length === 0) { ... }
 *
 * // Use:
 * if (isEmpty(users)) { ... }
 *
 * // Examples:
 * isEmpty([])          // true
 * isEmpty(null)        // true
 * isEmpty(undefined)   // true
 * isEmpty([1, 2, 3])   // false
 * ```
 */
export const isEmpty = <T>(arr: T[] | null | undefined): boolean => !arr || arr.length === 0;

/**
 * Safely get the first item from an array
 * Returns undefined if array is empty or doesn't exist
 *
 * @template T - Type of array elements
 * @param arr - Array to get first item from
 * @returns First item or undefined
 *
 * @example
 * ```typescript
 * // Instead of:
 * const first = users && users.length > 0 ? users[0] : undefined;
 *
 * // Use:
 * const first = firstItem(users);
 *
 * // Examples:
 * firstItem([1, 2, 3])    // 1
 * firstItem([])           // undefined
 * firstItem(null)         // undefined
 * firstItem(undefined)    // undefined
 * ```
 */
export const firstItem = <T>(arr: T[] | null | undefined): T | undefined => arr?.[0];

/**
 * Safely get the last item from an array
 * Returns undefined if array is empty or doesn't exist
 *
 * @template T - Type of array elements
 * @param arr - Array to get last item from
 * @returns Last item or undefined
 *
 * @example
 * ```typescript
 * // Instead of:
 * const last = items && items.length > 0 ? items[items.length - 1] : undefined;
 *
 * // Use:
 * const last = lastItem(items);
 *
 * // Examples:
 * lastItem([1, 2, 3])    // 3
 * lastItem([])           // undefined
 * lastItem(null)         // undefined
 * ```
 */
export const lastItem = <T>(arr: T[] | null | undefined): T | undefined =>
  arr && arr.length > 0 ? arr[arr.length - 1] : undefined;

/**
 * Get the count of items in an array
 * Returns 0 if array is null or undefined
 *
 * @template T - Type of array elements
 * @param arr - Array to count
 * @returns Number of items (0 if null/undefined)
 *
 * @example
 * ```typescript
 * // Instead of:
 * const count = items ? items.length : 0;
 *
 * // Use:
 * const count = getCount(items);
 *
 * // Examples:
 * getCount([1, 2, 3])    // 3
 * getCount([])           // 0
 * getCount(null)         // 0
 * getCount(undefined)    // 0
 * ```
 */
export const getCount = <T>(arr: T[] | null | undefined): number => arr?.length || 0;
