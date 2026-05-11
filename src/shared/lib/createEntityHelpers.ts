import {createMutationHelpers} from '@/queries';

/** deprecated - check feature/recordings implementation */
export const createEntityHelpers = <TSchema, TInsert extends Record<string, unknown>>(config: {
  table: string;
  entity: string;
}) => {
  let instance: ReturnType<typeof createMutationHelpers<TSchema, TInsert>> | null = null;

  return () => {
    if (!instance) {
      instance = createMutationHelpers<TSchema, TInsert>({
        tableName: config.table,
        entityName: config.entity,
      });
    }
    return instance;
  };
};
