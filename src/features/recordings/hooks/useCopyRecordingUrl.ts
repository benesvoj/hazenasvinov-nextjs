import {showToast} from '@/components/ui/feedback/Toast';

import {copyToClipboard} from '@/shared/browser';
import {commonCopy} from '@/shared/copy';

export const useCopyRecordingUrl = () => {
  return async (url: string) => {
    const success = await copyToClipboard(url);

    if (success) {
      showToast.success(commonCopy.messages.copyToClipboard);
    } else {
      showToast.danger(commonCopy.messages.copyToClipboardFailed);
    }
  };
};
