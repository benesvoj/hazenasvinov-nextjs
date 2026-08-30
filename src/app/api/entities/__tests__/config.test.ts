import {describe, expect, it} from 'vitest';

import {ENTITY_CONFIGS} from '@/app/api/entities/config';

/**
 * Tables carrying a `category_id` column, which is what the route's default
 * category resolution reads.
 *
 * Listed rather than derived: the generated DB types are erased at compile
 * time, so there is nothing to read at runtime. Adding a coach-writable entity
 * whose table is category-scoped means adding it here too — which is the point,
 * it forces the question of how a coach is confined to their own categories.
 */
const CATEGORY_SCOPED_TABLES = new Set([
  'training_sessions',
  'category_lineups',
  'members',
  'matches',
  'tournaments',
  'category_membership_fees',
]);

describe('ENTITY_CONFIGS', () => {
  describe('coach-writable entities', () => {
    const coachWritable = Object.entries(ENTITY_CONFIGS).filter(([, c]) => c.coachWritable);

    it('has at least the entities the coach portal writes to', () => {
      const names = coachWritable.map(([name]) => name);

      // A coach runs training sessions and builds lineups. training_sessions
      // was missing here, and every write from the attendance page answered 403.
      expect(names).toContain('training_sessions');
      expect(names).toContain('category_lineups');
      expect(names).toContain('category_lineup_members');
    });

    it.each(
      Object.entries(ENTITY_CONFIGS)
        .filter(([, c]) => c.coachWritable)
        .map(([name, c]) => [name, c] as const)
    )('%s can resolve a category to authorise against', (name, config) => {
      // The route confines a coach to their own categories by resolving the
      // row's category and calling hasCategoryAccess. That resolution is either
      // the entity's own categoryResolver, or the default read of a category_id
      // column. An entity with neither would let a coach write anywhere.
      const resolvable =
        Boolean(config.categoryResolver) || CATEGORY_SCOPED_TABLES.has(config.tableName);

      expect(resolvable, `${name} is coachWritable but has no way to resolve a category`).toBe(
        true
      );
    });

    it('never combines coachWritable with requiresAdmin', () => {
      for (const [name, config] of coachWritable) {
        expect(config.requiresAdmin, `${name} is both coach-writable and admin-only`).not.toBe(
          true
        );
      }
    });
  });

  describe('write support', () => {
    it.each(
      Object.entries(ENTITY_CONFIGS)
        .filter(([, c]) => c.coachWritable)
        .map(([name, c]) => [name, c] as const)
    )('%s exposes the mutations the coach routes call', (name, config) => {
      // POST/PATCH/DELETE call queryLayer.create/update/delete non-null.
      expect(config.queryLayer?.create, `${name} has no create`).toBeTypeOf('function');
      expect(config.queryLayer?.update, `${name} has no update`).toBeTypeOf('function');
      expect(config.queryLayer?.delete, `${name} has no delete`).toBeTypeOf('function');
    });
  });
});
