'use client';
import {useState, useMemo} from 'react';

import {Genders, MemberFunction} from '@/enums';
import {useDebounce} from '@/hooks';
import {MemberWithPaymentStatus, MemberFilters, MemberSortDescriptor} from '@/types';

const ROWS_PER_PAGE = 10;

export const useMembersTable = (members: MemberWithPaymentStatus[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<MemberFilters>({
    sex: Genders.EMPTY,
    category_id: '',
    function: '',
  });
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<MemberSortDescriptor>({
    column: 'surname',
    direction: 'ascending',
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtered members
  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Search filter
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(term) ||
          member.surname.toLowerCase().includes(term) ||
          (member.registration_number && member.registration_number.toLowerCase().includes(term))
      );
    }

    // Sex filter
    if (filters.sex && filters.sex !== Genders.EMPTY) {
      filtered = filtered.filter((member) => member.sex === filters.sex);
    }

    // Category filter
    if (filters.category_id) {
      filtered = filtered.filter((member) => member.category_id === filters.category_id);
    }

    // Function filter
    if (filters.function) {
      filtered = filtered.filter(
        (member) =>
          member.functions && member.functions.includes(filters.function as MemberFunction)
      );
    }

    return filtered;
  }, [members, debouncedSearchTerm, filters]);

  // Sorted members
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof MemberWithPaymentStatus];
      const second = b[sortDescriptor.column as keyof MemberWithPaymentStatus];

      if (first === null || second === null) return 0;

      if (typeof first === 'string' && typeof second === 'string') {
        return sortDescriptor.direction === 'ascending'
          ? first.localeCompare(second)
          : second.localeCompare(first);
      }

      if (typeof first === 'number' && typeof second === 'number') {
        return sortDescriptor.direction === 'ascending' ? first - second : second - first;
      }

      // Special handling for registration numbers
      if (sortDescriptor.column === 'registration_number') {
        const extractNumber = (str: string) => {
          const match = str.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        const numA = extractNumber(first as string);
        const numB = extractNumber(second as string);
        return sortDescriptor.direction === 'ascending' ? numA - numB : numB - numA;
      }

      return 0;
    });
  }, [filteredMembers, sortDescriptor]);

  // Paginated members
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return sortedMembers.slice(start, end);
  }, [sortedMembers, page]);

  const totalPages = Math.ceil(filteredMembers.length / ROWS_PER_PAGE);

  const clearFilters = () => {
    setFilters({
      sex: Genders.EMPTY,
      category_id: '',
      function: '',
    });
  };

  return {
    // State
    searchTerm,
    filters,
    page,
    sortDescriptor,

    // Setters
    setSearchTerm,
    setFilters,
    setPage,
    setSortDescriptor,
    clearFilters,

    // Computed data
    filteredMembers,
    sortedMembers,
    paginatedMembers,
    totalPages,
    totalCount: filteredMembers.length,
  };
};
