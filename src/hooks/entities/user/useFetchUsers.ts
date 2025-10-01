import {useEffect, useState, useCallback} from 'react';

import {Api} from '@/app/api/api';

import {SupabaseUser} from '@/types';
export interface LoginLog {
  id: string;
  user_id: string;
  email: string;
  login_time: string;
  action: string;
  user_agent: string;
  status: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useFetchUsers(includeLogs: boolean = false) {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [selectedUser, setSelectedUser] = useState<string>('');

  const fetchUsers = useCallback(
    async (page: number = 1, userEmail: string = '') => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        if (includeLogs) {
          params.append('includeLogs', 'true');
          params.append('page', page.toString());
          params.append('limit', pagination.limit.toString());

          // Add user filter
          if (userEmail) {
            params.append('userEmail', userEmail);
          }
        }

        const url = includeLogs ? `${Api.getUsers}?${params.toString()}` : Api.getUsers;
        const res = await fetch(url);
        const data = await res.json();

        if (includeLogs && data.users && data.loginLogs) {
          setUsers(data.users);
          setLoginLogs(data.loginLogs);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        } else {
          setUsers(data);
          setLoginLogs([]);
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    },
    [includeLogs, pagination.limit]
  );

  useEffect(() => {
    fetchUsers(1, selectedUser);
  }, [fetchUsers, selectedUser]);

  // Function to change page
  const changePage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
        fetchUsers(newPage, selectedUser);
      }
    },
    [fetchUsers, pagination.totalPages, selectedUser]
  );

  // Function to change user filter
  const changeUserFilter = useCallback(
    (userEmail: string) => {
      setSelectedUser(userEmail);
      // Reset to first page when changing filter
      fetchUsers(1, userEmail);
    },
    [fetchUsers]
  );

  // Function to clear filters
  const clearFilters = useCallback(() => {
    setSelectedUser('');
    fetchUsers(1, '');
  }, [fetchUsers]);

  return {
    users,
    loginLogs,
    loading,
    error,
    pagination,
    selectedUser,
    changePage,
    changeUserFilter,
    clearFilters,
    fetchUsers,
  };
}
