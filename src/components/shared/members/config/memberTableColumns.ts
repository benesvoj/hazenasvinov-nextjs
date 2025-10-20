import {ActionTypes, ColumnAlignType} from '@/enums';
import {ColumnType, MemberExternal, MemberInternal, MemberOnLoan} from '@/types';

// Common columns shared by all member types
export const getCommonMemberColumns = (t: any) => {
  return [
    {key: 'status', label: t.table.columns.status},
    {key: 'registration_number', label: t.table.columns.registrationNumber},
    {key: 'name', label: t.table.columns.name},
    {key: 'surname', label: t.table.columns.surname},
    {key: 'date_of_birth', label: t.table.columns.dateOfBirth},
    {key: 'category', label: t.table.columns.category},
    {key: 'sex', label: t.table.columns.gender},
    {key: 'functions', label: t.table.columns.functions},
  ];
};

// Internal member columns (includes payment status)
export const getInternalMemberColumns = (
  t: any,
  actions: {
    onEdit: (member: MemberInternal) => void;
    onDelete: (member: MemberInternal) => void;
    onDetail: (member: MemberInternal) => void;
  }
): ColumnType<MemberInternal>[] => {
  return [
    ...getCommonMemberColumns(t),
    {key: 'membershipFee', label: t.table.columns.membershipFee}, // Payment column
    {
      key: 'actions',
      label: t.table.columns.actions,
      align: ColumnAlignType.CENTER,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.READ, onPress: actions.onDetail},
        {type: ActionTypes.UPDATE, onPress: actions.onEdit},
        {type: ActionTypes.DELETE, onPress: actions.onDelete},
      ],
    },
  ];
};

// External member columns (no payment status)
export const getExternalMemberColumns = (
  t: any,
  actions: {
    onEdit: (member: MemberExternal) => void;
    onDelete: (member: MemberExternal) => void;
    onDetail: (member: MemberExternal) => void;
  }
): ColumnType<MemberExternal>[] => {
  return [
    ...getCommonMemberColumns(t),
    {key: 'origin_club_name', label: t.table.columns.originClub},
    {
      key: 'actions',
      label: t.table.columns.actions,
      align: ColumnAlignType.CENTER,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.READ, onPress: actions.onDetail},
        {type: ActionTypes.UPDATE, onPress: actions.onEdit},
        {type: ActionTypes.DELETE, onPress: actions.onDelete},
      ],
    },
  ];
};

// On loan member columns (no payment status)
export const getOnLoanMemberColumns = (
  t: any,
  actions: {
    onEdit: (member: MemberOnLoan) => void;
    onDelete: (member: MemberOnLoan) => void;
    onDetail: (member: MemberOnLoan) => void;
  }
): ColumnType<MemberOnLoan>[] => {
  return [
    ...getCommonMemberColumns(t),
    {key: 'origin_club_name', label: t.table.columns.originClub || 'Původní klub'},
    {key: 'valid_from', label: t.table.columns.validFrom || 'Platný od'},
    {key: 'valid_to', label: t.table.columns.validTo || 'Platný do'},
    {
      key: 'actions',
      label: t.table.columns.actions,
      align: ColumnAlignType.CENTER,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.READ, onPress: actions.onDetail},
        {type: ActionTypes.UPDATE, onPress: actions.onEdit},
        {type: ActionTypes.DELETE, onPress: actions.onDelete},
      ],
    },
  ];
};
