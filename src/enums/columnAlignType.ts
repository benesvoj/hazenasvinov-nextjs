export enum ColumnAlignType {
  START = 'start',
  CENTER = 'center',
  END = 'end',
}

export const COLUMN_ALIGN_TYPE_LABELS: Record<ColumnAlignType, string> = {
  [ColumnAlignType.START]: 'start',
  [ColumnAlignType.CENTER]: 'center',
  [ColumnAlignType.END]: 'end',
};

export const getColumnTypeOptions = () => {
  return Object.entries(COLUMN_ALIGN_TYPE_LABELS).map(([value, label]) => ({
    value: value as ColumnAlignType,
    label,
  }));
};
