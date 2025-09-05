import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Member } from '@/types/member';
import { useUserRoles } from './useUserRoles';

interface BirthdayMember extends Member {
  daysUntilBirthday: number;
  nextBirthday: Date;
  age: number;
}

export function useUpcomingBirthdays(limit: number = 3, filterByAssignedCategories: boolean = false) {
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);
  const [assignedCategoryCodes, setAssignedCategoryCodes] = useState<string[]>([]);
  
  const { getCurrentUserCategories } = useUserRoles();

  const calculateDaysUntilBirthday = (dateOfBirth: string): { daysUntil: number; nextBirthday: Date; age: number } => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Calculate current age
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
    
    // Calculate next birthday
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    // If birthday has already passed this year, move to next year
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    // Calculate days until next birthday
    const timeDiff = nextBirthday.getTime() - today.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return {
      daysUntil,
      nextBirthday,
      age: actualAge
    };
  };

  // Fetch assigned categories if needed
  useEffect(() => {
    if (filterByAssignedCategories) {
      const fetchAssignedCategories = async () => {
        try {
          const categoryIds = await getCurrentUserCategories();
          setAssignedCategoryIds(categoryIds);
          
          // Convert category IDs to category codes
          if (categoryIds.length > 0) {
            const supabase = createClient();
            const { data: categories, error } = await supabase
              .from('categories')
              .select('id, code')
              .in('id', categoryIds);
            
            if (error) {
              console.error('Error fetching category codes:', error);
              setAssignedCategoryCodes([]);
            } else {
              const codes = categories?.map(cat => cat.code) || [];
              console.log('🎂 Assigned category codes:', codes);
              setAssignedCategoryCodes(codes);
            }
          } else {
            setAssignedCategoryCodes([]);
          }
        } catch (error) {
          console.error('Error fetching assigned categories:', error);
          setAssignedCategoryIds([]);
          setAssignedCategoryCodes([]);
        }
      };
      fetchAssignedCategories();
    }
  }, [filterByAssignedCategories, getCurrentUserCategories]);

  const fetchUpcomingBirthdays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Build query based on filtering requirements
      let query = supabase
        .from('members')
        .select('*')
        .not('date_of_birth', 'is', null);
      
      // Filter by assigned categories if needed
      if (filterByAssignedCategories && assignedCategoryCodes.length > 0) {
        console.log('🎂 Filtering members by category codes:', assignedCategoryCodes);
        query = query.in('category', assignedCategoryCodes);
      }
      
      const { data, error } = await query
        .order('surname', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      
      console.log('🎂 Fetched members for birthdays:', data?.length || 0, 'members');

      // Filter and calculate birthdays
      const membersWithBirthdays: BirthdayMember[] = (data || [])
        .filter(member => member.date_of_birth)
        .map(member => {
          const birthdayInfo = calculateDaysUntilBirthday(member.date_of_birth!);
          return {
            ...member,
            daysUntilBirthday: birthdayInfo.daysUntil,
            nextBirthday: birthdayInfo.nextBirthday,
            age: birthdayInfo.age
          };
        })
        .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday)
        .slice(0, limit);

      setBirthdays(membersWithBirthdays);
    } catch (err: any) {
      console.error('Error fetching upcoming birthdays:', err);
      setError(err?.message || 'Chyba při načítání narozenin');
    } finally {
      setLoading(false);
    }
  }, [limit, filterByAssignedCategories, assignedCategoryCodes]);

  useEffect(() => {
    // Only fetch if we're not filtering by categories or if we have assigned categories
    if (!filterByAssignedCategories || assignedCategoryCodes.length > 0) {
      fetchUpcomingBirthdays();
    }
  }, [fetchUpcomingBirthdays, filterByAssignedCategories, assignedCategoryCodes]);

  return {
    birthdays,
    loading,
    error,
    fetchUpcomingBirthdays
  };
}
