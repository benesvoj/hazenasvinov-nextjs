import {createCRUDHook} from '@/hooks/factories';

import {createMutationHelpers} from '@/queries';
import {QueryContext} from '@/queries/shared/types';

type FeatureConfig = {
  table: string;
  entity: {
    singular: string;
    plural: string;
  };
  api: {
    root: string;
    byId: (id: string) => string;
  };
  messages: any;
};

export function createFeatureCrud<TSchema, TInsert extends Record<string, unknown>>(
  config: FeatureConfig,
  mode: 'api' | 'db' = 'api'
) {
  // API MODE (legacy)
  if (mode === 'api') {
    const factory = createCRUDHook<TSchema, TInsert>({
      baseEndpoint: config.api.root,
      byIdEndpoint: config.api.byId,
      entityName: config.entity.singular,
      messages: config.messages,
    });

    return () => {
      const crud = factory();

      return {
        create: crud.create,
        update: crud.update,
        deleteItem: crud.deleteItem,
      };
    };
  }

  // DB MODE (new)
  const mutations = createMutationHelpers<TSchema, TInsert>({
    tableName: config.table,
    entityName: config.entity.singular,
  });

  return (ctx: QueryContext) => {
    return {
      create: (data: TInsert) => mutations.create(ctx, data),
      update: (id: string, data: Partial<TInsert>) => mutations.update(ctx, id, data),
      deleteItem: (id: string) => mutations.delete(ctx, id),
    };
  };
}
