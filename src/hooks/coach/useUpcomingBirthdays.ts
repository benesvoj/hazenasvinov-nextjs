'use client';

import {useState, useEffect, useCallback} from 'react';

import {Member} from '@/types/entities/member/data/member';

import {useUserRoles} from '@/hooks/entities/user/useUserRoles';

import {createClient} from '@/utils/supabase/client';

interface BirthdayMember extends Member {
  daysUntilBirthday: number;
  nextBirthday: Date;
  age: number;
}

export function useUpcomingBirthdays(
  limit: number = 3,
  filterByAssignedCategories: boolean = false,
  categoryId?: string
) {
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);

  const {getCurrentUserCategories} = useUserRoles();

  const calculateDaysUntilBirthday = (
    dateOfBirth: string
  ): {daysUntil: number; nextBirthday: Date; age: number} => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    // Calculate current age
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

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
      age: actualAge,
    };
  };

  // Fetch assigned category if needed
  useEffect(() => {
    if (filterByAssignedCategories) {
      const fetchAssignedCategories = async () => {
        try {
          const categoryIds = await getCurrentUserCategories();
          setAssignedCategoryIds(categoryIds);

          // No need to convert - we already have category IDs
        } catch (error) {
          console.error('Error fetching assigned category:', error);
          setAssignedCategoryIds([]);
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
      let query = supabase.from('members').select('*').not('date_of_birth', 'is', null);

      // Filter by specific category or assigned category
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      } else if (filterByAssignedCategories && assignedCategoryIds.length > 0) {
        query = query.in('category_id', assignedCategoryIds);
      }

      const {data, error} = await query
        .order('surname', {ascending: true})
        .order('name', {ascending: true});

      if (error) throw error;

      // Filter and calculate birthdays
      const membersWithBirthdays: BirthdayMember[] = (data || [])
        .filter((member: Member) => member.date_of_birth)
        .map((member: Member) => {
          const birthdayInfo = calculateDaysUntilBirthday(member.date_of_birth!);
          return {
            ...member,
            daysUntilBirthday: birthdayInfo.daysUntil,
            nextBirthday: birthdayInfo.nextBirthday,
            age: birthdayInfo.age,
          };
        })
        .sort((a: any, b: any) => a.daysUntilBirthday - b.daysUntilBirthday)
        .slice(0, limit);

      setBirthdays(membersWithBirthdays);
    } catch (err: any) {
      console.error('Error fetching upcoming birthdays:', err);
      setError(err?.message || 'Chyba při načítání narozenin');
    } finally {
      setLoading(false);
    }
  }, [limit, filterByAssignedCategories, assignedCategoryIds, categoryId]);

  useEffect(() => {
    // Only fetch if we're not filtering by category, or if we have assigned category, or if categoryId is set
    if (!filterByAssignedCategories || assignedCategoryIds.length > 0 || categoryId) {
      fetchUpcomingBirthdays();
    }
  }, [fetchUpcomingBirthdays, filterByAssignedCategories, assignedCategoryIds, categoryId]);

  return {
    birthdays,
    loading,
    error,
    fetchUpcomingBirthdays,
  };
}
