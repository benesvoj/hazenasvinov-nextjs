# Hook Factory Pattern Refactoring - Committees Example

**Document Version:** 1.0
**Created:** November 12, 2025
**Target Entity:** Committees
**Estimated Effort:** 8-12 hours

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Hook Factory Pattern Explained](#hook-factory-pattern-explained)
4. [Target Architecture](#target-architecture)
5. [Step-by-Step Refactoring Plan](#step-by-step-refactoring-plan)
6. [Before & After Comparison](#before--after-comparison)
7. [Testing Strategy](#testing-strategy)
8. [Rollout & Validation](#rollout--validation)

---

## Overview

This document provides a detailed plan to refactor the **Committees** page and its hooks using the **Hook Factory Pattern**. This pattern reduces code duplication by creating reusable factory functions that generate standardized hooks.

### Why Committees?

Committees is an ideal candidate for this refactoring because:
- **Simple entity:** Clear CRUD operations without complex business logic
- **Low risk:** Used only in admin portal, limited user impact
- **Representative:** Follows the same pattern as 30+ other entities
- **Proof of concept:** Success here validates the pattern for broader adoption

### Goals

1. Reduce code duplication by ~60% in data fetching hooks
2. Standardize error handling across all hooks
3. Make it easier to add new entities in the future
4. Maintain backward compatibility (no breaking changes to components)

### Current vs Target

| Aspect | Current | Target |
|--------|---------|--------|
| **Lines of Code** | ~120 lines (3 hook files) | ~40 lines (using factory) |
| **Error Handling** | Inconsistent across hooks | Standardized via factory |
| **Type Safety** | Manual typing per hook | Automatic via generics |
| **Testing** | Test each hook individually | Test factory once, hooks inherit |
| **Maintainability** | Duplicate code | DRY principle |

---

## Current State Analysis

### File Structure

```
/src/app/admin/committees/
└── page.tsx (199 lines)

/src/hooks/entities/committee/
├── data/
│   └── useFetchCommittees.ts (45 lines)
└── state/
    ├── useCommittees.ts (121 lines)
    └── useCommitteeForm.ts (75 lines)

/src/app/api/committees/
├── route.ts (34 lines) - GET, POST
└── [id]/
    └── route.ts (64 lines) - GET, PATCH, DELETE
```

**Total:** 538 lines of code

---

### Current Hook Implementation

#### 1. useFetchCommittees (Data Fetching)

**File:** `/src/hooks/entities/committee/data/useFetchCommittees.ts`

```typescript
'use client';

import {useEffect, useState} from 'react';
import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {Committee} from '@/types';

const t = translations.admin.committees.responseMessages;

export function useFetchCommittees() {
  const [data, setData] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.committees.root);
      const response = await res.json();

      setData(response.data || []);
    } catch (error) {
      console.error(t.committeesFetchFailed, error);
      setError(t.committeesFetchFailed);
      showToast.danger(t.committeesFetchFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

**Issues:**
- ❌ Manual state management (data, loading, error)
- ❌ Hardcoded error messages
- ❌ Duplicate pattern across 30+ entities
- ❌ No request cancellation on unmount
- ❌ No caching

---

#### 2. useCommittees (CRUD Operations)

**File:** `/src/hooks/entities/committee/state/useCommittees.ts`

```typescript
'use client';

import {useCallback, useState} from 'react';
import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {Committee, CommitteeInsert} from '@/types';

export function useCommittees() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations.admin.committees;

  // Add new committee
  const createCommittee = useCallback(async (data: CommitteeInsert) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.committees.root, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Failed to add committee');
      }

      showToast.success('Komise byla úspěšně přidána');
      setCommittees((prev) => [...prev, response.data]);
      return response;
    } catch (error) {
      console.error('Error adding committee:', error);
      showToast.danger('Chyba při přidávání komise');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update committee
  const updateCommittee = useCallback(
    async (id: string, data: Partial<CommitteeInsert>) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_ROUTES.committees.byId(id), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Update failed');
        }

        showToast.success('Komise byla úspěšně aktualizována');
        setCommittees((prev) => prev.map((cat) => (cat.id ? response.data : cat)));
        return response;
      } catch (error) {
        console.error('Error updating committee:', error);
        showToast.danger('Chyba při aktualizaci komise');
      } finally {
        setLoading(false);
      }
    }, []);

  // Delete committee
  const deleteCommittee = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.committees.byId(id), {
        method: 'DELETE',
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Delete failed');
      }

      showToast.success('Komise byla úspěšně smazána');
      setCommittees((prev) => prev.filter((cat) => cat.id !== id));
      return {success: true};
    } catch (error) {
      console.error('Error deleting committee:', error);
      showToast.danger('Chyba při mazání komise');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    committees,
    loading,
    error,
    createCommittee,
    updateCommittee,
    deleteCommittee,
    setLoading,
  };
}
```

**Issues:**
- ❌ 121 lines of repetitive code
- ❌ Same pattern repeated for create/update/delete
- ❌ Hardcoded toast messages
- ❌ No TypeScript generics
- ❌ Duplicate error handling

---

#### 3. useCommitteeForm (Form State)

**File:** `/src/hooks/entities/committee/state/useCommitteeForm.ts`

```typescript
'use client';
import {useCallback, useState} from 'react';
import {ModalMode} from '@/enums';
import {translations} from '@/lib';
import {Committee, CommitteeFormData} from '@/types';

const initialFormData: CommitteeFormData = {
  code: '',
  name: '',
  description: '',
  is_active: true,
  sort_order: 0,
};

export function useCommitteeForm() {
  const [formData, setFormData] = useState<CommitteeFormData>(initialFormData);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);
  const t = translations.admin.committees.responseMessages;

  const openAddMode = useCallback(() => {
    setModalMode(ModalMode.ADD);
    setSelectedCommittee(null);
    setFormData(initialFormData);
  }, []);

  const openEditMode = useCallback((committee: Committee) => {
    setModalMode(ModalMode.EDIT);
    setSelectedCommittee(committee);
    const {id, created_at, updated_at, ...editableFields} = committee;
    setFormData(editableFields);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedCommittee(null);
    setModalMode(ModalMode.ADD);
  }, []);

  const validateForm = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.code?.trim()) {
      errors.push(t.mandatoryCode);
    }
    if (!formData.name?.trim()) {
      errors.push(t.mandatoryName);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [t, formData]);

  return {
    formData,
    selectedCommittee,
    modalMode,
    setFormData,
    openAddMode,
    openEditMode,
    resetForm,
    validateForm,
  };
}
```

**Note:** This hook is specific to form management and won't be part of the factory pattern. It stays as-is.

---

## Hook Factory Pattern Explained

### Concept

Instead of writing a separate hook for each entity, we create **factory functions** that generate hooks with consistent behavior.

### Benefits

1. **Reduce Code Duplication:** Write once, use everywhere
2. **Standardized Behavior:** Same error handling, loading states, etc.
3. **Type Safety:** Generics ensure type correctness
4. **Easy Testing:** Test factory once, all hooks inherit tests
5. **Maintainability:** Fix bugs in one place

### Pattern Structure

```
/src/hooks/factories/
├── createDataFetchHook.ts      ← Factory for data fetching (GET)
├── createCRUDHook.ts            ← Factory for CRUD operations (POST/PATCH/DELETE)
└── index.ts                     ← Export all factories
```

---

## Target Architecture

### New File Structure

```
/src/hooks/factories/
├── createDataFetchHook.ts      [NEW] - Generic data fetching factory
├── createCRUDHook.ts            [NEW] - Generic CRUD operations factory
├── types.ts                     [NEW] - Shared factory types
└── index.ts                     [NEW] - Exports

/src/hooks/entities/committee/
├── data/
│   └── useFetchCommittees.ts   [REFACTORED] - Now uses factory
└── state/
    ├── useCommittees.ts         [REFACTORED] - Now uses factory
    └── useCommitteeForm.ts      [UNCHANGED] - Form-specific logic

/src/app/admin/committees/
└── page.tsx                     [UNCHANGED] - Same API
```

---

### Factory Implementation

#### 1. Data Fetch Factory

**File:** `/src/hooks/factories/createDataFetchHook.ts` [NEW]

```typescript
'use client';

import {useCallback, useEffect, useState, useRef} from 'react';
import {showToast} from '@/components';

export interface DataFetchHookConfig {
  /** API endpoint to fetch from */
  endpoint: string;
  /** Entity name for error messages (e.g., "committees", "members") */
  entityName: string;
  /** Error message for failed fetch */
  errorMessage: string;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** Whether to show toast on error (default: true) */
  showErrorToast?: boolean;
}

export interface DataFetchHookResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Factory function to create data fetching hooks
 *
 * @example
 * const useFetchCommittees = createDataFetchHook<Committee>({
 *   endpoint: API_ROUTES.committees.root,
 *   entityName: 'committees',
 *   errorMessage: 'Failed to fetch committees'
 * });
 */
export function createDataFetchHook<T>(
  config: DataFetchHookConfig
): () => DataFetchHookResult<T> {
  const {
    endpoint,
    entityName,
    errorMessage,
    fetchOnMount = true,
    showErrorToast = true,
  } = config;

  return function useDataFetch(): DataFetchHookResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(fetchOnMount);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
      try {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        const res = await fetch(endpoint, {
          signal: abortControllerRef.current.signal,
        });
        const response = await res.json();

        if (!res.ok) {
          throw new Error(response.error || errorMessage);
        }

        setData(response.data || []);
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          return;
        }

        console.error(`Error fetching ${entityName}:`, err);
        const errorMsg = err.message || errorMessage;
        setError(errorMsg);

        if (showErrorToast) {
          showToast.danger(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    }, [endpoint, entityName, errorMessage, showErrorToast]);

    useEffect(() => {
      if (fetchOnMount) {
        fetchData();
      }

      // Cleanup: abort pending requests on unmount
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [fetchData, fetchOnMount]);

    return {
      data,
      loading,
      error,
      refetch: fetchData,
    };
  };
}
```

**Key Improvements:**
- ✅ Request cancellation on unmount
- ✅ Configurable error handling
- ✅ TypeScript generics for type safety
- ✅ Reusable across all entities
- ✅ Consistent behavior

---

#### 2. CRUD Operations Factory

**File:** `/src/hooks/factories/createCRUDHook.ts` [NEW]

```typescript
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
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    createError: string;
    updateError: string;
    deleteError: string;
  };
}

export interface CRUDHookResult<T, TInsert> {
  loading: boolean;
  error: string | null;
  create: (data: TInsert) => Promise<T | void>;
  update: (id: string, data: Partial<TInsert>) => Promise<T | void>;
  deleteItem: (id: string) => Promise<{ success: boolean } | void>;
  setLoading: (loading: boolean) => void;
}

/**
 * Factory function to create CRUD operation hooks
 *
 * @example
 * const useCommittees = createCRUDHook<Committee, CommitteeInsert>({
 *   baseEndpoint: API_ROUTES.committees.root,
 *   byIdEndpoint: API_ROUTES.committees.byId,
 *   entityName: 'committee',
 *   messages: {
 *     createSuccess: 'Committee created',
 *     updateSuccess: 'Committee updated',
 *     deleteSuccess: 'Committee deleted',
 *     createError: 'Failed to create committee',
 *     updateError: 'Failed to update committee',
 *     deleteError: 'Failed to delete committee',
 *   }
 * });
 */
export function createCRUDHook<T, TInsert>(
  config: CRUDHookConfig
): () => CRUDHookResult<T, TInsert> {
  const {baseEndpoint, byIdEndpoint, entityName, messages} = config;

  return function useCRUD(): CRUDHookResult<T, TInsert> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // CREATE
    const create = useCallback(
      async (data: TInsert): Promise<T | void> => {
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

          showToast.success(messages.createSuccess);
          return response.data as T;
        } catch (err: any) {
          console.error(`Error creating ${entityName}:`, err);
          const errorMsg = err.message || messages.createError;
          setError(errorMsg);
          showToast.danger(errorMsg);
        } finally {
          setLoading(false);
        }
      },
      [baseEndpoint, entityName, messages]
    );

    // UPDATE
    const update = useCallback(
      async (id: string, data: Partial<TInsert>): Promise<T | void> => {
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

          showToast.success(messages.updateSuccess);
          return response.data as T;
        } catch (err: any) {
          console.error(`Error updating ${entityName}:`, err);
          const errorMsg = err.message || messages.updateError;
          setError(errorMsg);
          showToast.danger(errorMsg);
        } finally {
          setLoading(false);
        }
      },
      [byIdEndpoint, entityName, messages]
    );

    // DELETE
    const deleteItem = useCallback(
      async (id: string): Promise<{ success: boolean } | void> => {
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

          showToast.success(messages.deleteSuccess);
          return {success: true};
        } catch (err: any) {
          console.error(`Error deleting ${entityName}:`, err);
          const errorMsg = err.message || messages.deleteError;
          setError(errorMsg);
          showToast.danger(errorMsg);
        } finally {
          setLoading(false);
        }
      },
      [byIdEndpoint, entityName, messages]
    );

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
```

**Key Improvements:**
- ✅ Generic for any entity type
- ✅ Consistent error handling
- ✅ Configurable success/error messages
- ✅ Reusable across all entities
- ✅ Proper TypeScript typing

---

#### 3. Factory Types

**File:** `/src/hooks/factories/types.ts` [NEW]

```typescript
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}
```

---

#### 4. Factory Index

**File:** `/src/hooks/factories/index.ts` [NEW]

```typescript
export * from './createDataFetchHook';
export * from './createCRUDHook';
export * from './types';
```

---

### Refactored Hook Implementation

#### useFetchCommittees (Using Factory)

**File:** `/src/hooks/entities/committee/data/useFetchCommittees.ts` [REFACTORED]

```typescript
'use client';

import {createDataFetchHook} from '@/hooks/factories';
import {API_ROUTES, translations} from '@/lib';
import {Committee} from '@/types';

const t = translations.admin.committees.responseMessages;

/**
 * Hook for fetching committees
 * Generated using createDataFetchHook factory
 */
export const useFetchCommittees = createDataFetchHook<Committee>({
  endpoint: API_ROUTES.committees.root,
  entityName: 'committees',
  errorMessage: t.committeesFetchFailed,
});
```

**Before:** 45 lines
**After:** 16 lines
**Reduction:** 64% 🎉

---

#### useCommittees (Using Factory)

**File:** `/src/hooks/entities/committee/state/useCommittees.ts` [REFACTORED]

```typescript
'use client';

import {createCRUDHook} from '@/hooks/factories';
import {API_ROUTES, translations} from '@/lib';
import {Committee, CommitteeInsert} from '@/types';

const t = translations.admin.committees;

/**
 * Hook for managing committees (CRUD operations)
 * Generated using createCRUDHook factory
 */
const _useCommittees = createCRUDHook<Committee, CommitteeInsert>({
  baseEndpoint: API_ROUTES.committees.root,
  byIdEndpoint: API_ROUTES.committees.byId,
  entityName: 'committee',
  messages: {
    createSuccess: 'Komise byla úspěšně přidána',
    updateSuccess: 'Komise byla úspěšně aktualizována',
    deleteSuccess: 'Komise byla úspěšně smazána',
    createError: 'Chyba při přidávání komise',
    updateError: 'Chyba při aktualizaci komise',
    deleteError: 'Chyba při mazání komise',
  },
});

/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useCommittees() {
  const {loading, error, create, update, deleteItem, setLoading} = _useCommittees();

  return {
    loading,
    error,
    createCommittee: create,
    updateCommittee: update,
    deleteCommittee: deleteItem,
    setLoading,
  };
}
```

**Before:** 121 lines
**After:** 40 lines
**Reduction:** 67% 🎉

---

## Step-by-Step Refactoring Plan

### Phase 1: Create Factory Functions (2-3 hours)

#### Step 1.1: Create Directory Structure
```bash
mkdir -p src/hooks/factories
touch src/hooks/factories/createDataFetchHook.ts
touch src/hooks/factories/createCRUDHook.ts
touch src/hooks/factories/types.ts
touch src/hooks/factories/index.ts
```

#### Step 1.2: Implement createDataFetchHook
- [ ] Copy the implementation from the Target Architecture section
- [ ] Add JSDoc comments
- [ ] Test imports resolve correctly

#### Step 1.3: Implement createCRUDHook
- [ ] Copy the implementation from the Target Architecture section
- [ ] Add JSDoc comments
- [ ] Test imports resolve correctly

#### Step 1.4: Create Factory Types
- [ ] Define shared types
- [ ] Export from index

#### Step 1.5: Export All Factories
- [ ] Create index.ts with all exports
- [ ] Verify TypeScript compilation

**Deliverable:** Working factory functions

---

### Phase 2: Refactor useFetchCommittees (1-2 hours)

#### Step 2.1: Create Backup
```bash
cp src/hooks/entities/committee/data/useFetchCommittees.ts \
   src/hooks/entities/committee/data/useFetchCommittees.ts.backup
```

#### Step 2.2: Refactor Hook
- [ ] Replace implementation with factory call
- [ ] Verify TypeScript types
- [ ] Test in isolation

#### Step 2.3: Update Exports
- [ ] Ensure hook is exported correctly from index files
- [ ] Update any barrel exports

#### Step 2.4: Test in Page
- [ ] Run dev server
- [ ] Navigate to `/admin/committees`
- [ ] Verify data loads correctly
- [ ] Test refetch functionality
- [ ] Check error handling (disconnect network)

**Deliverable:** useFetchCommittees using factory

---

### Phase 3: Refactor useCommittees (2-3 hours)

#### Step 3.1: Create Backup
```bash
cp src/hooks/entities/committee/state/useCommittees.ts \
   src/hooks/entities/committee/state/useCommittees.ts.backup
```

#### Step 3.2: Refactor Hook
- [ ] Replace implementation with factory call
- [ ] Add wrapper for backward compatibility
- [ ] Verify TypeScript types

#### Step 3.3: Test CRUD Operations
- [ ] Test CREATE: Add new committee
- [ ] Test UPDATE: Edit existing committee
- [ ] Test DELETE: Delete committee
- [ ] Verify toast messages appear
- [ ] Check loading states
- [ ] Test error scenarios

**Deliverable:** useCommittees using factory

---

### Phase 4: Testing & Validation (2-3 hours)

#### Step 4.1: Manual Testing Checklist

**Data Fetching:**
- [ ] Page loads and displays committees
- [ ] Loading state shows correctly
- [ ] Error state handles network failure
- [ ] Refetch works after CRUD operations

**Create:**
- [ ] Modal opens correctly
- [ ] Form validation works
- [ ] Success toast appears
- [ ] Table updates with new item
- [ ] Error handling works

**Update:**
- [ ] Modal opens with correct data
- [ ] Form pre-fills correctly
- [ ] Success toast appears
- [ ] Table updates immediately
- [ ] Error handling works

**Delete:**
- [ ] Confirmation modal appears
- [ ] Success toast appears
- [ ] Item removed from table
- [ ] Error handling works

#### Step 4.2: Unit Tests (Optional)

Create tests for the factories:

**File:** `/src/hooks/factories/__tests__/createDataFetchHook.test.ts`

```typescript
import {renderHook, waitFor} from '@testing-library/react';
import {createDataFetchHook} from '../createDataFetchHook';

describe('createDataFetchHook', () => {
  it('should fetch data on mount', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({data: [{id: '1', name: 'Test'}]}),
    });

    const useFetch = createDataFetchHook({
      endpoint: '/api/test',
      entityName: 'test',
      errorMessage: 'Failed',
    });

    const {result} = renderHook(() => useFetch());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toHaveLength(1);
    });
  });

  it('should handle errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const useFetch = createDataFetchHook({
      endpoint: '/api/test',
      entityName: 'test',
      errorMessage: 'Failed',
    });

    const {result} = renderHook(() => useFetch());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });
});
```

#### Step 4.3: Integration Testing

Test the full flow:
- [ ] User logs in
- [ ] Navigates to committees page
- [ ] Performs all CRUD operations
- [ ] Logs out

**Deliverable:** Fully tested implementation

---

### Phase 5: Documentation & Cleanup (1 hour)

#### Step 5.1: Update Documentation
- [ ] Add JSDoc comments to wrapper functions
- [ ] Update any README files
- [ ] Document the factory pattern approach

#### Step 5.2: Code Cleanup
- [ ] Remove backup files if all tests pass
- [ ] Run linter: `npm run lint`
- [ ] Run type check: `npm run tsc`
- [ ] Format code: `npm run format`

#### Step 5.3: Create Migration Guide
Document the pattern for other developers:

**File:** `/docs/refactoring/HOOK_FACTORY_MIGRATION_GUIDE.md`

```markdown
# Hook Factory Pattern - Migration Guide

## For New Entities

When creating hooks for a new entity, use the factory pattern:

### Data Fetching Hook
\`\`\`typescript
export const useFetchYourEntity = createDataFetchHook<YourEntity>({
  endpoint: API_ROUTES.yourEntity.root,
  entityName: 'yourEntity',
  errorMessage: 'Failed to fetch items',
});
\`\`\`

### CRUD Hook
\`\`\`typescript
const _useYourEntity = createCRUDHook<YourEntity, YourEntityInsert>({
  baseEndpoint: API_ROUTES.yourEntity.root,
  byIdEndpoint: API_ROUTES.yourEntity.byId,
  entityName: 'yourEntity',
  messages: { /* ... */ },
});

export function useYourEntity() {
  const {create, update, deleteItem, ...rest} = _useYourEntity();
  return {
    createYourEntity: create,
    updateYourEntity: update,
    deleteYourEntity: deleteItem,
    ...rest,
  };
}
\`\`\`
```

**Deliverable:** Documentation complete

---

## Before & After Comparison

### Code Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Total Lines** | 166 lines (2 hooks) | 56 lines | -66% |
| **useFetchCommittees** | 45 lines | 16 lines | -64% |
| **useCommittees** | 121 lines | 40 lines | -67% |
| **Factory Code** | 0 lines | ~200 lines | One-time |
| **Duplication** | High (30+ entities) | None | N/A |

**Note:** Factory code is written once and used by 30+ entities, so the ROI is significant.

---

### API Comparison

**Before:**
```typescript
const {data, loading, error, refetch} = useFetchCommittees();
const {createCommittee, updateCommittee, deleteCommittee} = useCommittees();
```

**After:**
```typescript
const {data, loading, error, refetch} = useFetchCommittees();
const {createCommittee, updateCommittee, deleteCommittee} = useCommittees();
```

✅ **Same API - No breaking changes!**

---

### Features Added

| Feature | Before | After |
|---------|--------|-------|
| **Request Cancellation** | ❌ No | ✅ Yes |
| **Error Standardization** | ❌ Inconsistent | ✅ Consistent |
| **Type Safety** | ⚠️ Manual | ✅ Automatic |
| **Testability** | ⚠️ Each hook | ✅ Factory tested |
| **Maintainability** | ❌ Duplicate code | ✅ DRY |

---

## Testing Strategy

### Unit Tests (Factory Level)

Test the factories once, all hooks inherit the tests:

```typescript
// createDataFetchHook.test.ts
describe('createDataFetchHook', () => {
  it('fetches data on mount');
  it('handles loading states');
  it('handles errors');
  it('cancels requests on unmount');
  it('refetch works correctly');
});

// createCRUDHook.test.ts
describe('createCRUDHook', () => {
  describe('create', () => {
    it('creates item successfully');
    it('handles creation errors');
  });

  describe('update', () => {
    it('updates item successfully');
    it('handles update errors');
  });

  describe('delete', () => {
    it('deletes item successfully');
    it('handles deletion errors');
  });
});
```

---

### Integration Tests (Hook Level)

Test that the generated hooks work correctly:

```typescript
describe('useFetchCommittees', () => {
  it('fetches committees from API');
  it('returns correct data structure');
});

describe('useCommittees', () => {
  it('creates committee');
  it('updates committee');
  it('deletes committee');
});
```

---

### E2E Tests (Page Level)

Test the full user flow:

```typescript
describe('Committees Page', () => {
  it('displays list of committees');
  it('allows creating a new committee');
  it('allows editing a committee');
  it('allows deleting a committee');
});
```

---

## Rollout & Validation

### Rollout Plan

1. **Week 1: Committees** (this document)
   - Implement factories
   - Refactor committees
   - Test thoroughly

2. **Week 2: 2-3 Simple Entities**
   - Apply pattern to similar simple entities
   - Validate approach
   - Gather feedback

3. **Week 3-4: 10 More Entities**
   - Scale to more entities
   - Refine factories if needed
   - Update documentation

4. **Week 5-8: Remaining Entities**
   - Complete migration
   - Remove old pattern code
   - Final documentation

---

### Success Criteria

- [ ] All tests pass
- [ ] No regression in functionality
- [ ] Code reduction of 60%+
- [ ] Type safety maintained
- [ ] Performance unchanged or improved
- [ ] Documentation complete

---

### Rollback Plan

If issues arise:

1. Restore backup files:
   ```bash
   cp src/hooks/entities/committee/data/useFetchCommittees.ts.backup \
      src/hooks/entities/committee/data/useFetchCommittees.ts

   cp src/hooks/entities/committee/state/useCommittees.ts.backup \
      src/hooks/entities/committee/state/useCommittees.ts
   ```

2. Remove factory imports
3. Test original implementation
4. Investigate issue before retrying

---

## Next Steps After Committees

Once committees refactoring is successful, apply the pattern to:

### Priority Order

1. **Member Functions** (similar complexity)
2. **Seasons** (simple entity)
3. **User Roles** (simple entity)
4. **Blog Posts** (medium complexity)
5. **Categories** (medium complexity)
6. ... continue with remaining entities

---

## Questions & Answers

### Q: Do I need to update components?
**A:** No! The hook API remains the same. Components don't need any changes.

### Q: What about hooks with custom logic?
**A:** Keep custom logic! The factory handles common patterns. You can still add entity-specific behavior.

### Q: Can I customize factory behavior per hook?
**A:** Yes! The factory accepts config options. You can also wrap the generated hook with additional logic.

### Q: What about testing?
**A:** Test the factory once. Generated hooks inherit the tests. You only need to test entity-specific customizations.

---

## Conclusion

This refactoring demonstrates the Hook Factory Pattern on a simple, low-risk entity (Committees). Success here validates the approach for broader adoption across 30+ entities.

### Expected Impact

- **Code Reduction:** 60-70% fewer lines in hooks
- **Consistency:** All entities follow same pattern
- **Maintainability:** Fix bugs once, all hooks benefit
- **Developer Experience:** Faster to add new entities
- **Type Safety:** Automatic via generics

### Timeline

- **Phase 1:** Factory creation (2-3h)
- **Phase 2:** useFetchCommittees refactor (1-2h)
- **Phase 3:** useCommittees refactor (2-3h)
- **Phase 4:** Testing (2-3h)
- **Phase 5:** Documentation (1h)

**Total:** 8-12 hours

---

**Ready to start? Begin with Phase 1, Step 1.1!**

---

*Last Updated: November 12, 2025*
*Status: Ready for Implementation*