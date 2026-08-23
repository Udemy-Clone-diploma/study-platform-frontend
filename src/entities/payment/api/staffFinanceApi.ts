import { api } from "@/shared/api/base";

import type {
  PaginatedResponse,
  TeacherFinanceBalance,
  TeacherFinanceCurrency,
  TeacherFinancePayoutStatus,
} from "./teacherFinanceApi";

const STAFF_PAYOUTS_ENDPOINT =
  "staff/finance/payouts/";

export type StaffFinancePayout = {
  id: number;
  amount: string;
  currency: TeacherFinanceCurrency;
  status: TeacherFinancePayoutStatus;

  provider: "liqpay" | "manual";
  provider_status: string;

  provider_order_id: string;
  provider_payment_id: string;
  provider_transaction_id: string;

  destination_type: string;

  failure_reason: string;
  request_uncertain: boolean;
  payout_mode: string;

  processed_at: string | null;
  created_at: string;

  teacher_id: number;
  teacher_email: string;
  teacher_name: string;
  destination_id: number;
  destination_display: string;

  created_by_id: number | null;
  created_by_email: string | null;
};

export type CreateStaffPayoutInput = {
  teacher_id: number;
  destination_id?: number;
  amount: string;
  idempotency_key: string;
};

export type StaffPayoutListParams = {
  teacher?: number;
  status?: TeacherFinancePayoutStatus;
  page?: number;
  page_size?: number;
};

export async function getStaffPayouts(
  params: StaffPayoutListParams = {},
): Promise<PaginatedResponse<StaffFinancePayout>> {
  const { data } =
    await api.get<
      PaginatedResponse<StaffFinancePayout>
    >(
      STAFF_PAYOUTS_ENDPOINT,
      {
        params: {
          page_size: 100,
          ...params,
        },
      },
    );

  return data;
}

export async function getStaffTeacherBalance(
  teacherId: number,
): Promise<TeacherFinanceBalance & {
  teacher: { id: number; name: string; email: string };
  destinations: import("./teacherFinanceApi").TeacherPayoutDestination[];
}> {
  type StaffTeacherBalance = TeacherFinanceBalance & {
    teacher: { id: number; name: string; email: string };
    destinations: import("./teacherFinanceApi").TeacherPayoutDestination[];
  };
  const { data } =
    await api.get<StaffTeacherBalance>(
      `staff/finance/teachers/${teacherId}/balance/`,
    );

  return data;
}

export async function createStaffPayout(
  input: CreateStaffPayoutInput,
): Promise<StaffFinancePayout> {
  const { data } =
    await api.post<StaffFinancePayout>(
      STAFF_PAYOUTS_ENDPOINT,
      input,
    );

  return data;
}

export async function executeStaffPayout(
  payoutId: number,
): Promise<StaffFinancePayout> {
  const { data } =
    await api.post<StaffFinancePayout>(
      `${STAFF_PAYOUTS_ENDPOINT}${payoutId}/execute/`,
    );

  return data;
}

export async function reconcileStaffPayout(
  payoutId: number,
): Promise<StaffFinancePayout> {
  const { data } =
    await api.post<StaffFinancePayout>(
      `${STAFF_PAYOUTS_ENDPOINT}${payoutId}/reconcile/`,
    );

  return data;
}
