import { api } from "@/shared/api/base";
import type {
  Certificate,
  CertificateCounts,
  CertificateStatus,
  CertificateVerification,
  Paginated,
} from "../model/types";

const CERTIFICATES = "certificates/";

export type GetCertificatesParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: CertificateStatus;
  course?: string;
  ordering?: string;
};

export async function getCertificates(
  params: GetCertificatesParams = {},
): Promise<Paginated<Certificate>> {
  const { data } = await api.get<Paginated<Certificate> | Certificate[]>(CERTIFICATES, { params });
  return Array.isArray(data)
    ? { count: data.length, next: null, previous: null, results: data }
    : data;
}

export type IssueCertificatePayload = {
  student: number;
  course: number;
  reason: string;
};

export async function issueCertificate(payload: IssueCertificatePayload): Promise<Certificate> {
  const { data } = await api.post<Certificate>(CERTIFICATES, payload);
  return data;
}

export async function reissueCertificate(id: number, reason: string): Promise<Certificate> {
  const { data } = await api.post<Certificate>(`${CERTIFICATES}${id}/reissue/`, { reason });
  return data;
}

export async function revokeCertificate(id: number, reason: string): Promise<Certificate> {
  const { data } = await api.post<Certificate>(`${CERTIFICATES}${id}/revoke/`, { reason });
  return data;
}

export async function setCertificatePublic(id: number, isPublic: boolean): Promise<Certificate> {
  const { data } = await api.patch<Certificate>(`${CERTIFICATES}${id}/`, { is_public: isPublic });
  return data;
}

export async function restoreCertificate(id: number, reason: string): Promise<Certificate> {
  const { data } = await api.post<Certificate>(`${CERTIFICATES}${id}/restore/`, { reason });
  return data;
}

export async function getCertificateCounts(
  params: Omit<GetCertificatesParams, "page" | "page_size" | "ordering" | "status"> = {},
): Promise<CertificateCounts> {
  const { data } = await api.get<CertificateCounts>(`${CERTIFICATES}counts/`, { params });
  return data;
}

export async function verifyCertificate(serial: string): Promise<CertificateVerification> {
  const { data } = await api.get<CertificateVerification>(
    `${CERTIFICATES}verify/${encodeURIComponent(serial)}/`,
  );
  return data;
}
