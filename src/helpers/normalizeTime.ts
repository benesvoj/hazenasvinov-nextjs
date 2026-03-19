export function normalizeMatchTime(time?: string | null): string {
  if (!time) return '00:00';
  const parts = time.split(':');
  const hours = parts[0] ?? '00';
  const minutes = parts[1] ?? '00';
  return `${hours}:${minutes}`;
}
