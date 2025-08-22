export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatTimeString(timeString: string): string {
  // Handle time strings like "16:00:00" or "16:00"
  if (!timeString) return '';
  
  // Remove seconds if present and return HH:MM format
  return timeString.split(':').slice(0, 2).join(':');
}
