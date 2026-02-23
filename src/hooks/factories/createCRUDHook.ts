'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';

export interface CRUDHookConfig {
  /** Base API endpoint (e.g., '/api/committees') */
  baseEndpoint: string;
  /** Function to get endpoint by ID (e.g., (id) => `/api/committees/${id}`) */
  byIdEndpoint: (id: string) => string;
  /** Entity name for messages (e.g., "committee") */
  entityName: string;
  /** Success messages */
  messages: {
    createSuccess?: string;
    updateSuccess?: string;
    deleteSuccess?: string;
    createError?: string;
    updateError?: string;
    deleteError?: string;
  };
}

export interface CRUDHookResult<T, TInsert> {
  loading: boolean;
  error: string | null;
  create: (data: TInsert) => Promise<T | void>;
  update: (id: string, data: Partial<TInsert>) => Promise<T | void>;
  deleteItem: (id: string) => Promise<{success: boolean} | void>;
  setLoading: (loading: boolean) => void;
}

/**
 * Factory function to create CRUD operation hooks for Create, Update, Delete operations
 *
 * @architectural-layer State Management Layer
 * @see {@link https://github.com/anthropics/claude-code/blob/main/docs/architecture/LAYERED_ARCHITECTURE.md}
 * @see {@link https://github.com/anthropics/claude-code/blob/main/docs/architecture/FACTORY_PATTERNS.md}
 *
 * @description
 * Creates a custom hook that:
 * - Performs Create, Update, Delete operations via API
 * - Manages loading state during operations
 * - Shows success/error toasts automatically
 * - Returns created/updated data
 * - Handles API errors gracefully
 * - Uses optimistic error handling
 *
 * @template T - The entity type returned from API (e.g., VideoSchema)
 * @template TInsert - The type for insert operations (e.g., VideoInsert)
 *
 * @param config - Configuration for the CRUD hook
 * @param config.baseEndpoint - Base API endpoint for collection (e.g., '/api/entities/videos')
 * @param config.byIdEndpoint - Function to get endpoint by ID (e.g., (id) => `/api/entities/videos/${id}`)
 * @param config.entityName - Entity name for error messages (e.g., 'video')
 * @param config.messages - Success and error messages for each operation
 *
 * @returns A custom hook with create, update, delete functions
 *
 * @example
 * // Define CRUD hook
 * const _useVideos = createCRUDHook<VideoSchema, VideoInsert>({
 *   baseEndpoint: API_ROUTES.entities.root('videos'),
 *   byIdEndpoint: (id) => API_ROUTES.entities.byId('videos', id),
 *   entityName: 'video',
 *   messages: {
 *     createSuccess: 'Video created successfully',
 *     updateSuccess: 'Video updated successfully',
 *     deleteSuccess: 'Video deleted successfully',
 *     createError: 'Failed to create video',
 *     updateError: 'Failed to update video',
 *     deleteError: 'Failed to delete video',
 *   },
 * });
 *
 * // Wrapper for better API
 * export function useVideos() {
 *   const {create, update, deleteItem, loading} = _useVideos();
 *
 *   return {
 *     createVideo: create,
 *     updateVideo: update,
 *     deleteVideo: deleteItem,
 *     loading,
 *   };
 * }
 *
 * // Use in component
 * function VideosPage() {
 *   const {data: videos, refetch} = useFetchVideos();
 *   const {createVideo, updateVideo, deleteVideo, loading} = useVideos();
 *
 *   const handleCreate = async (formData: VideoFormData) => {
 *     const videoData = transformToInsert(formData);
 *     const created = await createVideo(videoData);
 *     if (created) {
 *       await refetch(); // Refresh the list
 *     }
 *   };
 *
 *   const handleUpdate = async (id: string, updates: Partial<VideoInsert>) => {
 *     await updateVideo(id, updates);
 *     await refetch();
 *   };
 *
 *   const handleDelete = async (id: string) => {
 *     await deleteVideo(id);
 *     await refetch();
 *   };
 *
 *   return <VideoManager onCreate={handleCreate} onUpdate={handleUpdate} onDelete={handleDelete} />;
 * }
 *
 * @example
 * // Common wrapper pattern
 * export function useVideos() {
 *   const {loading, error, create, update, deleteItem} = createCRUDHook<VideoSchema, VideoInsert>({
 *     baseEndpoint: API_ROUTES.entities.root('videos'),
 *     byIdEndpoint: (id) => API_ROUTES.entities.byId('videos', id),
 *     entityName: 'videos',
 *     messages: {  ...  },
 *   })();
 *
 *   return {
 *     loading,
 *     error,
 *     createVideo: create,
 *     updateVideo: update,
 *     deleteVideo: deleteItem,
 *   };
 * }
 *
 * @architectural-usage
 * ✅ Use when:
 * - Implementing Create, Update, Delete operations
 * - Need consistent error/success messaging
 * - Want automatic loading state management
 * - Working with RESTful API endpoints
 *
 * ❌ Don't use when:
 * - Need custom API call logic (write custom hook)
 * - Operations don't follow REST pattern
 * - Need complex transaction handling
 * - Require optimistic updates (implement separately)
 *
 * @performance
 * - Uses useCallback for stable function references
 * - Manages loading state per operation
 * - Efficient error handling with proper cleanup
 *
 * @api-contract
 * Expected API responses:
 * - POST {baseEndpoint} → {data: T, error?: string}
 * - PATCH {byIdEndpoint(id)} → {data: T, error?: string}
 * - DELETE {byIdEndpoint(id)} → {data: {success: boolean}, error?: string}
 */
export function createCRUDHook<T, TInsert>(
  config: CRUDHookConfig
): () => CRUDHookResult<T, TInsert> {
  const {baseEndpoint, byIdEndpoint, entityName, messages} = config;

  return function useCRUD(): CRUDHookResult<T, TInsert> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // CREATE
    const create = useCallback(async (data: TInsert): Promise<T | void> => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(baseEndpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || messages.createError);
        }

        showToast.success(messages.createSuccess || `${entityName} created successfully`);
        return response.data as T;
      } catch (err: any) {
        console.error(`Error creating ${entityName}:`, err);
        const errorMsg = err.message || messages.createError;
        setError(errorMsg);
        showToast.danger(errorMsg);
      } finally {
        setLoading(false);
      }
    }, []);

    // UPDATE
    const update = useCallback(async (id: string, data: Partial<TInsert>): Promise<T | void> => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(byIdEndpoint(id), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || messages.updateError);
        }

        showToast.success(messages.updateSuccess || `${entityName} updated successfully`);
        return response.data as T;
      } catch (err: any) {
        console.error(`Error updating ${entityName}:`, err);
        const errorMsg = err.message || messages.updateError;
        setError(errorMsg);
        showToast.danger(errorMsg);
      } finally {
        setLoading(false);
      }
    }, []);

    // DELETE
    const deleteItem = useCallback(async (id: string): Promise<{success: boolean} | void> => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(byIdEndpoint(id), {
          method: 'DELETE',
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || messages.deleteError);
        }

        showToast.success(messages.deleteSuccess || `${entityName} deleted successfully`);
        return {success: true};
      } catch (err: any) {
        console.error(`Error deleting ${entityName}:`, err);
        const errorMsg = err.message || messages.deleteError;
        setError(errorMsg);
        showToast.danger(errorMsg);
      } finally {
        setLoading(false);
      }
    }, []);

    return {
      loading,
      error,
      create,
      update,
      deleteItem,
      setLoading,
    };
  };
}
