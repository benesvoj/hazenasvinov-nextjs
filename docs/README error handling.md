🎯 My Recommendation: Hybrid Approach

Based on your codebase structure and Next.js best practices, I recommend:

Standard Pattern:

// Hook: useMemberFunctions.ts
export function useMemberFunctions() {
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

    const createMemberFunction = useCallback(async (data: CreateMemberFunction) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_ROUTES.memberFunctions.root, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to create function');
        }

        showToast.success('Funkce byla úspěšně vytvořena');
        return response.data; // ✅ Return data directly
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setError(message);
        showToast.danger('Chyba při vytváření funkce');
        throw error; // ✅ Re-throw for component handling
      } finally {
        setLoading(false);
      }
    }, []);

    const updateMemberFunction = useCallback(async (id: string, data: Partial<CreateMemberFunction>) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_ROUTES.memberFunctions.byId(id), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to update function');
        }

        showToast.success('Funkce byla úspěšně aktualizována');
        return response.data; // ✅ Return data directly
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setError(message);
        showToast.danger('Chyba při aktualizaci funkce');
        throw error; // ✅ Re-throw
      } finally {
        setLoading(false);
      }
    }, []);

    const deleteMemberFunction = useCallback(async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_ROUTES.memberFunctions.byId(id), {
          method: 'DELETE',
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to delete function');
        }

        showToast.success('Funkce byla úspěšně smazána');
        return {success: true}; // ✅ Simple success indicator
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setError(message);
        showToast.danger('Chyba při mazání funkce');
        throw error; // ✅ Re-throw
      } finally {
        setLoading(false);
      }
    }, []);

    return {
      loading,
      error,
      createMemberFunction,
      updateMemberFunction,
      deleteMemberFunction,
      setLoading,
    };
}

Component Usage:

const handleSubmit = async () => {
const {valid, errors} = validateForm();
if (!valid) {
console.error('Validation errors:', errors);
return;
}

    try {
      if (modalMode === ModalMode.EDIT && selectedFunction) {
        await updateMemberFunction(selectedFunction.id, formData);
      } else {
        await createMemberFunction(formData);
      }

      // ✅ Success path - errors already shown by hook
      await refetch();
      onFunctionModalClose();
      resetForm();
    } catch (error) {
      // ✅ Error already toasted by hook
      // Optional: Add component-specific error handling
      console.error('Operation failed:', error);
    }
};

  ---
📋 Standard Pattern Rules

Rule 1: Throw Errors from Hooks ✅

- All CRUD operations should throw errors
- Errors are caught and handled in the hook
- User feedback (toasts) shown in the hook
- Re-throw error for component handling

Rule 2: Return Data Directly ✅

- create → returns created entity
- update → returns updated entity
- delete → returns {success: true} or nothing
- fetch → returns data array

Rule 3: Consistent Error Handling ✅

} catch (error) {
const message = error instanceof Error ? error.message : 'Unknown error';
setError(message); // Update hook state
showToast.danger('User-friendly message'); // Show to user
throw error; // Re-throw for component
} finally {
setLoading(false); // Always cleanup
}

Rule 4: Component Try/Catch ✅

try {
await crudOperation();
// Success handling
closeModal();
refetch();
} catch (error) {
// Error already shown by hook
// Optional: component-specific handling
console.error(error);
}

  ---
🎯 Why This Pattern?

1. Separation of Concerns: Hook handles API + user feedback, component handles UI flow
2. DRY: Toast logic in one place (hook)
3. Flexibility: Component can add custom error handling
4. Consistency: All hooks follow same pattern
5. TypeScript Friendly: Clear return types
6. React Best Practice: Matches React Query, SWR patterns
7. Error Propagation: Errors bubble up naturally

  ---
📝 Standard Template

Here's your standard CRUD hook template:

export function useEntity() {
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

    const createEntity = useCallback(async (data: CreateEntity) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_ROUTES.entity.root, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to create');
        }

        showToast.success('Success message');
        return response.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setError(message);
        showToast.danger('Error message');
        throw error;
      } finally {
        setLoading(false);
      }
    }, []);

    // ... updateEntity, deleteEntity follow same pattern

    return {
      loading,
      error,
      createEntity,
      updateEntity,
      deleteEntity,
      setLoading,
    };
}

  ---
✅ Decision: Use Throw Error Pattern

Reasons:
1. Already used in your clubs hook ✅
2. Cleaner component code ✅
3. Better separation of concerns ✅
4. Standard React/Next.js pattern ✅
5. Works well with your architecture ✅
