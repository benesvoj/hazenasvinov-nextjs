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

export const formatDateString = (dateString: string) => {
  try {
    return formatDate(new Date(dateString));
  } catch {
    return dateString;
  }
};

export const formatDateToWeekday = (dateString: string) => {
  try {
    return new Intl.DateTimeFormat('cs-CZ', {
      weekday: 'long'
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

export const formatDateToDayAndMonth = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('cs-CZ', { 
      day: 'numeric',
      month: 'numeric'
    });
  } catch {
    return dateString;
  }
}