import {
  CategoryLineupMemberInsert,
  CategoryLineupMemberSchema,
  CategoryLineupMemberUpdate,
  Member,
} from '@/types';

export interface BaseCategoryLineupMember extends CategoryLineupMemberSchema {}

export interface CreateCategoryLineupMember extends CategoryLineupMemberInsert {}

export interface UpdateCategoryLineupMember extends CategoryLineupMemberUpdate {}

export interface CategoryLineupMemberWithMember extends BaseCategoryLineupMember {
  members: Member;
}

export type CreateCategoryLineupMemberModal = Partial<
  Omit<CategoryLineupMemberInsert, 'added_by' | 'lineup_id' | 'is_active'>
>;
