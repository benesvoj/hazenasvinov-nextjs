'use client';
import {useState, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {showToast} from '@/components';
import {useMemberClubRelationships} from '@/hooks';
import {MemberFormData, Member, UpdateMemberData, convertSchemaToMember} from '@/types';

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

  const supabase = createClient();
  const {createRelationship} = useMemberClubRelationships();

  /**
   * Validate member form data
   */
  const validateForm = useCallback((formData: MemberFormData): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Jméno je povinné';
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Příjmení je povinné';
    }
    if (!formData.registration_number.trim()) {
      newErrors.registration_number = 'Registrační číslo je povinné';
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
        throw new Error('Formulář obsahuje chyby');
      }

      setIsLoading(true);
      setErrors({});

      try {
        const {data, error} = await supabase
          .from('members')
          .insert({
            name: formData.name.trim(),
            surname: formData.surname.trim(),
            registration_number: formData.registration_number.trim(),
            date_of_birth: formData.date_of_birth ?? null,
            sex: formData.sex,
            functions: formData.functions,
            category_id: categoryId ?? null,
          })
          .select()
          .single();

        if (error) {
          showToast.danger(`Chyba při vytváření člena: ${error.message}`);
          throw new Error(`Chyba při vytváření člena: ${error.message}`);
        }

        // Step 2: Create member-club relationship if clubId is provided
        if (clubId) {
          await createRelationship({
            memberId: data.id,
            clubId: clubId,
          });
        }

        const convertedMember = convertSchemaToMember(data);
        showToast.success('Člen byl úspěšně vytvořen');

        return convertedMember;
      } catch (error) {
        console.error('Error creating member:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chyba při vytváření člena';
        showToast.danger(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, validateForm, createRelationship]
  );

  /**
   * Update an existing member
   */
  const updateMember = useCallback(
    async (memberData: UpdateMemberData): Promise<Member> => {
      setIsLoading(true);
      setErrors({});

      try {
        // Filter out undefined values to avoid Supabase errors
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        // Only include fields that are not undefined
        Object.keys(memberData).forEach((key) => {
          const value = memberData[key as keyof UpdateMemberData];
          if (value !== undefined && key !== 'id') {
            updateData[key] = value;
          }
        });

        const {data, error} = await supabase
          .from('members')
          .update(updateData)
          .eq('id', memberData.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating member:', error);
          throw new Error(`Chyba při aktualizaci člena: ${error.message}`);
        }

        const convertedMember = convertSchemaToMember(data);
        showToast.success('Člen byl úspěšně aktualizován');

        return convertedMember;
      } catch (error) {
        console.error('Error updating member:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chyba při aktualizaci člena';
        showToast.danger(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Delete a member
   */
  const deleteMember = useCallback(
    async (memberId: string): Promise<void> => {
      setIsLoading(true);
      setErrors({});

      try {
        const {error} = await supabase.from('members').delete().eq('id', memberId);

        if (error) {
          console.error('Error deleting member:', error);
          throw new Error(`Chyba při mazání člena: ${error.message}`);
        }
        showToast.success('Člen byl úspěšně smazán');
      } catch (error) {
        console.error('Error deleting member:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chyba při mazání člena';
        showToast.danger(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

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
