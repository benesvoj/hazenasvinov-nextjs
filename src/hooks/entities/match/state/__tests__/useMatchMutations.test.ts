import {act} from 'react';

import {renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {MatchStatus} from '@/enums';
import {useMatchMutations} from '@/hooks';

// Configurable mock response for insert
let mockInsertResponse: {error: {message: string} | null} = {error: null};

// Mock Supabase client with configurable responses
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve(mockInsertResponse)),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn(() => Promise.resolve({error: null})),
    })),
  }),
}));

// Mock refreshMaterializedViewWithCallback
vi.mock('@/utils/refreshMaterializedView', () => ({
  refreshMaterializedViewWithCallback: vi.fn().mockResolvedValue(undefined),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('useMatchMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to success by default
    mockInsertResponse = {error: null};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create match successfully', async () => {
    const {result} = renderHook(() =>
      useMatchMutations({
        selectedCategory: 'cat-1',
        selectedSeason: 'season-1',
      })
    );

    await act(async () => {
      const success = await result.current.createMatch({
        category_id: 'cat-1',
        season_id: 'season-1',
        date: '2024-01-01',
        time: '15:00',
        home_team_id: '1',
        away_team_id: '2',
        venue: 'Stadium',
        competition: 'League',
        is_home: true,
        status: MatchStatus.UPCOMING,
        matchweek: null,
        match_number: null,
      });

      expect(success).toBe(true);
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    // Set mock to return error for this test
    mockInsertResponse = {error: {message: 'Database error'}};

    const {result} = renderHook(() =>
      useMatchMutations({
        selectedCategory: 'cat-1',
        selectedSeason: 'season-1',
      })
    );

    await act(async () => {
      const success = await result.current.createMatch({
        category_id: 'cat-1',
        season_id: 'season-1',
        date: '2024-01-01',
        time: '15:00',
        home_team_id: '1',
        away_team_id: '2',
        venue: 'Stadium',
        competition: 'League',
        is_home: true,
        status: MatchStatus.UPCOMING,
        matchweek: null,
        match_number: null,
      });

      expect(success).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should clear error when clearError is called', async () => {
    // Set mock to return error
    mockInsertResponse = {error: {message: 'Database error'}};

    const {result} = renderHook(() =>
      useMatchMutations({
        selectedCategory: 'cat-1',
        selectedSeason: 'season-1',
      })
    );

    // Trigger error
    await act(async () => {
      await result.current.createMatch({
        category_id: 'cat-1',
        season_id: 'season-1',
        date: '2024-01-01',
        time: '15:00',
        home_team_id: '1',
        away_team_id: '2',
        venue: 'Stadium',
        competition: 'League',
        is_home: true,
        status: MatchStatus.UPCOMING,
        matchweek: null,
        match_number: null,
      });
    });

    expect(result.current.error).toBeTruthy();

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
