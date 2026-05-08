export type ApiError = {
  message: string;
  detail?: string;
  fields: Record<string, string | string[]>;
  status?: number;
};
