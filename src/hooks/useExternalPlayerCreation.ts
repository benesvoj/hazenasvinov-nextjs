import {useState, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';
import {showToast} from '@/components';
import {ExternalPlayerFormData, PlayerSearchResult} from '@/types';
import {Genders, MemberFunction, RelationshipStatus, RelationshipType} from '@/enums';

/**
 * Hook for managing external player creation business logic
 * Extracted from CreateExternalPlayerModal component
 */
export function useExternalPlayerCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [categoryGender, setCategoryGender] = useState<Genders | null>(null);

  const supabase = createClient();

  /**
   * Fetch category gender information
   */
  const fetchCategoryGender = useCallback(
    async (categoryId: string): Promise<Genders | null> => {
      try {
        const {data: category, error} = await supabase
          .from('categories')
          .select('gender')
          .eq('id', categoryId)
          .single();

        if (error) {
          console.error('Error fetching category gender:', error);
          return null;
        }

        return category.gender;
      } catch (error) {
        console.error('Error fetching category gender:', error);
        return null;
      }
    },
    [supabase]
  );

  /**
   * Find or create a club
   */
  const findOrCreateClub = useCallback(
    async (clubName: string): Promise<string> => {
      // First, try to find existing club
      const {data: existingClub, error: clubSearchError} = await supabase
        .from('clubs')
        .select('id')
        .eq('name', clubName.trim())
        .single();

      if (clubSearchError && clubSearchError.code !== 'PGRST116') {
        throw new Error(`Chyba při hledání klubu: ${clubSearchError.message}`);
      }

      if (existingClub) {
        return existingClub.id;
      }

      // Create new club if it doesn't exist
      const {data: newClub, error: clubCreateError} = await supabase
        .from('clubs')
        .insert({
          name: clubName.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (clubCreateError) {
        throw new Error(`Chyba při vytváření klubu: ${clubCreateError.message}`);
      }

      return newClub.id;
    },
    [supabase]
  );

  /**
   * Create a member record
   */
  const createMember = useCallback(
    async (
      formData: ExternalPlayerFormData,
      categoryId?: string
    ): Promise<{id: string; name: string; surname: string; registration_number: string}> => {
      const {data: memberData, error: memberError} = await supabase
        .from('members')
        .insert({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          registration_number: formData.registration_number.trim(),
          functions: MemberFunction.PLAYER, // External players are players
          sex: formData.sex, // Use explicit gender selection from form
          category_id: categoryId, // Set category_id from the match category
        })
        .select()
        .single();

      if (memberError) {
        console.error('Error creating external player:', memberError);
        throw new Error(`Chyba při vytváření externího hráče: ${memberError.message}`);
      }

      return memberData;
    },
    [supabase]
  );

  /**
   * Create member-club relationship
   */
  const createMemberClubRelationship = useCallback(
    async (memberId: string, clubId: string): Promise<void> => {
      const {error: relationshipError} = await supabase.from('member_club_relationships').insert({
        member_id: memberId,
        club_id: clubId,
        relationship_type: RelationshipType.PERMANENT, // External players are permanent members of their club
        status: RelationshipStatus.ACTIVE,
        valid_from: new Date().toISOString().split('T')[0],
      });

      if (relationshipError) {
        console.error('Error creating member-club relationship:', relationshipError);
        throw new Error(`Chyba při vytváření vztahu hráč-klub: ${relationshipError.message}`);
      }
    },
    [supabase]
  );

  /**
   * Create external player (main business logic)
   */
  const createExternalPlayer = useCallback(
    async (formData: ExternalPlayerFormData, categoryId?: string): Promise<PlayerSearchResult> => {
      setIsLoading(true);

      try {
        // Step 1: Find or create club
        const clubId = await findOrCreateClub(formData.club_name);

        // Step 2: Create member record
        const memberData = await createMember(formData, categoryId);

        // Step 3: Create member-club relationship
        await createMemberClubRelationship(memberData.id, clubId);

        // Step 4: Create PlayerSearchResult for the created member
        const externalPlayer: PlayerSearchResult = {
          id: memberData.id,
          name: memberData.name,
          surname: memberData.surname,
          registration_number: memberData.registration_number,
          position: formData.position, // Use position from form data, not from member data
          jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : undefined,
          is_external: true,
          current_club_name: formData.club_name.trim(),
          display_name: `${memberData.surname} ${memberData.name} (${memberData.registration_number})`,
          is_captain: formData.is_captain,
        };

        showToast.success('Externí hráč byl úspěšně vytvořen');
        return externalPlayer;
      } catch (error) {
        console.error('Error creating external player:', error);
        const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
        showToast.danger(`Chyba při vytváření externího hráče: ${errorMessage}`);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [findOrCreateClub, createMember, createMemberClubRelationship]
  );

  /**
   * Load category gender and update form data
   */
  const loadCategoryGender = useCallback(
    async (categoryId: string, onGenderLoaded: (gender: Genders) => void): Promise<void> => {
      const gender = await fetchCategoryGender(categoryId);
      if (gender) {
        setCategoryGender(gender);
        onGenderLoaded(gender);
      } else {
        setCategoryGender(null);
      }
    },
    [fetchCategoryGender]
  );

  return {
    isLoading,
    categoryGender,
    createExternalPlayer,
    loadCategoryGender,
    fetchCategoryGender,
  };
}
