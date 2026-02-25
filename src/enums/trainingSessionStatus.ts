import {translations} from '@/lib/translations/index';

export enum TrainingSessionStatusEnum {
  PLANNED = 'planned',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export const LABELS: Record<TrainingSessionStatusEnum, string> = {
  [TrainingSessionStatusEnum.PLANNED]: translations.trainingSessions.statuses.planned,
  [TrainingSessionStatusEnum.DONE]: translations.trainingSessions.statuses.done,
  [TrainingSessionStatusEnum.CANCELLED]: translations.trainingSessions.statuses.cancelled,
};

export const getTrainingSessionStatusOptions = () =>
  Object.entries(LABELS).map(([value, label]) => ({
    value: value as TrainingSessionStatusEnum,
    label,
  }));
