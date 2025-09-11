export const postStatuses = {
  draft: "Koncept",
  published: "Publikováno",
  archived: "Archivováno",
} as const;

export const adminStatusFilterOptions = {
  all: "Všechny stavy",
  ...postStatuses,
} as const;