import {getMemberHelpers} from '@/features/members/helpers';
import {QueryContext} from '@/queries/shared/types';
import {MemberInsert} from '@/types';

export const updateMember = (ctx: QueryContext, id: string, data: Partial<MemberInsert>) =>
  getMemberHelpers().update(ctx, id, data);
