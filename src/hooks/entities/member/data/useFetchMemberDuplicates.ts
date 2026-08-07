'use client';

import {useEffect, useState} from 'react';

import {API_ROUTES} from '@/lib/api-routes';

import {useDebounce} from '@/hooks';
import {MemberDuplicate} from '@/types';

/** Below this length a name fragment matches half the club — not worth warning about. */
const MIN_LENGTH = 2;

interface UseFetchMemberDuplicatesOptions {
  name: string;
  surname: string;
  /** Member being edited — excluded so it never flags itself. */
  excludeId?: string | null;
  /** Skips the lookup entirely (e.g. while the form is closed). */
  enabled?: boolean;
}

/**
 * Looks up members sharing the given name, debounced while the user types.
 *
 * Namesakes are legitimate, so the result only ever feeds a warning — see
 * `MemberDuplicateWarning`.
 */
export function useFetchMemberDuplicates({
  name,
  surname,
  excludeId,
  enabled = true,
}: UseFetchMemberDuplicatesOptions) {
  const [data, setData] = useState<MemberDuplicate[]>([]);

  const debouncedName = useDebounce(name, 500);
  const debouncedSurname = useDebounce(surname, 500);

  useEffect(() => {
    const trimmedName = debouncedName?.trim() ?? '';
    const trimmedSurname = debouncedSurname?.trim() ?? '';

    if (!enabled || trimmedName.length < MIN_LENGTH || trimmedSurname.length < MIN_LENGTH) {
      setData([]);
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const url = new URL(API_ROUTES.members.duplicates, window.location.origin);
        url.searchParams.set('name', trimmedName);
        url.searchParams.set('surname', trimmedSurname);
        if (excludeId) url.searchParams.set('excludeId', excludeId);

        const response = await fetch(url.toString(), {signal: controller.signal});
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        setData((result.data ?? []) as MemberDuplicate[]);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        // A failed check must not get in the way of creating a member.
        console.error('Error checking member duplicates:', error);
        setData([]);
      }
    };

    void fetchData();

    return () => controller.abort();
  }, [debouncedName, debouncedSurname, excludeId, enabled]);

  return {data};
}
