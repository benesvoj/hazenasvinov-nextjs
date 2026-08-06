import {ActionTypes, ColumnAlignType} from '@/enums';
import {ActionConfig, ColumnType, MemberExternal, MemberInternal, MemberOnLoan} from '@/types';

// Common columns shared by all member types
export const getCommonMemberColumns = (t: any) => {
  return [
    {key: 'status', label: t.table.columns.status},
    {key: 'registration_number', label: t.table.columns.registrationNumber, sortable: true},
    {key: 'name', label: t.table.columns.name, sortable: true},
    {key: 'surname', label: t.table.columns.surname, sortable: true},
    {key: 'date_of_birth', label: t.table.columns.dateOfBirth},
    {key: 'category', label: t.table.columns.category},
    {key: 'functions', label: t.table.columns.functions},
  ];
};

// Internal member columns (includes payment status)
export const getInternalMemberColumns = (
  t: any,
  actions: {
    onPayment?: (member: MemberInternal) => void;
    onDelete?: (member: MemberInternal) => void;
    onEdit?: (member: MemberInternal) => void;
    /** Soft removal — deactivates an active member, reactivates a deactivated one. */
    onToggleActive?: (member: MemberInternal) => void;
  }
): ColumnType<MemberInternal>[] => {
  const buildActions = (member: MemberInternal) =>
    [
      actions.onPayment && {type: ActionTypes.PAYMENT, onPress: actions.onPayment},
      actions.onEdit && {type: ActionTypes.UPDATE, onPress: actions.onEdit},
      actions.onToggleActive && {
        type: member.is_active ? ActionTypes.DEACTIVATE : ActionTypes.ACTIVATE,
        onPress: actions.onToggleActive,
        title: member.is_active ? t.table.actions.deactivate : t.table.actions.activate,
      },
      actions.onDelete && {type: ActionTypes.DELETE, onPress: actions.onDelete},
    ].filter((a): a is ActionConfig<MemberInternal> => Boolean(a));

  const hasActions = Boolean(
    actions.onPayment || actions.onEdit || actions.onToggleActive || actions.onDelete
  );

  return [
    ...getCommonMemberColumns(t),
    {key: 'membershipFee', label: t.table.columns.membershipFee}, // Payment column
    ...(hasActions
      ? [
          {
            key: 'actions',
            label: t.table.columns.actions,
            align: ColumnAlignType.CENTER,
            isActionColumn: true,
            actions: buildActions,
          },
        ]
      : []),
  ];
};

// External member columns (no payment status)
export const getExternalMemberColumns = (
  t: any,
  actions: {
    onEdit: (member: MemberExternal) => void;
    onDelete: (member: MemberExternal) => void;
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
        {type: ActionTypes.UPDATE, onPress: actions.onEdit},
        {type: ActionTypes.DELETE, onPress: actions.onDelete},
      ],
    },
  ];
};
