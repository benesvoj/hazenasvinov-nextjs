'use client';
import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {convertSchemaToMember, Member, MemberFormData, UpdateMemberData} from '@/types';

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Hook for managing members - provides full CRUD operations
 * Follows entity-based naming convention (useMembers, not useMemberCreation)
 */
export function useMembers() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const tMembers = translations.members;

  /**
   * Validate member form data
   */
  const validateForm = useCallback((formData: MemberFormData): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = tMembers.validations.mandatoryName;
    }
    if (!formData.surname.trim()) {
      newErrors.surname = tMembers.validations.mandatorySurname;
    }
    if (!formData.registration_number.trim()) {
      newErrors.registration_number = tMembers.validations.mandatoryRegNumber;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  /**
   * Create a new member
   * @returns Full Member object with enum conversions
   */
  const createMember = useCallback(
    async (
      formData: MemberFormData,
      categoryId?: string | null,
      clubId?: string | null
    ): Promise<Member> => {
      if (!validateForm(formData)) {
        throw new Error(tMembers.toasts.formContainsError);
      }

      setIsLoading(true);
      setErrors({});

      try {
        const response = await fetch(API_ROUTES.members.root, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            name: formData.name.trim(),
            surname: formData.surname.trim(),
            registration_number: formData.registration_number.trim(),
            date_of_birth: formData.date_of_birth ?? null,
            sex: formData.sex,
            functions: formData.functions,
            category_id: categoryId || null,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          showToast.danger(tMembers.toasts.failedToCreateMember);
        }

        // Step 2: Create member-club relationship if clubId is provided
        if (clubId && result.data) {
          const relationshipResponse = await fetch(
            API_ROUTES.members.relationships(result.data.id),
            {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({clubId}),
            }
          );
          if (!relationshipResponse.ok) {
            const relationshipError = await relationshipResponse.json();
            console.error('Error updating relationship error:', relationshipError);
            showToast.danger(tMembers.toasts.failedToCreateClubRelationship);
          }
        }

        const convertedMember = convertSchemaToMember(result.data);
        showToast.success(tMembers.toasts.memberCreatedSuccessfully);

        return convertedMember;
      } catch (error) {
        console.error('Error creating member:', error);
        const errorMessage =
          error instanceof Error ? error.message : tMembers.toasts.failedToCreateMember;
        showToast.danger(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [validateForm]
  );

  /**
   * Update an existing member via API
   */
  const updateMember = useCallback(async (memberData: UpdateMemberData): Promise<Member> => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(API_ROUTES.members.byId(memberData.id), {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({memberData}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || tMembers.toasts.memberUpdateFailed);
      }

      const convertedMember = convertSchemaToMember(result.data);
      showToast.success(tMembers.toasts.memberUpdatedSuccessfully);

      return convertedMember;
    } catch (error) {
      console.error('Error updating member:', error);
      const errorMessage =
        error instanceof Error ? error.message : tMembers.toasts.memberUpdateFailed;
      showToast.danger(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a member
   */
  const deleteMember = useCallback(async (memberId: string): Promise<void> => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(API_ROUTES.members.byId(memberId), {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || tMembers.toasts.memberDeleteFailed);
      }

      showToast.success(tMembers.toasts.memberDeletedSuccessfully);
    } catch (error) {
      console.error('Error deleting member:', error);
      const errorMessage =
        error instanceof Error ? error.message : tMembers.toasts.memberDeleteFailed;
      showToast.danger(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear validation errors for a specific field
   */
  const clearFieldError = useCallback(
    (field: string) => {
      if (errors[field]) {
        setErrors((prev) => ({...prev, [field]: ''}));
      }
    },
    [errors]
  );

  /**
   * Clear all validation errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setErrors({});
    setIsLoading(false);
  }, []);

  return {
    // State
    isLoading,
    errors,

    // CRUD Operations
    createMember,
    updateMember,
    deleteMember,

    // Validation
    clearFieldError,
    clearAllErrors,
    reset,
  };
}
