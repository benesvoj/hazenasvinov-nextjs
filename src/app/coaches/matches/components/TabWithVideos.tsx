import {Team, Video} from '@/types';
import {CompactVideoList} from '.';

interface TabWithVideosProps {
  videosError: string | null;
  videosLoading: boolean;
  filteredOpponentVideos: Video[];
  opponentTeam: Team | null;
}
export default function TabWithVideos({
  videosError,
  videosLoading,
  filteredOpponentVideos,
  opponentTeam,
}: TabWithVideosProps) {
  return (
    <div className="p-4">
      {videosError && (
        <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 mb-4">
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
            Chyba při načítání videí: {videosError}
          </p>
        </div>
      )}
      <CompactVideoList
        videos={filteredOpponentVideos}
        loading={videosLoading}
        title={`Videa týmu ${opponentTeam?.name || 'soupeře'}`}
        emptyMessage={`Žádná videa týmu ${opponentTeam?.name || 'soupeře'} nejsou k dispozici`}
      />
    </div>
  );
}
