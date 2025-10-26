import {MemberFunctionInsert, MemberFunctionSchema, MemberFunctionUpdate} from '@/types';

export interface MemberFunction extends MemberFunctionSchema {}

export interface CreateMemberFunction extends MemberFunctionInsert {}

export interface UpdateMemberFunction extends MemberFunctionUpdate {}

export type MemberFunctionFormData = Omit<MemberFunction, 'id' | 'created_at' | 'updated_at'>;
