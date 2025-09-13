export const matchStatuses = {
  upcoming: 'Nadcházející',
  completed: 'Odehráno',
} as const;

export const matchStatusesKeys = Object.keys(matchStatuses) as Array<keyof typeof matchStatuses>;
export const matchStatusesValues = Object.values(matchStatuses);
