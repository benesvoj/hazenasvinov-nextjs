import {getMemberHelpers} from '@/features/members/helpers';
import {QueryContext} from '@/queries/shared/types';

export const deleteMember = (ctx: QueryContext, id: string) => getMemberHelpers().delete(ctx, id);
