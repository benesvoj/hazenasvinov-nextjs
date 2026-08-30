import {describe, expect, it, vi} from 'vitest';

import {getOwnClubActiveSeasonCategories} from '@/queries/categories/queries';
import {QueryContext} from '@/queries/shared/types';

type RecordedCall = {method: string; args: unknown[]};

function createSupabaseMock(result: {data: unknown[]; error: null | {message: string}}) {
  const calls: RecordedCall[] = [];
  const builder: Record<string, any> = {
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of ['select', 'eq']) {
    builder[method] = vi.fn((...args: unknown[]) => {
      calls.push({method, args});
      return builder;
    });
  }
  return {ctx: {supabase: {from: vi.fn(() => builder)}} as unknown as QueryContext, calls};
}

const row = (id: string, name: string, sort_order: number) => ({
  categories: {id, name, sort_order, slug: name.toLowerCase()},
});

describe('getOwnClubActiveSeasonCategories', () => {
  it('narrows to the own club, the active season and live entries', async () => {
    const {ctx, calls} = createSupabaseMock({data: [], error: null});

    await getOwnClubActiveSeasonCategories(ctx);

    expect(calls.filter((c) => c.method === 'eq').map((c) => c.args)).toEqual([
      ['is_active', true],
      ['clubs.is_own_club', true],
      ['seasons.is_active', true],
    ]);
  });

  it('returns each category once when the club fields several teams in it', async () => {
    // A club can enter an A and a B team in one category, which is two
    // club_categories rows joined to the same category.
    const {ctx} = createSupabaseMock({
      data: [row('a', 'Muži', 1), row('a', 'Muži', 1), row('b', 'Dorostenci', 3)],
      error: null,
    });

    const result = await getOwnClubActiveSeasonCategories(ctx);

    expect(result.data?.map((c) => c.name)).toEqual(['Muži', 'Dorostenci']);
    expect(result.count).toBe(2);
  });

  it('orders by sort_order so the tabs do not move around', async () => {
    const {ctx} = createSupabaseMock({
      data: [row('c', 'Mladší žačky', 8), row('a', 'Muži', 1), row('b', 'Dorostenci', 3)],
      error: null,
    });

    const result = await getOwnClubActiveSeasonCategories(ctx);

    expect(result.data?.map((c) => c.name)).toEqual(['Muži', 'Dorostenci', 'Mladší žačky']);
  });

  it('falls back to the name when sort_order ties', async () => {
    const {ctx} = createSupabaseMock({
      data: [row('b', 'Ženy', 1), row('a', 'Muži', 1)],
      error: null,
    });

    const result = await getOwnClubActiveSeasonCategories(ctx);

    expect(result.data?.map((c) => c.name)).toEqual(['Muži', 'Ženy']);
  });

  it('reports an error rather than an empty list', async () => {
    // An empty list here would silently remove every tab from the home page.
    const {ctx} = createSupabaseMock({data: [], error: {message: 'boom'}});

    const result = await getOwnClubActiveSeasonCategories(ctx);

    expect(result.error).toBe('boom');
    expect(result.data).toBeNull();
  });
});
