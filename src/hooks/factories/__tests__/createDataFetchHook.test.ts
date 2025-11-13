import {act} from 'react';

import {renderHook, waitFor} from '@testing-library/react';
import {beforeEach, afterEach, describe, it, expect, vi} from 'vitest';

import {createDataFetchHook} from '@/hooks/factories';

// Mock showToast
vi.mock('@/components', () => ({
	showToast: {
		danger: vi.fn(),
		success: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
	},
}));

describe('createDataFetchHook', () => {
	// Reset mocks before each test
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn() as any;
	});

	// Clean up after each test
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Basic Functionality', () => {
		it('should fetch data on mount', async () => {
			const mockData = [{id: '1', name: 'Test'}];
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({data: mockData}),
			});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed to fetch',
			});

			const {result} = renderHook(() => useFetch());

			// Should start loading
			expect(result.current.loading).toBe(true);
			expect(result.current.data).toEqual([]);
			expect(result.current.error).toBeNull();

			// Wait for fetch to complete
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// Verify final state
			expect(result.current.data).toEqual(mockData);
			expect(result.current.error).toBeNull();
			expect(global.fetch).toHaveBeenCalledTimes(1);
			expect(global.fetch).toHaveBeenCalledWith('/api/test', {
				signal: expect.any(AbortSignal),
			});
		});

		it('should handle empty data array', async () => {
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({data: []}),
			});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.data).toEqual([]);
			expect(result.current.error).toBeNull();
		});

		it('should handle missing data property in response', async () => {
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({}), // No data property
			});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.data).toEqual([]);
		});
	});

	describe('Error Handling', () => {
		it('should handle network errors', async () => {
			const {showToast} = await import('@/components');
			(global.fetch as any).mockRejectedValue(new Error('Network error'));

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed to fetch',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.error).toBe('Network error');
			});

			expect(result.current.loading).toBe(false);
			expect(result.current.data).toEqual([]);
			expect(showToast.danger).toHaveBeenCalledWith('Network error');
		});

		it('should handle non-200 HTTP responses', async () => {
			const {showToast} = await import('@/components');
			(global.fetch as any).mockResolvedValue({
				ok: false,
				json: async () => ({error: 'Not found'}),
			});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed to fetch',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.error).toBe('Not found');
			});

			expect(showToast.danger).toHaveBeenCalledWith('Not found');
		});

		it('should use default error message if response has no error', async () => {
			(global.fetch as any).mockResolvedValue({
				ok: false,
				json: async () => ({}),
			});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Default error message',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.error).toBe('Default error message');
			});
		});

		it('should not show toast when showErrorToast is false', async () => {
			const {showToast} = await import('@/components');
			(global.fetch as any).mockRejectedValue(new Error('Test error'));

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
				showErrorToast: false,
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.error).toBe('Test error');
			});

			// Toast should NOT be shown
			expect(showToast.danger).not.toHaveBeenCalled();
		});
	});

	describe('Refetch Functionality', () => {
		it('should refetch data when refetch is called', async () => {
			const mockData1 = [{id: '1', name: 'First'}];
			const mockData2 = [{id: '2', name: 'Second'}];

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({data: mockData1}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({data: mockData2}),
				});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			// Wait for initial fetch
			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.data).toEqual(mockData1);

			// Call refetch
			await act(async () => {
				await result.current.refetch();
			});

			// Verify refetch occurred
			expect(result.current.data).toEqual(mockData2);
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		it('should clear error on successful refetch', async () => {
			(global.fetch as any)
				.mockRejectedValueOnce(new Error('First error'))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({data: [{id: '1'}]}),
				});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			// Wait for error
			await waitFor(() => {
				expect(result.current.error).toBe('First error');
			});

			// Refetch successfully
			await act(async () => {
				await result.current.refetch();
			});

			// Error should be cleared
			expect(result.current.error).toBeNull();
			expect(result.current.data).toHaveLength(1);
		});
	});

	describe('Request Cancellation', () => {
		it('should cancel pending request on unmount', async () => {
			const abortSpy = vi.fn();
			const mockAbortController = {
				abort: abortSpy,
				signal: new AbortController().signal,
			};

			global.AbortController = vi.fn(() => mockAbortController) as any;

			// Create a promise that never resolves (simulates slow request)
			(global.fetch as any).mockReturnValue(new Promise(() => {}));

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {unmount} = renderHook(() => useFetch());

			// Unmount before fetch completes
			unmount();

			// Verify abort was called
			expect(abortSpy).toHaveBeenCalled();
		});

		it('should cancel previous request when refetch is called', async () => {
			const abortSpy = vi.fn();
			let abortController: any;

			// Mock AbortController to track calls
			global.AbortController = vi.fn(() => {
				abortController = {
					abort: abortSpy,
					signal: new AbortController().signal,
				};
				return abortController;
			}) as any;

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({data: []}),
			});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// Call refetch (should abort previous request)
			await act(async () => {
				await result.current.refetch();
			});

			// Abort should be called when starting new request
			expect(abortSpy).toHaveBeenCalled();
		});

		it('should ignore abort errors', async () => {
			const {showToast} = await import('@/components');
			const abortError = new Error('Aborted');
			abortError.name = 'AbortError';

			(global.fetch as any).mockRejectedValue(abortError);

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// Error should NOT be set for abort
			expect(result.current.error).toBeNull();
			// Toast should NOT be shown
			expect(showToast.danger).not.toHaveBeenCalled();
		});
	});

	describe('fetchOnMount Configuration', () => {
		it('should not fetch on mount when fetchOnMount is false', async () => {
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({data: []}),
			});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
				fetchOnMount: false,
			});

			const {result} = renderHook(() => useFetch());

			// Should not be loading
			expect(result.current.loading).toBe(false);
			// Fetch should not have been called
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('should allow manual refetch when fetchOnMount is false', async () => {
			const mockData = [{id: '1', name: 'Test'}];
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({data: mockData}),
			});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
				fetchOnMount: false,
			});

			const {result} = renderHook(() => useFetch());

			// Initially no data
			expect(result.current.data).toEqual([]);
			expect(global.fetch).not.toHaveBeenCalled();

			// Manually trigger fetch
			await act(async () => {
				await result.current.refetch();
			});

			// Now data should be loaded
			expect(result.current.data).toEqual(mockData);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});
	});

	describe('Loading States', () => {
		it('should set loading to true during fetch', async () => {
			let resolveFetch: any;
			const fetchPromise = new Promise((resolve) => {
				resolveFetch = resolve;
			});

			(global.fetch as any).mockReturnValue(fetchPromise);

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			// Should be loading
			expect(result.current.loading).toBe(true);

			// Resolve fetch
			act(() => {
				resolveFetch({
					ok: true,
					json: async () => ({data: []}),
				});
			});

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});
		});

		it('should set loading to false after error', async () => {
			(global.fetch as any).mockRejectedValue(new Error('Error'));

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			expect(result.current.error).toBeTruthy();
		});
	});

	describe('Race Conditions', () => {
		it('should handle multiple rapid refetch calls', async () => {
			const mockData1 = [{id: '1'}];
			const mockData2 = [{id: '2'}];
			const mockData3 = [{id: '3'}];

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({data: mockData1}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({data: mockData2}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({data: mockData3}),
				});

			const useFetch = createDataFetchHook({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// Trigger multiple rapid refetches
			await act(async () => {
				await Promise.all([
					result.current.refetch(),
					result.current.refetch(),
					result.current.refetch(),
				]);
			});

			// Should have called fetch for initial + 3 refetches
			expect(global.fetch).toHaveBeenCalledTimes(4);
			expect(result.current.loading).toBe(false);
		});
	});

	describe('Type Safety', () => {
		it('should work with typed data', async () => {
			interface TestEntity {
				id: string;
				name: string;
				value: number;
			}

			const mockData: TestEntity[] = [{id: '1', name: 'Test', value: 42}];

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({data: mockData}),
			});

			const useFetch = createDataFetchHook<TestEntity>({
				endpoint: '/api/test',
				entityName: 'test',
				errorMessage: 'Failed',
			});

			const {result} = renderHook(() => useFetch());

			await waitFor(() => {
				expect(result.current.loading).toBe(false);
			});

			// TypeScript should infer correct type
			expect(result.current.data).toEqual(mockData);
			expect(result.current.data[0].name).toBe('Test');
			expect(result.current.data[0].value).toBe(42);
		});
	});
});
