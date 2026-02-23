import {addToast} from '@heroui/toast';

import {ToastOptions} from '@/types';

// Toast types for consistent usage across the system
export type ToastType = 'success' | 'danger' | 'warning';

// Default toast configurations
const toastConfigs = {
  success: {
    color: 'success' as const,
    title: 'Úspěch',
    duration: 5000,
  },
  danger: {
    color: 'danger' as const,
    title: 'Chyba',
    duration: 7000,
  },
  warning: {
    color: 'warning' as const,
    title: 'Upozornění',
    duration: 6000,
  },
};

/**
 * Utility for showing toasts with predefined types and options.
 * Each method accepts a description and optional overrides for the toast configuration.
 * Example usage:
 * showToast.success('Data byla úspěšně uložena!');
 * showToast.danger('Nastala chyba při ukládání dat.', { duration: 10000 });
 * showToast.warning('Tato akce může mít nečekané důsledky.', { title: 'Varování' });
 */
export const showToast = {
  success: (description: string, options?: Partial<ToastOptions>) => {
    return addToast({
      ...toastConfigs.success,
      ...options,
      description,
    });
  },

  danger: (description: string, options?: Partial<ToastOptions>) => {
    return addToast({
      ...toastConfigs.danger,
      ...options,
      description,
    });
  },

  warning: (description: string, options?: Partial<ToastOptions>) => {
    return addToast({
      ...toastConfigs.warning,
      ...options,
      description,
    });
  },

  // Generic method for custom toasts
  custom: (type: ToastType, description: string, options?: Partial<ToastOptions>) => {
    return addToast({
      ...toastConfigs[type],
      ...options,
      description,
    });
  },
};

// React hook for easy usage in components
export const useToast = () => {
  return showToast;
};

// Default export for direct usage
export default showToast;
