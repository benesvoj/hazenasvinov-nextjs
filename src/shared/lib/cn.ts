import {clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';

/**
 * Combines multiple class names into a single string, merging tailwind classes where necessary.
 *
 * @param {...any[]} inputs - An array of class name inputs, which can include strings, objects, or arrays.
 * @return {string} A single string representing the merged and combined class names.
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
