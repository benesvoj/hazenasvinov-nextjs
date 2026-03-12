import {adminTranslations} from './admin';
import {attendanceTranslations} from './attendance';
import {authTranslations} from './auth';
import {bettingTranslations} from './betting';
import {blogPostsTranslation} from './blogPosts';
import {categoriesTranslations} from './categories';
import {clubCategoriesTranslations} from './clubCategories';
import {clubConfigTranslations} from './clubConfig';
import {clubsTranslations} from './clubs';
import {coachCardsTranslations} from './coachCards';
import {coachPortalTranslations} from './coachPortal';
import {commentsTranslations} from './comments';
import {committeesTranslations} from './committees';
import {commonTranslations} from './common';
import {componentsTranslations} from './components';
import {grantCalendarTranslations} from './grantCalendar';
import {lineupManagerTranslations} from './lineupManager';
import {lineupMembersTranslations} from './lineupMember';
import {lineupsTranslations} from './lineups';
import {matchesTranslations} from './matches';
import {matchRecordingsTranslations} from './matchRecordings';
import {meetingMinutesTranslations} from './meetingMinutes';
import {memberClubRelationshipTranslations} from './memberClubRelationship';
import {memberFunctionsTranslations} from './memberFunctions';
import {membersTranslations} from './members';
import {membershipFeesTranslations} from './membershipFees';
import {photoGalleryTranslations} from './photoGallery';
import {publicTranslations} from './public';
import {seasonsTranslations} from './seasons';
import {sponsorshipTranslations} from './sponsorship';
import {teamsTranslations} from './teams';
import {todosTranslations} from './todos';
import {topBarTranslations} from './topBar';
import {tournamentsTranslations} from './tournaments';
import {trainingSessionsTranslations} from './trainingSession';
import {userRolesTranslations} from './userRoles';
import {usersTranslations} from './users';

export const translations = {
  admin: adminTranslations,
  auth: authTranslations,
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
  meetingMinutes: meetingMinutesTranslations,
  topBar: topBarTranslations,
  public: publicTranslations,
  lineups: lineupsTranslations,
  todos: todosTranslations,
  matchRecordings: matchRecordingsTranslations,
  betting: bettingTranslations,
  blogPosts: blogPostsTranslation,
  comments: commentsTranslations,
  membershipFees: membershipFeesTranslations,
  teams: teamsTranslations,
  clubCategories: clubCategoriesTranslations,
  grantCalendar: grantCalendarTranslations,
  lineupManager: lineupManagerTranslations,
  memberFunctions: memberFunctionsTranslations,
  sponsorship: sponsorshipTranslations,
  lineupMembers: lineupMembersTranslations,
  memberClubRelationship: memberClubRelationshipTranslations,
  users: usersTranslations,
  photoGallery: photoGalleryTranslations,
  userRoles: userRolesTranslations,
  tournaments: tournamentsTranslations,
} as const;
