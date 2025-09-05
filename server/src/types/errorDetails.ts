export type ErrorDetails = {
  code?: string;
  fields?: Record<string, string[]>;
  hint?: string;
  cause?: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
};
