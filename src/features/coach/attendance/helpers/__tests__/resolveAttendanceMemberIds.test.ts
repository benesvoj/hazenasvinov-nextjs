import {describe, expect, it} from 'vitest';

import {resolveAttendanceMemberIds} from '@/features/coach/attendance/helpers';

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
