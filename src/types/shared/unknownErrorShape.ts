export type UnknownErrorShape = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
  type?: string;
  [key: string]: unknown; // Allow extra properties for flexibility
};
