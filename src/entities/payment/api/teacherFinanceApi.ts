import { api } from "@/shared/api/base";

const TEACHER_FINANCE_ENDPOINT = "teacher/finance/";

export type TeacherFinanceCurrency = "USD";

export type TeacherFinanceBalance = {
  currency: TeacherFinanceCurrency;
  earned: string;
  refunded: string;
  paid: string;
  adjustments: string;
  reserved: string;
  balance: string;
  available: string;
};

export type TeacherLedgerEntryType = "earning" | "refund" | "payout" | "adjustment";

export type TeacherLedgerEntryStatus = "pending" | "posted" | "void";

export type TeacherLedgerEntry = {
  id: number;
  entry_type: TeacherLedgerEntryType;
  status: TeacherLedgerEntryStatus;
  amount: string;
  currency: TeacherFinanceCurrency;
  payment_id: number | null;
  refund_id: number | null;
  payout_id: number | null;
  description: string;
  posted_at: string | null;
  created_at: string;
};

export type TeacherFinancePayoutStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export type TeacherFinancePayout = {
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
};

export type TeacherPayoutDestination = {
  id: number;
  provider: "liqpay";
  destination_type: "bank_account" | "card_token";
  receiver_account_masked: string;
  has_card_token: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateTeacherPayoutDestinationInput =
  | {
      destination_type: "bank_account";
      receiver_account: string;
      receiver_mfo: string;
      receiver_okpo: string;
      receiver_company: string;
      is_default?: boolean;
    }
  | {
      destination_type: "card_token";
      receiver_card_token: string;
      is_default?: boolean;
    };

export type UpdateTeacherPayoutDestinationInput = {
  destination_type?: "bank_account" | "card_token";

  receiver_account?: string;
  receiver_mfo?: string;
  receiver_okpo?: string;
  receiver_company?: string;
  receiver_card_token?: string;

  is_default?: boolean;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function getTeacherFinanceBalance(): Promise<TeacherFinanceBalance> {
  const { data } = await api.get<TeacherFinanceBalance>(`${TEACHER_FINANCE_ENDPOINT}balance/`);

  return data;
}

export async function getTeacherFinanceLedger(): Promise<PaginatedResponse<TeacherLedgerEntry>> {
  const { data } = await api.get<PaginatedResponse<TeacherLedgerEntry>>(
    `${TEACHER_FINANCE_ENDPOINT}ledger/`,
    {
      params: {
        page_size: 100,
      },
    },
  );

  return data;
}

export async function getTeacherFinancePayouts(): Promise<PaginatedResponse<TeacherFinancePayout>> {
  const { data } = await api.get<PaginatedResponse<TeacherFinancePayout>>(
    `${TEACHER_FINANCE_ENDPOINT}payouts/`,
    {
      params: {
        page_size: 100,
      },
    },
  );

  return data;
}

export async function getTeacherPayoutDestinations(): Promise<
  PaginatedResponse<TeacherPayoutDestination>
> {
  const { data } = await api.get<PaginatedResponse<TeacherPayoutDestination>>(
    `${TEACHER_FINANCE_ENDPOINT}destinations/`,
    {
      params: {
        page_size: 100,
      },
    },
  );

  return data;
}

export async function createTeacherPayoutDestination(
  input: CreateTeacherPayoutDestinationInput,
): Promise<TeacherPayoutDestination> {
  const { data } = await api.post<TeacherPayoutDestination>(
    `${TEACHER_FINANCE_ENDPOINT}destinations/`,
    input,
  );

  return data;
}

export async function updateTeacherPayoutDestination(
  destinationId: number,
  input: UpdateTeacherPayoutDestinationInput,
): Promise<TeacherPayoutDestination> {
  const { data } = await api.patch<TeacherPayoutDestination>(
    `${TEACHER_FINANCE_ENDPOINT}destinations/${destinationId}/`,
    input,
  );

  return data;
}

export async function deleteTeacherPayoutDestination(destinationId: number): Promise<void> {
  await api.delete(`${TEACHER_FINANCE_ENDPOINT}destinations/${destinationId}/`);
}
