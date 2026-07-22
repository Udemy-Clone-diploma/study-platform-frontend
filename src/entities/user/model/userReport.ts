import type { UserRole, UserStatus } from "./types";

export type UserReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "violence"
  | "sexual"
  | "fraud"
  | "impersonation"
  | "inappropriate_profile"
  | "other";

export type ReportUserPayload = {
  reason: UserReportReason;
  details?: string;
};

export type UserReportStatus = "pending" | "in_review" | "escalated" | "resolved";
export type UserReportResolution = "" | "warning" | "blocked" | "unblocked" | "dismissed";
export type ModeratorUserReportAction = "warning" | "block" | "unblock" | "escalate" | "dismiss";
export type AdminUserReportAction = "warning" | "block" | "unblock" | "dismiss";

export type UserReportUserSummary = {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  date_joined: string;
  role: UserRole;
  avatar: string | null;
  status: UserStatus;
  is_blocked: boolean;
};

export type UserReportProfileSnapshot = {
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  avatar?: string | null;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  behance?: string;
  profile?: Record<string, unknown> | null;
};

export type UserReportAuditAction = {
  id: number;
  actor: UserReportUserSummary | null;
  actor_role: UserRole | "system" | "" | null;
  action: string;
  previous_status: UserReportStatus;
  new_status: UserReportStatus;
  note: string;
  created_at: string;
};

export type ModeratedUserReport = {
  id: number;
  reported_user: UserReportUserSummary;
  reporter: UserReportUserSummary;
  reason: UserReportReason;
  reason_label: string;
  details: string;
  profile_snapshot: UserReportProfileSnapshot | null;
  status: UserReportStatus;
  resolution: UserReportResolution;
  assigned_moderator: UserReportUserSummary | null;
  assigned_at: string | null;
  escalated_by: UserReportUserSummary | null;
  escalated_at: string | null;
  escalation_note: string;
  resolved_by: UserReportUserSummary | null;
  resolved_at: string | null;
  resolution_note: string;
  created_at: string;
  updated_at: string;
  actions: UserReportAuditAction[];
};

export type PaginatedUserReports = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ModeratedUserReport[];
};

export type UserReportListParams = {
  page?: number;
  page_size?: number;
  status?: UserReportStatus;
  resolution?: Exclude<UserReportResolution, "">;
  reason?: UserReportReason;
  search?: string;
};

export type UserReportActionPayload<
  TAction extends ModeratorUserReportAction | AdminUserReportAction,
> = {
  action: TAction;
  note: string;
};
