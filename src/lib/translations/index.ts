import {attendanceTranslations} from './attendance';
import {commonTranslations} from './common';
import {matchesTranslations} from './matches';
import {seasonsTranslations} from './seasons';

export const translations = {
  common: commonTranslations,
  matches: matchesTranslations,
  seasons: seasonsTranslations,
  attendance: attendanceTranslations,
} as const;
