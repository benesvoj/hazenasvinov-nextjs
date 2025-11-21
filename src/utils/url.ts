import {showToast} from '@/components';
/**
 * Build URL with query parameters
 * @param baseUrl - Base API route URL
 * @param params - Query parameters object
 * @returns URL with query string
 */
export function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return baseUrl;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    showToast.success('URL videa zkopírována do schránky');
    setTimeout(() => 2000);
  } catch (err) {
    console.error('Failed to copy URL:', err);
    showToast.danger('Nepodařilo se zkopírovat URL');
  }
};

export const playUrl = (url: string) => {
  window.open(url, '_blank');
};

export function extractYoutubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
}

export const isValidYouTubeUrl = (url: string): boolean => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
  return regex.test(url);
};
