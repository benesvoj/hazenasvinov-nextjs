export * from './admin/useExcelImport';
export * from './auth/useAuth';
export {useAuth as useAuthNew} from './auth/useAuthNew';
export * from './coach/useStrategyPreparation';
export * from './coach/useUpcomingBirthdays';
export * from './entities/attendance/useAttendance';
export * from './entities/blog/useBlogPosts';
export * from './entities/blog/useFetchBlogPost';
export * from './entities/blog/useFetchBlogPosts';
export * from './entities/blog/useFetchPostMatch';
export * from './entities/category/useCategories';
export * from './entities/category/useCategoryLineups';
export * from './entities/category/useCategoryPageData';
export * from './entities/category/useFetchCategories';
export * from './entities/category/useFetchCategoryPosts';
export * from './entities/club/useClubConfig';
export * from './entities/club/useClubs';
export * from './entities/club/useClubsNavigation';
export * from './entities/lineup/useLineupData';
export * from './entities/lineup/useLineupManager';
export * from './entities/lineup/useMatchLineupStats';
export * from './entities/match/useAllCategoriesMatches';
export * from './entities/match/useAllCategoriesOwnClubMatches';
export * from './entities/match/useCachedMatches';
export * from './entities/match/useFetchMatch';
export * from './entities/match/useFetchMatchPosts';
export * from './entities/match/useFetchMatchVideos';
export * from './entities/match/useFetchMatches';
export * from './entities/match/useFetchVideoMatch';
export * from './entities/match/useHeadToHeadMatches';
export * from './entities/match/useMatchMetadata';
export * from './entities/match/useMatchVideos';
export * from './entities/match/useOptimizedMatches';
export * from './entities/match/useOwnClubMatches';
export * from './entities/match/usePublicMatches';
export * from './entities/meetingMinute/useMeetingMinutes';
export * from './entities/member/useFetchMemberFunctions';
export * from './entities/member/useFetchMembers';
export * from './entities/member/useMemberClubRelationships';
export * from './entities/member/useMemberMetadata';
export * from './entities/member/useMembers';
export * from './entities/player/useExternalPlayerCreation';
export * from './entities/player/usePlayerLoans';
export * from './entities/player/usePlayerStats';
export * from './entities/player/useUnifiedPlayers';
export * from './entities/season/useFetchSeasons';
export * from './entities/season/useSeasons';
export * from './entities/settings/useSectionVisibility';
export * from './entities/settings/useSponsorshipData';
export * from './entities/settings/useVisiblePages';
export * from './entities/standings/useStandings';
export * from './entities/team/useFilteredTeams';
export * from './entities/team/useTeamClub';
export * from './entities/team/useTeamClubId';
export * from './entities/team/useTeamDisplayLogic';
export * from './entities/team/useTeams';
export * from './entities/user/useFetchUsers';
export * from './entities/user/useUserRoles';
export * from './entities/video/useVideos';
export {
  useMatchesWithTeams,
  useMatchesSeasonal,
  useMatchById,
  useOwnClubMatches as useOwnClubMatchesQuery,
  usePublicMatches as usePublicMatchesQuery,
  useUpcomingMatches,
  useCompletedMatches,
  useMatchesByMatchweek,
  useMatchesByDateRange,
  useCreateMatch,
  useUpdateMatch,
  useDeleteMatch,
  useOptimisticMatchUpdate,
} from './shared/queries/useMatchQueries';
export * from './shared/useDebounce';
export * from './shared/usePageVisibility';
export * from './shared/usePortalAccess';
export * from './shared/useSupabaseClient';
export * from './shared/useSupabaseServer';
