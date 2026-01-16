import {TrainingSessionStatusEnum} from '@/enums';
import {TrainingSessionSchema} from '@/types';

export interface BaseTrainingSession extends TrainingSessionSchema {
  status: TrainingSessionStatusEnum;
}
