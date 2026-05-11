import {translations} from '@/lib/translations';

import {TrainingSessionStatusEnum} from './trainingSessionStatus';

export function trainingSessionStatusLabels() {
  return {
    [TrainingSessionStatusEnum.PLANNED]: translations.trainingSessions.statuses.planned,
    [TrainingSessionStatusEnum.DONE]: translations.trainingSessions.statuses.done,
    [TrainingSessionStatusEnum.CANCELLED]: translations.trainingSessions.statuses.cancelled,
  };
}

export const getTrainingSessionStatusOptions = () => {
  const labels = trainingSessionStatusLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as TrainingSessionStatusEnum,
    label,
  }));
};
