'use client';

import {useState} from 'react';

import {showToast} from '@/components';
import {Genders} from '@/enums';
import {useSupabaseClient} from '@/hooks';

interface BulkEditFormData {
  sex: Genders;
  category: string;
  functions: string[];
}

interface UseBulkEditMembersProps {
  onSuccess: () => void;
}

export function useBulkEditMembers({onSuccess}: UseBulkEditMembersProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();

  const bulkEditMembers = async (
    memberIds: string[],
    formData: BulkEditFormData
  ): Promise<boolean> => {
    if (memberIds.length === 0) {
      showToast.warning('Vyberte alespoň jednoho člena');
      return false;
    }

    if (!formData.sex && !formData.category && formData.functions.length === 0) {
      showToast.danger('Vyberte alespoň jedno pole pro úpravu');
      return false;
    }

    setIsLoading(true);

    try {
      const updateData: any = {};
      if (formData.sex) updateData.sex = formData.sex;
      if (formData.category) updateData.category_id = formData.category;
      if (formData.functions.length > 0) updateData.functions = formData.functions;

      const {error} = await supabase.from('members').update(updateData).in('id', memberIds);

      if (error) {
        throw error;
      }

      showToast.success(`Úspěšně upraveno ${memberIds.length} členů`);
      onSuccess();
      return true;
    } catch (error: any) {
      showToast.danger(`Chyba při hromadné úpravě: ${error.message || 'Neznámá chyba'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bulkEditMembers,
    isLoading,
  };
}
