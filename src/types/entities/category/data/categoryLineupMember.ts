import {CategoryLineupMemberInsert, CategoryLineupMemberSchema, CategoryLineupMemberUpdate, Member} from "@/types";

export interface CategoryLineupMember extends  CategoryLineupMemberSchema{}

export interface CreateCategoryLineupMember extends  CategoryLineupMemberInsert{}

export interface UpdateCategoryLineupMember extends  CategoryLineupMemberUpdate{}

export interface CategoryLineupMemberWithMember extends CategoryLineupMember {
	members: Member
}

export type CreateCategoryLineupMemberModal = Partial<Omit<CategoryLineupMemberInsert,'added_by' | 'lineup_id' | 'is_active'>>;