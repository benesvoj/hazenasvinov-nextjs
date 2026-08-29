import {describe, expect, it} from 'vitest';

import {
  describeLineupCoverage,
  resolveAttendanceMemberIds,
} from '@/features/coach/attendance/helpers';

const CATEGORY = 'category-1';

const lineupMember = (id: string, isActive: boolean | null | undefined = true) => ({
  members: {id, category_id: CATEGORY, is_active: isActive},
});

const categoryMember = (
  id: string,
  isActive: boolean | null | undefined = true,
  categoryId = CATEGORY
) => ({id, category_id: categoryId, is_active: isActive});

describe('resolveAttendanceMemberIds', () => {
  describe('lineup as the source', () => {
    it('returns every active member of the lineup', () => {
      const ids = resolveAttendanceMemberIds({
        lineupMembers: [lineupMember('a'), lineupMember('b')],
        categoryMembers: [],
        categoryId: CATEGORY,
      });

      expect(ids).toEqual(['a', 'b']);
    });

    it('omits members deactivated after they were put on the lineup', () => {
      const ids = resolveAttendanceMemberIds({
        lineupMembers: [lineupMember('a'), lineupMember('gone', false), lineupMember('b')],
        categoryMembers: [],
        categoryId: CATEGORY,
      });

      expect(ids).toEqual(['a', 'b']);
    });

    it('skips lineup rows whose member could not be joined', () => {
      const ids = resolveAttendanceMemberIds({
        lineupMembers: [lineupMember('a'), {members: null}, {}],
        categoryMembers: [],
        categoryId: CATEGORY,
      });

      expect(ids).toEqual(['a']);
    });
  });

  describe('category fallback', () => {
    it('falls back to the category when the lineup is empty', () => {
      const ids = resolveAttendanceMemberIds({
        lineupMembers: [],
        categoryMembers: [categoryMember('a'), categoryMember('b')],
        categoryId: CATEGORY,
      });

      expect(ids).toEqual(['a', 'b']);
    });

    it('omits deactivated members from the fallback', () => {
      const ids = resolveAttendanceMemberIds({
        lineupMembers: [],
        categoryMembers: [categoryMember('a'), categoryMember('gone', false)],
        categoryId: CATEGORY,
      });

      expect(ids).toEqual(['a']);
    });

    it('ignores members of other categories', () => {
      const ids = resolveAttendanceMemberIds({
        lineupMembers: [],
        categoryMembers: [categoryMember('a'), categoryMember('other', true, 'category-2')],
        categoryId: CATEGORY,
      });

      expect(ids).toEqual(['a']);
    });

    it('falls back when the lineup holds nothing but deactivated members', () => {
      const ids = resolveAttendanceMemberIds({
        lineupMembers: [lineupMember('gone', false)],
        categoryMembers: [categoryMember('a'), categoryMember('gone', false)],
        categoryId: CATEGORY,
      });

      expect(ids).toEqual(['a']);
    });

    it('returns nothing when every candidate is deactivated', () => {
      const ids = resolveAttendanceMemberIds({
        lineupMembers: [lineupMember('gone', false)],
        categoryMembers: [categoryMember('gone', false)],
        categoryId: CATEGORY,
      });

      expect(ids).toEqual([]);
    });
  });

  describe('missing flag', () => {
    // A dropped column must not silently produce an empty attendance sheet —
    // only an explicit `false` excludes anyone.
    it.each([undefined, null])('treats is_active=%s as still active', (flag) => {
      expect(
        resolveAttendanceMemberIds({
          lineupMembers: [lineupMember('a', flag)],
          categoryMembers: [],
          categoryId: CATEGORY,
        })
      ).toEqual(['a']);

      expect(
        resolveAttendanceMemberIds({
          lineupMembers: [],
          categoryMembers: [categoryMember('a', flag)],
          categoryId: CATEGORY,
        })
      ).toEqual(['a']);
    });
  });
});

describe('describeLineupCoverage', () => {
  const named = (id: string, surname: string, isActive = true) => ({
    id,
    category_id: CATEGORY,
    is_active: isActive,
    surname,
  });
  const name = (m: {surname?: string | null; id: string}) => m.surname ?? m.id;

  it('flags a lineup that holds a fraction of the squad', () => {
    // The shape reported from production: Dorostenky had 12 active members and
    // one player on the active lineup.
    const coverage = describeLineupCoverage({
      lineupMembers: [lineupMember('a')],
      categoryMembers: [named('a', 'Na soupisce'), named('b', 'Chybi1'), named('c', 'Chybi2')],
      categoryId: CATEGORY,
      memberName: name,
    });

    expect(coverage.covered).toBe(1);
    expect(coverage.categoryTotal).toBe(3);
    expect(coverage.missing).toEqual(['Chybi1', 'Chybi2']);
    expect(coverage.isIncomplete).toBe(true);
  });

  it('does not flag a lineup that holds the whole squad', () => {
    const coverage = describeLineupCoverage({
      lineupMembers: [lineupMember('a'), lineupMember('b')],
      categoryMembers: [named('a', 'A'), named('b', 'B')],
      categoryId: CATEGORY,
      memberName: name,
    });

    expect(coverage.isIncomplete).toBe(false);
    expect(coverage.missing).toEqual([]);
  });

  it('does not flag the fallback — an empty lineup already covers everyone', () => {
    const coverage = describeLineupCoverage({
      lineupMembers: [],
      categoryMembers: [named('a', 'A'), named('b', 'B')],
      categoryId: CATEGORY,
      memberName: name,
    });

    expect(coverage.covered).toBe(2);
    expect(coverage.isIncomplete).toBe(false);
  });

  it('does not count deactivated members as missing', () => {
    const coverage = describeLineupCoverage({
      lineupMembers: [lineupMember('a')],
      categoryMembers: [named('a', 'A'), named('gone', 'Vyrazena', false)],
      categoryId: CATEGORY,
      memberName: name,
    });

    expect(coverage.categoryTotal).toBe(1);
    expect(coverage.isIncomplete).toBe(false);
  });

  it('ignores members of other categories', () => {
    const coverage = describeLineupCoverage({
      lineupMembers: [lineupMember('a')],
      categoryMembers: [
        named('a', 'A'),
        {id: 'other', category_id: 'category-2', is_active: true, surname: 'Jinde'},
      ],
      categoryId: CATEGORY,
      memberName: name,
    });

    expect(coverage.categoryTotal).toBe(1);
    expect(coverage.isIncomplete).toBe(false);
  });
});
