'use client';

import {useCallback, useEffect, useState} from 'react';

import {API_ROUTES} from '@/lib/api-routes';

import {MemberAudit} from '@/types';

/**
 * Loads the audit trail (author + timestamps) of a single member.
 *
 * Kept separate from the member form state: it is read-only metadata shown
 * alongside the form, and must not end up in the update payload.
 *
 * @param memberId - Member to load; `null`/`undefined` skips the request.
 */
export function useFetchMemberAudit(memberId?: string | null) {
  const [data, setData] = useState<MemberAudit | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);

    try {
      const response = await fetch(API_ROUTES.members.byId(id));
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setData(result.data as MemberAudit);
    } catch (error) {
      // The audit block is supplementary — failing to load it must not disrupt
      // editing, so it simply stays hidden.
      console.error('Error fetching member audit:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!memberId) {
      setData(null);
      return;
    }

    void fetchData(memberId);
  }, [memberId, fetchData]);

  return {data, loading};
}
