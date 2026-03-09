export type Padding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 14 | 16;

export const paddingClasses: Partial<Record<Padding, string>> = {
  0: 'p-0',
  1: 'p-1',
  2: 'p-2',
  3: 'p-3',
  4: 'p-4',
  5: 'p-5',
  6: 'p-6',
  8: 'p-8',
  10: 'p-10',
  12: 'p-12',
  14: 'p-14',
  16: 'p-16',
};
