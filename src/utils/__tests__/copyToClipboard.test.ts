import {beforeEach, describe, expect, it, vi} from 'vitest';

import {translations} from '@/lib/translations/index';

import {copyToClipboard} from '@/utils/copyToClipboard';

vi.mock('@/components', () => ({
  showToast: {
    success: vi.fn(),
    danger: vi.fn(),
  },
}));

const {showToast} = await import('@/components');

const mockWriteText = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'clipboard', {
    value: {writeText: mockWriteText},
    writable: true,
    configurable: true,
  });
});

describe('copyToClipboard', () => {
  it('writes the given text to clipboard', async () => {
    mockWriteText.mockResolvedValue(undefined);

    await copyToClipboard('hello world');

    expect(mockWriteText).toHaveBeenCalledWith('hello world');
  });

  it('calls showToast.success on successful copy', async () => {
    mockWriteText.mockResolvedValue(undefined);

    await copyToClipboard('hello world');

    expect(showToast.success).toHaveBeenCalledWith(
      translations.common.responseMessages.copyToClipboardSuccess
    );
    expect(showToast.danger).not.toHaveBeenCalled();
  });

  it('calls showToast.danger with Error.message when clipboard rejects with an Error', async () => {
    const error = new Error('Permission denied');
    mockWriteText.mockRejectedValue(error);

    await copyToClipboard('hello world');

    expect(showToast.danger).toHaveBeenCalledWith(
      `${translations.common.responseMessages.copyToClipboardError}: ${error.message}`
    );
    expect(showToast.success).not.toHaveBeenCalled();
  });

  it('calls showToast.danger with stringified value when clipboard rejects with a non-Error', async () => {
    mockWriteText.mockRejectedValue('network failure');

    await copyToClipboard('hello world');

    expect(showToast.danger).toHaveBeenCalledWith(
      `${translations.common.responseMessages.copyToClipboardError}: network failure`
    );
    expect(showToast.success).not.toHaveBeenCalled();
  });
});
