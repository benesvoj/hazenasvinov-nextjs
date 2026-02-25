import {TrainingSessionStatusEnum} from '@/enums';
import {BaseTrainingSession} from '@/types';

interface SegmentedSessions {
  upcoming: BaseTrainingSession[];
  past: BaseTrainingSession[];
  all: BaseTrainingSession[];
}

export type SessionSegment = 'upcoming' | 'past' | 'all';

export function segmentSessions(sessions: BaseTrainingSession[], today: string): SegmentedSessions {
  const upcoming = sessions
    .filter((s) => s.session_date >= today && s.status === TrainingSessionStatusEnum.PLANNED)
    .sort((a, b) => {
      const dateCompare = a.session_date.localeCompare(b.session_date);
      if (dateCompare !== 0) return dateCompare;
      return (a.session_time ?? '').localeCompare(b.session_time ?? '');
    });

  const past = sessions
    .filter((s) => s.session_date < today || s.status !== TrainingSessionStatusEnum.PLANNED)
    .sort((a, b) => b.session_date.localeCompare(a.session_date));

  return {
    upcoming,
    past,
    all: sessions,
  };
}
