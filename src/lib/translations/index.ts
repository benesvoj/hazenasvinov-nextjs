import {adminTranslations} from './admin';
import {attendanceTranslations} from './attendance';
import {categoriesTranslations} from './categories';
import {clubConfigTranslations} from './clubConfig';
import {clubsTranslations} from './clubs';
import {coachCardsTranslations} from './coachCards';
import {coachPortalTranslations} from './coachPortal';
import {committeesTranslations} from './committees';
import {commonTranslations} from './common';
import {componentsTranslations} from './components';
import {matchesTranslations} from './matches';
import {membersTranslations} from './members';
import {seasonsTranslations} from './seasons';
import {trainingSessionsTranslations} from './trainingSession';

export const translations = {
  admin: adminTranslations,
  common: commonTranslations,
  matches: matchesTranslations,
  seasons: seasonsTranslations,
  attendance: attendanceTranslations,
  coachCards: coachCardsTranslations,
  coachPortal: coachPortalTranslations,
  clubs: clubsTranslations,
  committees: committeesTranslations,
  components: componentsTranslations,
  clubConfig: clubConfigTranslations,
  categories: categoriesTranslations,
  trainingSessions: trainingSessionsTranslations,
  members: membersTranslations,
} as const;
