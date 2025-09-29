import {useState, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {showToast} from '@/components';
import {MemberFormData, CreateMemberResult, Member, UpdateMemberData} from '@/types';

import {useMemberClubRelationships} from '../business/useMemberClubRelationships';

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
  const [members, setMembers] = useState<Member[]>([]);

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
   * Fetch all members
   */
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const {data, error} = await supabase
        .from('members')
        .select('*')
        .order('surname', {ascending: true})
        .order('name', {ascending: true});

      if (error) {
        console.error('Error fetching members:', error);
        throw new Error(`Chyba při načítání členů: ${error.message}`);
      }

      setMembers(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching members:', error);
      const errorMessage = error instanceof Error ? error.message : 'Chyba při načítání členů';
      showToast.danger(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  /**
   * Create a new member
   */
  const createMember = useCallback(
    async (
      formData: MemberFormData,
      categoryId?: string,
      clubId?: string
    ): Promise<CreateMemberResult> => {
      if (!validateForm(formData)) {
        throw new Error('Formulář obsahuje chyby');
      }

      setIsLoading(true);
      setErrors({});

      try {
        // Step 1: Create member record
        const {data, error} = await supabase
          .from('members')
          .insert({
            name: formData.name.trim(),
            surname: formData.surname.trim(),
            registration_number: formData.registration_number.trim(),
            date_of_birth: formData.date_of_birth || null,
            sex: formData.sex,
            functions: formData.functions,
            category_id: categoryId,
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

        // Update local state
        setMembers((prev) => [...prev, data]);

        showToast.success('Člen byl úspěšně vytvořen');

        return {
          id: data.id,
          name: data.name,
          surname: data.surname,
          registration_number: data.registration_number,
        };
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
        const {data, error} = await supabase
          .from('members')
          .update({
            ...memberData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', memberData.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating member:', error);
          throw new Error(`Chyba při aktualizaci člena: ${error.message}`);
        }

        // Update local state
        setMembers((prev) => prev.map((member) => (member.id === memberData.id ? data : member)));

        showToast.success('Člen byl úspěšně aktualizován');
        return data;
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

        // Update local state
        setMembers((prev) => prev.filter((member) => member.id !== memberId));

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
   * Get a specific member by ID
   */
  const getMember = useCallback(
    async (memberId: string): Promise<Member | null> => {
      setIsLoading(true);
      setErrors({});

      try {
        const {data, error} = await supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .single();

        if (error) {
          console.error('Error fetching member:', error);
          throw new Error(`Chyba při načítání člena: ${error.message}`);
        }

        return data;
      } catch (error) {
        console.error('Error fetching member:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chyba při načítání člena';
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
    members,
    isLoading,
    errors,

    // CRUD Operations
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    getMember,

    // Validation
    validateForm,
    clearFieldError,
    clearAllErrors,
    reset,
  };
}
