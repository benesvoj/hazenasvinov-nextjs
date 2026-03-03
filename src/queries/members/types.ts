import {Genders, MemberFunction} from '@/enums';
import {Member} from '@/types';

/**
 * Member with related data (for joins)
 */
export interface MemberWithRelations extends Member {
  member_functions?: MemberFunctionJoin[];
  member_payments?: MemberPayment[];
}

/**
 * Member function join data (raw DB join shape — not the MemberFunction enum)
 */
export interface MemberFunctionJoin {
  function_id: string;
  function_name: string;
  start_date: string;
  end_date?: string;
}

/**
 * Member payment join data
 */
export interface MemberPayment {
  amount: number;
  paid_at: string;
  status: 'paid' | 'pending' | 'overdue';
}

/**
 * Options accepted by `buildMembersViewQuery` and the query functions that
 * delegate to it (e.g. `getMembersInternal`, `getMembersExternal`).
 *
 * All fields are optional — omitting a field means "no restriction" for that
 * dimension; it does not filter for falsy / empty values.
 */
export interface GetMembersOptions {
  /** 1-based page number. Defaults to `1`. */
  page?: number;

  /** Number of rows per page. Defaults to `100`. */
  limit?: number;

  /**
   * Full-text search term matched against `name`, `surname`, and
   * `registration_number` (case-insensitive, partial match).
   */
  search?: string;

  /** Filter by sex. `Genders.EMPTY` is treated as "no filter". */
  sex?: Genders;

  /** Filter by category UUID. */
  categoryId?: string;

  /** Filter by a single member function. */
  memberFunctions?: MemberFunction;

  /**
   * When `true`, only active members are returned (`WHERE is_active = true`).
   * `false` and `undefined` both mean no filter — all members are returned.
   */
  isActive?: boolean;
}
