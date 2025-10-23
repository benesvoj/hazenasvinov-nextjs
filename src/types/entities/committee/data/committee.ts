import {CommitteesInsert, CommitteesSchema, CommitteesUpdate} from '@/types';

export interface Committee extends CommitteesSchema {}

export interface CommitteeInsert extends CommitteesInsert {}

export interface CommitteeUpdate extends CommitteesUpdate {}

export type CommitteeFormData = Omit<Committee, 'id' | 'created_at' | 'updated_at'>;
