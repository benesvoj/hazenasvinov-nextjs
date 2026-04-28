export const membersModel = {
  table: 'members',
  entity: {
    singular: 'member',
    plural: 'members',
  },
} as const;

export type MembersTable = typeof membersModel.table;
