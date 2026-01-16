import {translations} from '@/lib/translations';

const t = translations.coachPortal.trainingSessions.statuses;

export enum TrainingSessionStatusEnum {
  PLANNED = 'planned',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export const LABELS: Record<TrainingSessionStatusEnum, string> = {
  [TrainingSessionStatusEnum.PLANNED]: t.planned,
  [TrainingSessionStatusEnum.DONE]: t.done,
  [TrainingSessionStatusEnum.CANCELLED]: t.cancelled,
};

export const getTrainingSessionStatusOptions = () =>
  Object.entries(LABELS).map(([value, label]) => ({
    value: value as TrainingSessionStatusEnum,
    label,
  }));
