import {describe, expect, it} from 'vitest';

import {
  generateInsights,
  generateRecommendations,
  selectActionableMemberStats,
} from '@/helpers/attendance/helpers';

/**
 * The helpers are `any`-typed by design (they shape loose RPC rows), and each
 * returns a union of entry shapes — only some carry `members`. Naming those
 * shapes here keeps the assertions type-checked without loosening the helpers.
 */
interface Recommendation {
  action: string;
  description: string;
  members?: {id: string; name: string; attendance_percentage: number}[];
}

interface Insight {
  title: string;
  message: string;
  members?: string[];
}

const stat = (id: string, surname: string, attendance_percentage: number, absent_count = 0) => ({
  member_id: id,
  member_name: 'Jan',
  member_surname: surname,
  attendance_percentage,
  absent_count,
  present_count: 0,
  late_count: 0,
  excused_count: 0,
  total_sessions: 22,
});

// Mirrors the real shape: a departed player keeps a low score, an active one
// scores well, so only the departed player would trip the thresholds.
const DEPARTED = stat('gone', 'Odesla', 31.82, 5);
const ACTIVE_LOW = stat('low', 'Slaba', 45.45, 4);
const ACTIVE_HIGH = stat('high', 'Silna', 95);

describe('selectActionableMemberStats', () => {
  it('keeps only members that are still active', () => {
    const result = selectActionableMemberStats(
      [DEPARTED, ACTIVE_LOW, ACTIVE_HIGH],
      ['low', 'high']
    );

    expect(result.map((s) => s.member_id)).toEqual(['low', 'high']);
  });

  it('drops everyone when nobody is active', () => {
    expect(selectActionableMemberStats([DEPARTED], [])).toEqual([]);
  });

  it('ignores active ids that have no statistics row', () => {
    const result = selectActionableMemberStats([ACTIVE_LOW], ['low', 'someone-else']);

    expect(result).toEqual([ACTIVE_LOW]);
  });

  it('does not mutate the input — the history array stays whole', () => {
    const history = [DEPARTED, ACTIVE_LOW];

    selectActionableMemberStats(history, ['low']);

    expect(history).toHaveLength(2);
  });
});

describe('generateRecommendations', () => {
  it('never asks the coach to contact a member who left', () => {
    const actionable = selectActionableMemberStats(
      [DEPARTED, ACTIVE_LOW, ACTIVE_HIGH],
      ['low', 'high']
    );

    const [contact] = generateRecommendations(actionable, {
      completion_rate: 100,
    }) as Recommendation[];

    expect(contact.action).toBe('Contact Members');
    expect(contact.description).toContain('1 member(s)');
    expect(contact.members?.map((m) => m.id)).toEqual(['low']);
  });

  it('raises no contact recommendation when only departed members scored low', () => {
    const actionable = selectActionableMemberStats([DEPARTED, ACTIVE_HIGH], ['high']);

    const actions = (
      generateRecommendations(actionable, {completion_rate: 100}) as Recommendation[]
    ).map((r) => r.action);

    expect(actions).not.toContain('Contact Members');
  });

  it('still flags a low session completion rate', () => {
    const actions = (generateRecommendations([], {completion_rate: 40}) as Recommendation[]).map(
      (r) => r.action
    );

    expect(actions).toContain('Improve Session Completion');
  });
});

describe('generateInsights', () => {
  it('never names a departed member in the low attendance alert', () => {
    const actionable = selectActionableMemberStats(
      [DEPARTED, ACTIVE_LOW, ACTIVE_HIGH],
      ['low', 'high']
    );

    const alert = (generateInsights(actionable, []) as Insight[]).find(
      (i) => i.title === 'Low Attendance Alert'
    );

    // ACTIVE_LOW sits at 45.45 %, below the 50 % threshold; DEPARTED is lower
    // still but must not be counted.
    expect(alert?.message).toContain('1 member(s)');
    expect(alert?.members).toEqual(['Jan Slaba']);
  });

  it('raises no alert when the only member below the threshold has left', () => {
    const actionable = selectActionableMemberStats([DEPARTED, ACTIVE_HIGH], ['high']);

    const titles = (generateInsights(actionable, []) as Insight[]).map((i) => i.title);

    expect(titles).not.toContain('Low Attendance Alert');
    expect(titles).toContain('Excellent Attendance');
  });
});
