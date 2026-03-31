import {getMemberHelpers} from '@/features/members/helpers';
import {QueryContext} from '@/queries/shared/types';
import {MemberInsert} from '@/types';

export const createMember = (ctx: QueryContext, data: MemberInsert) =>
  getMemberHelpers().create(ctx, data);
