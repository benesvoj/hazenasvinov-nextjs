import {describe, it, expect} from 'vitest';

import {validateAddMatchForm, validateEditMatchForm} from '@/utils';

describe('validateAddMatchForm', () => {
  it('should return error when date is missing', () => {
    const result = validateAddMatchForm({
      date: '',
      time: '15:00',
      home_team_id: '1',
      away_team_id: '2',
      venue: 'Stadium',
      category_id: '',
      season_id: '',
    });

    expect(result.valid).toBe(false);
    expect(result.field).toBe('date');
  });

  it('should return error when teams are the same', () => {
    const result = validateAddMatchForm({
      date: '2024-01-01',
      time: '15:00',
      home_team_id: '1',
      away_team_id: '1',
      venue: 'Stadium',
      category_id: '',
      season_id: '',
    });

    expect(result.valid).toBe(false);
    expect(result.field).toBe('away_team_id');
  });

  it('should pass valid form data', () => {
    const result = validateAddMatchForm({
      date: '2024-01-01',
      time: '15:00',
      home_team_id: '1',
      away_team_id: '2',
      venue: 'Stadium',
      category_id: '',
      season_id: '',
    });

    expect(result.valid).toBe(true);
  });
});
