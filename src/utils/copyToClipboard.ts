import {translations} from '@/lib/translations/index';

import {showToast} from '@/components';

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    showToast.success(translations.common.responseMessages.copyToClipboardSuccess);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    showToast.danger(`${translations.common.responseMessages.copyToClipboardError}: ${message}`);
  }
};
