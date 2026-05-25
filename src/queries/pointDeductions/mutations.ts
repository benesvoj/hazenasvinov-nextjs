import {DB_TABLE, ENTITY} from '@/queries/pointDeductions/constants';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {PointDeduction, PointDeductionInsert} from '@/types';

let helpers: ReturnType<typeof createMutationHelpers<PointDeduction, PointDeductionInsert>> | null =
  null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<PointDeduction, PointDeductionInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createPointDeduction = (ctx: QueryContext, data: PointDeductionInsert) =>
  getHelpers().create(ctx, data);

export const updatePointDeduction = (
  ctx: QueryContext,
  id: string,
  data: Partial<PointDeductionInsert>
) => getHelpers().update(ctx, id, data);

export const deletePointDeduction = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
