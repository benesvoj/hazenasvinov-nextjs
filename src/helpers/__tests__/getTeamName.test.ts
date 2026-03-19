import {describe, it, expect} from 'vitest';

import {TournamentMatch} from '@/types';

import {getTeamName} from '../getTeamName';

type TeamParam = TournamentMatch['home_team'];

const makeTeam = (
  overrides: {
    short_name?: string | null;
    name?: string;
    team_suffix?: string | null;
  } = {}
): TeamParam => ({
  id: 'team-1',
  team_suffix: overrides.team_suffix ?? null,
  club_category: {
    club: {
      id: 'club-1',
      name: overrides.name ?? 'Sokol Svinov',
      short_name: overrides.short_name ?? null,
      logo_url: null,
    },
  },
});

describe('getTeamName', () => {
  it('should return short_name when available', () => {
    const team = makeTeam({short_name: 'Svinov', name: 'TJ Sokol Svinov'});
    expect(getTeamName(team)).toBe('Svinov');
  });

  it('should fall back to full name when short_name is null', () => {
    const team = makeTeam({short_name: null, name: 'TJ Sokol Svinov'});
    expect(getTeamName(team)).toBe('TJ Sokol Svinov');
  });

  it('should append team_suffix', () => {
    const team = makeTeam({short_name: 'Svinov', team_suffix: 'B'});
    expect(getTeamName(team)).toBe('Svinov B');
  });

  it('should append team_suffix with full name fallback', () => {
    const team = makeTeam({short_name: null, name: 'Sokol Svinov', team_suffix: 'A'});
    expect(getTeamName(team)).toBe('Sokol Svinov A');
  });

  it('should handle missing club gracefully', () => {
    const team = {
      id: 'team-1',
      team_suffix: null,
      club_category: {club: undefined},
    } as unknown as TeamParam;
    expect(getTeamName(team)).toBe('');
  });

  it('should handle missing club_category gracefully', () => {
    const team = {
      id: 'team-1',
      team_suffix: 'C',
      club_category: undefined,
    } as unknown as TeamParam;
    expect(getTeamName(team)).toBe('C');
  });

  it('should trim whitespace when suffix is empty', () => {
    const team = makeTeam({short_name: 'Svinov', team_suffix: ''});
    expect(getTeamName(team)).toBe('Svinov');
  });
});
