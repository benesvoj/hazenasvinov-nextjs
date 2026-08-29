import {describe, expect, it, vi} from 'vitest';

import {getAllCategoryLineupMembers} from '@/queries/categoryLineupMembers/queries';
import {QueryContext} from '@/queries/shared/types';

type RecordedCall = {method: string; args: unknown[]};

/**
 * Minimal chainable stand-in for a PostgrestFilterBuilder: every filter method
 * records its arguments and returns the same object, which is also awaitable.
 */
function createSupabaseMock(result = {data: [], error: null, count: 0}) {
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

  const supabase = {from: vi.fn(() => builder)};

  return {ctx: {supabase} as unknown as QueryContext, calls};
}

const eqCalls = (calls: RecordedCall[]) => calls.filter((call) => call.method === 'eq');

describe('getAllCategoryLineupMembers', () => {
  it('excludes deactivated members by default', async () => {
    const {ctx, calls} = createSupabaseMock();

    await getAllCategoryLineupMembers(ctx, {filters: {lineup_id: 'lineup-1'}});

    expect(eqCalls(calls).map((call) => call.args)).toEqual([
      ['lineup_id', 'lineup-1'],
      ['members.is_active', true],
    ]);
  });

  it('selects the member is_active flag through an inner join', async () => {
    const {ctx, calls} = createSupabaseMock();

    await getAllCategoryLineupMembers(ctx, {filters: {lineup_id: 'lineup-1'}});

    const [selectCall] = calls.filter((call) => call.method === 'select');
    expect(selectCall.args[0]).toContain('members!inner(');
    expect(selectCall.args[0]).toContain('is_active');
  });

  it('keeps deactivated members when includeInactiveMembers is set', async () => {
    const {ctx, calls} = createSupabaseMock();

    await getAllCategoryLineupMembers(ctx, {
      filters: {lineup_id: 'lineup-1', includeInactiveMembers: true},
    });

    expect(eqCalls(calls).map((call) => call.args)).toEqual([['lineup_id', 'lineup-1']]);
  });

  it('never leaks includeInactiveMembers into the column filters', async () => {
    const {ctx, calls} = createSupabaseMock();

    await getAllCategoryLineupMembers(ctx, {
      filters: {lineup_id: 'lineup-1', includeInactiveMembers: false},
    });

    expect(eqCalls(calls).map((call) => call.args[0])).not.toContain('includeInactiveMembers');
  });
});
