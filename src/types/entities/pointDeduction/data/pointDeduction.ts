import {PointDeductionInsert, PointDeductionSchema, PointDeductionUpdate} from '@/types';

export interface PointDeduction extends PointDeductionSchema {
  team?: {
    id: string;
    team_suffix: string;
    club_category?: {
      club?: {
        id: string;
        name: string;
        short_name?: string;
      };
    };
  };
}

export interface CreatePointDeduction extends PointDeductionInsert {}

export interface UpdatePointDeduction extends PointDeductionUpdate {}

export type PointDeductionFormData = Omit<
  PointDeduction,
  'id' | 'created_at' | 'updated_at' | 'team'
>;
