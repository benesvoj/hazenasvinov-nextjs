import {EnhancedStanding} from '@/types';

export interface UnifiedStandingsTable {
  standings: EnhancedStanding[];
  loading?: boolean;
  categoryId?: string;
  categoryName?: string;
  showGenerateButton?: boolean;
  onGenerateStandings?: () => void;
  isSeasonClosed?: boolean;
  ownClubId?: string;
  responsive?: boolean;
  emptyContent?: React.ReactNode;
}
