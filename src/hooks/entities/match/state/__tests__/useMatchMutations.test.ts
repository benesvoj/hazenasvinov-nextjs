import {act} from 'react';

import {renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {MatchStatus} from '@/enums';
import {useMatchMutations} from '@/hooks';
import {Match} from '@/types';

// --- Mock setup (vi.hoisted ensures these are available in vi.mock factories) ---

const {
  mockInsert,
  mockUpdate,
  mockDelete,
  mockEq,
  mockIn,
  mockSelect,
  mockSingle,
  mockFrom,
  mockInvalidateQueries,
  mockRefreshMaterializedView,
  mockAutoRecalculateStandings,
  mockShowToast,
} = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockIn = vi.fn();
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockFrom = vi.fn(() => ({
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    in: mockIn,
    select: mockSelect,
    single: mockSingle,
  }));
  const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
  const mockRefreshMaterializedView = vi.fn().mockResolvedValue(undefined);
  const mockAutoRecalculateStandings = vi
    .fn()
    .mockResolvedValue({success: true, recalculated: true});
  const mockShowToast = {success: vi.fn(), warning: vi.fn(), error: vi.fn()};

  return {
    mockInsert,
    mockUpdate,
    mockDelete,
    mockEq,
    mockIn,
    mockSelect,
    mockSingle,
    mockFrom,
    mockInvalidateQueries,
    mockRefreshMaterializedView,
    mockAutoRecalculateStandings,
    mockShowToast,
  };
});

// Build chainable supabase mock
function setupChainableMock() {
  // Reset chain defaults
  mockInsert.mockResolvedValue({error: null});
  mockEq.mockResolvedValue({error: null});
  mockIn.mockResolvedValue({error: null});

  // update().eq() chain
  mockUpdate.mockReturnValue({
    eq: mockEq,
    in: mockIn,
  });

  // delete().eq() chain
  mockDelete.mockReturnValue({
    eq: mockEq,
  });

  // update().eq().select().single() chain for updateMatchResult
  mockSelect.mockReturnValue({single: mockSingle});
  mockSingle.mockResolvedValue({data: {id: 'match-1'}, error: null});

  // Reset utility mocks (clearAllMocks removes implementations)
  mockRefreshMaterializedView.mockResolvedValue(undefined);
  mockInvalidateQueries.mockResolvedValue(undefined);
  mockAutoRecalculateStandings.mockResolvedValue({success: true, recalculated: true});
}

vi.mock('@/hooks/shared/useSupabaseClient', () => ({
  useSupabaseClient: () => ({from: mockFrom}),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock('@/utils/refreshMaterializedView', () => ({
  refreshMaterializedViewWithCallback: (...args: unknown[]) => mockRefreshMaterializedView(...args),
}));

vi.mock('@/utils/autoStandingsRecalculation', () => ({
  autoRecalculateStandings: (...args: unknown[]) => mockAutoRecalculateStandings(...args),
}));

vi.mock('@/components', () => ({
  showToast: mockShowToast,
}));

// --- Test data factories ---

const defaultOptions = {
  selectedCategory: 'cat-1',
  selectedSeason: 'season-1',
};

const matchInsertData = {
  category_id: 'cat-1',
  season_id: 'season-1',
  date: '2024-01-01',
  time: '15:00',
  home_team_id: 'team-1',
  away_team_id: 'team-2',
  venue: 'Stadium',
  competition: 'League',
  is_home: true,
  status: MatchStatus.UPCOMING,
  matchweek: null,
  match_number: null,
};

const originalMatch = {
  id: 'match-1',
  category_id: 'cat-1',
  season_id: 'season-1',
  home_score: 0,
  away_score: 0,
  home_score_halftime: 0,
  away_score_halftime: 0,
  matchweek: null,
} as unknown as Match;

// --- Tests ---

describe('useMatchMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupChainableMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createMatch', () => {
    it('should create match successfully', async () => {
      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.createMatch(matchInsertData);
      });

      expect(success!).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('matches');
      expect(mockInsert).toHaveBeenCalledWith(matchInsertData);
      expect(mockRefreshMaterializedView).toHaveBeenCalledWith('admin match insert');
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });

    it('should return false and set error on insert failure', async () => {
      mockInsert.mockResolvedValue({error: {message: 'Duplicate entry'}});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.createMatch(matchInsertData);
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBe('Duplicate entry');
    });

    it('should manage loading state during mutation', async () => {
      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.createMatch(matchInsertData);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('updateMatch', () => {
    const updateData = {
      home_score: 3,
      away_score: 1,
      home_score_halftime: 1,
      away_score_halftime: 0,
    };

    it('should update match and recalculate standings when scores changed', async () => {
      const onStandingsRefresh = vi.fn().mockResolvedValue(undefined);
      const {result} = renderHook(() => useMatchMutations({...defaultOptions, onStandingsRefresh}));

      let success: boolean;
      await act(async () => {
        success = await result.current.updateMatch('match-1', updateData, originalMatch);
      });

      expect(success!).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
      expect(mockEq).toHaveBeenCalledWith('id', 'match-1');
      expect(mockRefreshMaterializedView).toHaveBeenCalledWith('admin match update');
      expect(mockAutoRecalculateStandings).toHaveBeenCalledWith('match-1');
      expect(onStandingsRefresh).toHaveBeenCalled();
      expect(mockShowToast.success).toHaveBeenCalled();
    });

    it('should show warning toast when scores not updated', async () => {
      const sameScoreData = {venue: 'New Stadium'};
      const matchWithScores = {
        ...originalMatch,
        home_score: undefined,
        away_score: undefined,
        home_score_halftime: undefined,
        away_score_halftime: undefined,
      } as unknown as Match;

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      await act(async () => {
        await result.current.updateMatch('match-1', sameScoreData, matchWithScores);
      });

      expect(mockAutoRecalculateStandings).not.toHaveBeenCalled();
      expect(mockShowToast.warning).toHaveBeenCalled();
    });

    it('should show warning when standings recalculation fails', async () => {
      mockAutoRecalculateStandings.mockResolvedValue({success: false, recalculated: false});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      await act(async () => {
        await result.current.updateMatch('match-1', updateData, originalMatch);
      });

      expect(mockShowToast.warning).toHaveBeenCalled();
    });

    it('should return false on update error', async () => {
      mockEq.mockRejectedValue({message: 'Update failed'});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.updateMatch('match-1', updateData, originalMatch);
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('updateMatchResult', () => {
    const resultData = {
      home_score: 2,
      away_score: 1,
      home_score_halftime: 1,
      away_score_halftime: 0,
    };

    it('should update result, set status to completed, and recalculate standings', async () => {
      const onStandingsRefresh = vi.fn().mockResolvedValue(undefined);
      const {result} = renderHook(() => useMatchMutations({...defaultOptions, onStandingsRefresh}));

      let success: boolean;
      await act(async () => {
        success = await result.current.updateMatchResult('match-1', resultData);
      });

      expect(success!).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...resultData,
          status: 'completed',
          updated_at: expect.any(String),
        })
      );
      expect(mockAutoRecalculateStandings).toHaveBeenCalledWith('match-1');
      expect(onStandingsRefresh).toHaveBeenCalled();
      expect(mockShowToast.success).toHaveBeenCalled();
    });

    it('should show success toast without recalculation when not needed', async () => {
      mockAutoRecalculateStandings.mockResolvedValue({success: true, recalculated: false});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      await act(async () => {
        await result.current.updateMatchResult('match-1', resultData);
      });

      expect(mockShowToast.success).toHaveBeenCalled();
    });

    it('should show warning when standings recalculation fails', async () => {
      mockAutoRecalculateStandings.mockResolvedValue({success: false, recalculated: false});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      await act(async () => {
        await result.current.updateMatchResult('match-1', resultData);
      });

      expect(mockShowToast.warning).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      mockEq.mockRejectedValue({message: 'Result update failed'});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.updateMatchResult('match-1', resultData);
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('updateMatchTime', () => {
    it('should update match time successfully', async () => {
      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.updateMatchTime('match-1', {time: '18:00'});
      });

      expect(success!).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({time: '18:00'});
      expect(mockEq).toHaveBeenCalledWith('id', 'match-1');
      expect(mockRefreshMaterializedView).toHaveBeenCalledWith('admin match time update');
    });

    it('should return false on error', async () => {
      mockEq.mockRejectedValue({message: 'Time update failed'});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.updateMatchTime('match-1', {time: '18:00'});
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBe('Time update failed');
    });
  });

  describe('deleteMatch', () => {
    it('should delete match successfully', async () => {
      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.deleteMatch('match-1');
      });

      expect(success!).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('matches');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'match-1');
      expect(mockRefreshMaterializedView).toHaveBeenCalledWith('admin match delete');
    });

    it('should return false on error', async () => {
      mockEq.mockRejectedValue({message: 'Delete failed'});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.deleteMatch('match-1');
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBe('Delete failed');
    });
  });

  describe('deleteAllMatchesBySeason', () => {
    it('should delete all matches for a season', async () => {
      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.deleteAllMatchesBySeason('season-1');
      });

      expect(success!).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('season_id', 'season-1');
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });

    it('should not refresh materialized view', async () => {
      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      await act(async () => {
        await result.current.deleteAllMatchesBySeason('season-1');
      });

      expect(mockRefreshMaterializedView).not.toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      mockEq.mockRejectedValue({message: 'Bulk delete failed'});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.deleteAllMatchesBySeason('season-1');
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBe('Bulk delete failed');
    });
  });

  describe('bulkUpdateMatchweek', () => {
    const matchesWithoutMatchweek = [
      {id: 'm1', category_id: 'cat-1', matchweek: null},
      {id: 'm2', category_id: 'cat-1', matchweek: null},
      {id: 'm3', category_id: 'cat-2', matchweek: null},
    ] as unknown as Match[];

    const matchesWithMatchweek = [
      {id: 'm1', category_id: 'cat-1', matchweek: 5},
      {id: 'm2', category_id: 'cat-1', matchweek: 5},
    ] as unknown as Match[];

    it('should set matchweek for matches without one', async () => {
      mockIn.mockResolvedValue({error: null});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.bulkUpdateMatchweek(
          {categoryId: 'cat-1', matchweek: '3', action: 'set'},
          matchesWithoutMatchweek
        );
      });

      expect(success!).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({matchweek: 3});
      expect(mockIn).toHaveBeenCalledWith('id', ['m1', 'm2']);
      expect(mockRefreshMaterializedView).toHaveBeenCalledWith('admin bulk update');
    });

    it('should remove matchweek from matches', async () => {
      mockIn.mockResolvedValue({error: null});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.bulkUpdateMatchweek(
          {categoryId: 'cat-1', matchweek: '5', action: 'remove'},
          matchesWithMatchweek
        );
      });

      expect(success!).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({matchweek: null});
      expect(mockIn).toHaveBeenCalledWith('id', ['m1', 'm2']);
    });

    it('should return false when no matches found for set action', async () => {
      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.bulkUpdateMatchweek(
          {categoryId: 'cat-99', matchweek: '3', action: 'set'},
          matchesWithoutMatchweek
        );
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should return false when no matches found for remove action', async () => {
      const emptyMatches: Match[] = [];

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      let success: boolean;
      await act(async () => {
        success = await result.current.bulkUpdateMatchweek(
          {categoryId: 'cat-1', matchweek: '5', action: 'remove'},
          emptyMatches
        );
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockInsert.mockResolvedValue({error: {message: 'Database error'}});

      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      await act(async () => {
        await result.current.createMatch(matchInsertData);
      });
      expect(result.current.error).toBe('Database error');

      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate seasonal and general match queries', async () => {
      const {result} = renderHook(() => useMatchMutations(defaultOptions));

      await act(async () => {
        await result.current.createMatch(matchInsertData);
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['matches', 'seasonal', 'cat-1', 'season-1'],
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['matches'],
      });
    });

    it('should invalidate tournament queries when tournamentId provided', async () => {
      const {result} = renderHook(() =>
        useMatchMutations({...defaultOptions, tournamentId: 'tourney-1'})
      );

      await act(async () => {
        await result.current.createMatch(matchInsertData);
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['tournament-matches', 'tourney-1'],
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['tournament-standings', 'tourney-1'],
      });
    });
  });
});
