import {membersModel} from '@/features/members/model';
import {createEntityHelpers} from '@/shared/lib';
import {Member, MemberInsert} from '@/types';

export const getMemberHelpers = createEntityHelpers<Member, MemberInsert>({
  table: membersModel.table,
  entity: membersModel.entity.singular,
});
