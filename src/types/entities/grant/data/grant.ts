import {GrantInsert, GrantSchema, GrantUpdate} from '@/types';

export interface Grant extends GrantSchema {}

export interface CreateGrant extends GrantInsert {}

export interface UpdateGrant extends GrantUpdate {}

export type GrantFormData = Omit<Grant, 'id' | 'created_at' | 'updated_at'>;
