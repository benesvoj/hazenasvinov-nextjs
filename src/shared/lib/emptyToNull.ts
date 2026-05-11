export function emptyToNull<T>(value: T | '' | undefined): T | null {
  if (value === '' || value === undefined) return null;
  return value;
}
