import {CommitteeInsert, CommitteeSchema, CommitteeUpdate} from '@/types';

export interface Committee extends CommitteeSchema {}

export interface CreateCommittee extends CommitteeInsert {}

export interface UpdateCommittee extends CommitteeUpdate {}

export type CommitteeFormData = Omit<Committee, 'id' | 'created_at' | 'updated_at'>;
