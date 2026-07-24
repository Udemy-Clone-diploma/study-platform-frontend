export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CertificateStatus = "valid" | "revoked";

export type CertificateIssueReason = "completion" | "manual" | "reissue";

export type CertificateStudent = {
  id: number;
  full_name: string;
  email: string;
  avatar: string | null;
};

export type CertificateCourse = {
  id: number;
  title: string;
  slug: string;
};

export type CertificateActor = {
  id: number;
  full_name: string;
};

export type Certificate = {
  id: number;
  serial: string;
  public_uuid: string;
  student: CertificateStudent;
  course: CertificateCourse;
  status: CertificateStatus;
  issued_at: string;
  issued_by: CertificateActor | null;
  issue_reason: CertificateIssueReason;
  issue_note: string;
  final_score: string | null;
  revoked_at: string | null;
  revoked_by: CertificateActor | null;
  revoke_reason: string | null;
  restored_at: string | null;
  restored_by: CertificateActor | null;
  restore_reason: string | null;
  completion_reverted: boolean;
  superseded_by: number | null;
  is_public: boolean;
  certificate_url: string | null;
  certificate_thumbnail_url: string | null;
};

export type CertificateCounts = {
  total: number;
  valid: number;
  revoked: number;
};

export type CertificateVerification = {
  serial: string;
  status: CertificateStatus;
  student_name: string;
  course_title: string;
  issued_at: string;
  revoked_at: string | null;
  superseded_by_serial: string | null;
};
