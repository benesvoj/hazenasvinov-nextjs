import {describe, expect, it, vi} from 'vitest';

import {getAllMembersOfTrainingSession} from '@/queries/memberAttendance/queries';
import {QueryContext} from '@/queries/shared/types';

type RecordedCall = {method: string; args: unknown[]};

function createSupabaseMock(result: {data: unknown[]; error: null; count: number}) {
  const calls: RecordedCall[] = [];
  const builder: Record<string, any> = {
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };

  for (const method of ['select', 'eq', 'in', 'ilike', 'order', 'range']) {
    builder[method] = vi.fn((...args: unknown[]) => {
      calls.push({method, args});
      return builder;
    });
  }

  return {ctx: {supabase: {from: vi.fn(() => builder)}} as unknown as QueryContext, calls};
}

const attendanceRow = (memberId: string, isActive: boolean) => ({
  id: `attendance-${memberId}`,
  member_id: memberId,
  attendance_status: 'present',
  member: {id: memberId, name: 'Jan', surname: 'Novák', is_active: isActive},
});

describe('getAllMembersOfTrainingSession', () => {
  it('never filters on member activity — an existing record stays readable', async () => {
    const {ctx, calls} = createSupabaseMock({data: [], error: null, count: 0});

    await getAllMembersOfTrainingSession(ctx, {filters: {training_session_id: 'session-1'}});

    const filteredColumns = calls
      .filter((call) => call.method === 'eq')
      .map((call) => call.args[0]);

    // The route hands this layer DB column names, and applyFilters passes the
    // key straight to .eq() — a camelCase key here would silently filter on a
    // column that does not exist.
    expect(filteredColumns).toContain('training_session_id');
    expect(filteredColumns).not.toContain('trainingSessionId');
    expect(filteredColumns).not.toContain('member.is_active');
    expect(filteredColumns).not.toContain('members.is_active');
    expect(filteredColumns).not.toContain('is_active');
  });

  it('returns records of deactivated members alongside active ones', async () => {
    const rows = [attendanceRow('active-member', true), attendanceRow('deactivated-member', false)];
    const {ctx} = createSupabaseMock({data: rows, error: null, count: rows.length});

    const result = await getAllMembersOfTrainingSession(ctx, {
      filters: {training_session_id: 'session-1'},
    });

    expect(result.error).toBeNull();
    expect(result.data?.map((record) => record.member_id)).toEqual([
      'active-member',
      'deactivated-member',
    ]);
  });

  it('uses a nullable join so a record survives even without member details', async () => {
    const {ctx, calls} = createSupabaseMock({data: [], error: null, count: 0});

    await getAllMembersOfTrainingSession(ctx, {filters: {training_session_id: 'session-1'}});

    const [selectCall] = calls.filter((call) => call.method === 'select');
    expect(selectCall.args[0]).toContain('member:members(');
    expect(selectCall.args[0]).not.toContain('!inner');
  });
});
