"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Calendar, ChevronDown, Flag, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PageShell } from "@/shared/ui/PageShell";
import { PillSelect } from "@/shared/ui/PillSelect";
import { DatePicker } from "@/shared/ui/DatePicker";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import { StudentAvatar } from "@/shared/ui/StudentAvatar";

import {
  getTeacherOrders,
  downloadTeacherOrderInvoice,
  getTeacherPayoutStatus,
  refreshTeacherPayoutStatus,
  startTeacherPayoutOnboarding,
  getTeacherStripeFinance,
  getTeacherFinanceBalance,
  getTeacherFinanceLedger,
  getTeacherFinancePayouts,
  getTeacherPayoutDestinations,
  createTeacherPayoutDestination,
  updateTeacherPayoutDestination,
  deleteTeacherPayoutDestination,
} from "@/entities/payment";

import type {
  TeacherPayoutStatus,
  TeacherStripeFinance,
  TeacherOrderRow,
  TeacherOrderStatus,
  TeacherOrdersCourseOption,
  TeacherOrdersCohortOption,
  TeacherFinanceBalance,
  TeacherFinancePayout,
  TeacherLedgerEntry,
  TeacherPayoutDestination,
} from "@/entities/payment";

const ALL_COURSES = "__all__";
const ALL_GROUPS = "__all__";
const ALL_STATUSES = "__all__";
const FILTER_ICON_SIZE = {
  width: "clamp(14px, 1.11vw, 16px)",
  height: "clamp(14px, 1.11vw, 16px)",
  color: "var(--color-blue)",
};

function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

/** Pill-styled trigger (matches PillSelect) that opens a from/to DatePicker pair in one popover. */
function DateRangeFilter({
  from,
  to,
  onChangeFrom,
  onChangeTo,
}: {
  from: string;
  to: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
}) {
  const t = useTranslations("TeacherPaymentsPage");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const label =
    from || to
      ? `${from ? formatShort(from) : "…"} – ${to ? formatShort(to) : "…"}`
      : t("dateRangeLabel");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-[10px] bg-white text-(--color-text-primary) transition-opacity hover:opacity-80"
        style={{
          height: "clamp(32px, 2.78vw, 40px)",
          padding: "clamp(6px, 0.56vw, 8px) clamp(12px, 1.11vw, 16px)",
          boxShadow: "0px 0px 4px rgba(72, 70, 70, 0.16)",
          borderRadius: "clamp(16px, 1.39vw, 20px)",
          fontFamily: "var(--font-base)",
          fontSize: "clamp(13px, 1.11vw, 20px)",
          whiteSpace: "nowrap",
        }}
      >
        <Calendar style={FILTER_ICON_SIZE} />
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          style={{
            ...FILTER_ICON_SIZE,
            color: "var(--color-text-primary)",
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 z-50 flex flex-col bg-white"
          style={{
            top: "calc(100% + 6px)",
            gap: 12,
            borderRadius: 16,
            padding: 16,
            boxShadow: "var(--shadow-sort-dropdown)",
          }}
        >
          <div className="flex" style={{ gap: 16 }}>
            <DatePicker
              value={from}
              onChange={onChangeFrom}
              label={t("fromLabel")}
              max={to || undefined}
              size="sm"
            />
            <DatePicker
              value={to}
              onChange={onChangeTo}
              label={t("toLabel")}
              min={from || undefined}
              size="sm"
            />
          </div>
          {(from || to) && (
            <button
              type="button"
              onClick={() => {
                onChangeFrom("");
                onChangeTo("");
              }}
              className="self-start text-(--color-blue) hover:underline"
              style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.83vw, 14px)" }}
            >
              {t("clear")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: TeacherOrderStatus }) {
  const t = useTranslations("TeacherPaymentsPage");

  const config = {
    paid: {
      label: t("statusPaid"),
      background: "var(--color-brand-lavender-soft)",
      color: "var(--color-blue)",
    },
    unpaid: {
      label: t("statusUnpaid"),
      background: "var(--color-brand-yellow)",
      color: "var(--color-yellow-dark)",
    },
    overdue: {
      label: t("statusOverdue"),
      background: "var(--color-error-surface)",
      color: "var(--color-rejected)",
    },
    refunded: {
      label: t("statusRefunded"),
      background: "#E5E7EB",
      color: "#374151",
    },
    partially_refunded: {
      label: t("statusPartiallyRefunded"),
      background: "#FEF3C7",
      color: "#92400E",
    },
  } satisfies Record<
    TeacherOrderStatus,
    {
      label: string;
      background: string;
      color: string;
    }
  >;

  const current = config[status];

  return (
    <span
      style={{
        background: current.background,
        color: current.color,
        fontFamily: "var(--font-accent)",
        fontWeight: 500,
        fontSize: "clamp(11px, 0.78vw, 15px)",
        borderRadius: 4,
        padding: "2px 10px",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {current.label}
    </span>
  );
}

function ReceiptButton({ orderId }: { orderId: number }) {
  const t = useTranslations("TeacherPaymentsPage");
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const pdf = await downloadTeacherOrderInvoice(orderId);
      const url = window.URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch {
      // Swallow -- the button just stays clickable so the teacher can retry.
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-full border border-(--color-text-primary) disabled:opacity-50"
      style={{
        height: "clamp(28px, 2.22vw, 32px)",
        padding: "0 clamp(10px, 0.83vw, 12px)",
        fontFamily: "var(--font-accent)",
        fontSize: "clamp(12px, 0.78vw, 15px)",
        fontWeight: 500,
      }}
    >
      {t("receiptButton")}
    </button>
  );
}

function LiqPayDestinationManager({
  destinations,
  onChanged,
}: {
  destinations: TeacherPayoutDestination[];
  onChanged: () => Promise<void>;
}) {
  const t = useTranslations("TeacherPaymentsPage");

  const [formOpen, setFormOpen] = useState(false);

  const [destinationType, setDestinationType] =
    useState<TeacherPayoutDestination["destination_type"]>("bank_account");

  const [receiverAccount, setReceiverAccount] = useState("");

  const [receiverMfo, setReceiverMfo] = useState("");

  const [receiverOkpo, setReceiverOkpo] = useState("");

  const [receiverCompany, setReceiverCompany] = useState("");

  const [receiverCardToken, setReceiverCardToken] = useState("");

  const [makeDefault, setMakeDefault] = useState(false);

  const [saving, setSaving] = useState(false);

  const [actionDestinationId, setActionDestinationId] = useState<number | null>(null);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  function clearForm() {
    setDestinationType("bank_account");
    setReceiverAccount("");
    setReceiverMfo("");
    setReceiverOkpo("");
    setReceiverCompany("");
    setReceiverCardToken("");
    setMakeDefault(false);
  }

  function openForm() {
    clearForm();

    setMakeDefault(!destinations.some((destination) => destination.is_default));

    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    clearForm();
    setError("");
    setFormOpen(false);
  }

  async function handleCreateDestination() {
    if (saving) {
      return;
    }

    setError("");
    setMessage("");

    if (destinationType === "bank_account") {
      if (
        !receiverAccount.trim() ||
        !receiverMfo.trim() ||
        !receiverOkpo.trim() ||
        !receiverCompany.trim()
      ) {
        setError(t("liqPayDestinationRequired"));
        return;
      }
    }

    if (destinationType === "card_token" && !receiverCardToken.trim()) {
      setError(t("liqPayDestinationRequired"));
      return;
    }

    setSaving(true);

    try {
      if (destinationType === "bank_account") {
        await createTeacherPayoutDestination({
          destination_type: "bank_account",

          receiver_account: receiverAccount.trim(),

          receiver_mfo: receiverMfo.trim(),

          receiver_okpo: receiverOkpo.trim(),

          receiver_company: receiverCompany.trim(),

          is_default: makeDefault,
        });
      } else {
        await createTeacherPayoutDestination({
          destination_type: "card_token",

          receiver_card_token: receiverCardToken.trim(),

          is_default: makeDefault,
        });
      }

      clearForm();
      setFormOpen(false);

      await onChanged();

      setMessage(t("liqPayDestinationSaved"));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("liqPayDestinationError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(destination: TeacherPayoutDestination) {
    if (destination.is_default || actionDestinationId !== null) {
      return;
    }

    setError("");
    setMessage("");
    setActionDestinationId(destination.id);

    try {
      await updateTeacherPayoutDestination(destination.id, {
        is_default: true,
      });

      await onChanged();

      setMessage(t("liqPayDestinationDefaultChanged"));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("liqPayDestinationError"));
    } finally {
      setActionDestinationId(null);
    }
  }

  async function handleDelete(destination: TeacherPayoutDestination) {
    if (actionDestinationId !== null) {
      return;
    }

    const confirmed = window.confirm(t("liqPayDestinationDeleteConfirm"));

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");
    setActionDestinationId(destination.id);

    try {
      await deleteTeacherPayoutDestination(destination.id);

      await onChanged();

      setMessage(t("liqPayDestinationDeleted"));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("liqPayDestinationError"));
    } finally {
      setActionDestinationId(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{t("liqPayDestinationTitle")}</h3>

          <p className="mt-1 text-xs text-(--color-text-secondary)">
            {t("liqPayDestinationDescription")}
          </p>
        </div>

        {!formOpen ? (
          <button
            type="button"
            onClick={openForm}
            className="rounded-full border border-(--color-blue) px-4 py-2 text-sm text-(--color-blue) transition-opacity hover:opacity-75"
          >
            {t("liqPayDestinationAdd")}
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}

      {!destinations.length && !formOpen ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">{t("liqPayDestinationEmpty")}</p>
        </div>
      ) : null}

      {destinations.length ? (
        <div className="mt-3 flex flex-col gap-2">
          {destinations.map((destination) => {
            const busy = actionDestinationId === destination.id;

            return (
              <div
                key={destination.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E5E5] p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {destination.destination_type === "bank_account"
                        ? t("liqPayDestinationBankAccount")
                        : t("liqPayDestinationCardToken")}
                    </span>

                    {destination.is_default ? (
                      <span className="rounded-full bg-(--color-brand-lavender-soft) px-2 py-0.5 text-xs text-(--color-blue)">
                        {t("liqPayDestinationDefaultBadge")}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 break-all text-sm text-(--color-text-secondary)">
                    {destination.destination_type === "bank_account"
                      ? destination.receiver_account_masked || "—"
                      : destination.has_card_token
                        ? t("liqPayDestinationTokenConfigured")
                        : "—"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!destination.is_default ? (
                    <button
                      type="button"
                      onClick={() => void handleSetDefault(destination)}
                      disabled={busy}
                      className="rounded-full border border-(--color-blue) px-3 py-1.5 text-xs text-(--color-blue) disabled:opacity-50"
                    >
                      {t("liqPayDestinationSetDefault")}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void handleDelete(destination)}
                    disabled={busy}
                    className="rounded-full border border-red-300 px-3 py-1.5 text-xs text-red-600 disabled:opacity-50"
                  >
                    {t("liqPayDestinationRemove")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {formOpen ? (
        <div className="mt-4 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-4">
          <h4 className="text-sm font-semibold">{t("liqPayDestinationNew")}</h4>

          <div className="mt-4">
            <label className="text-xs font-medium text-(--color-text-secondary)">
              {t("liqPayDestinationType")}
            </label>

            <select
              value={destinationType}
              onChange={(event) => {
                setDestinationType(
                  event.target.value as TeacherPayoutDestination["destination_type"],
                );

                setError("");
              }}
              className="mt-1 h-10 w-full rounded-xl border border-[#D9D9D9] bg-white px-3 text-sm outline-none"
            >
              <option value="bank_account">{t("liqPayDestinationBankAccount")}</option>

              <option value="card_token">{t("liqPayDestinationCardToken")}</option>
            </select>
          </div>

          {destinationType === "bank_account" ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-(--color-text-secondary)">
                  {t("liqPayDestinationAccount")}
                </span>

                <input
                  type="text"
                  value={receiverAccount}
                  onChange={(event) => setReceiverAccount(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-10 rounded-xl border border-[#D9D9D9] bg-white px-3 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-(--color-text-secondary)">
                  {t("liqPayDestinationMfo")}
                </span>

                <input
                  type="text"
                  value={receiverMfo}
                  onChange={(event) => setReceiverMfo(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-10 rounded-xl border border-[#D9D9D9] bg-white px-3 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-(--color-text-secondary)">
                  {t("liqPayDestinationOkpo")}
                </span>

                <input
                  type="text"
                  value={receiverOkpo}
                  onChange={(event) => setReceiverOkpo(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-10 rounded-xl border border-[#D9D9D9] bg-white px-3 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-(--color-text-secondary)">
                  {t("liqPayDestinationCompany")}
                </span>

                <input
                  type="text"
                  value={receiverCompany}
                  onChange={(event) => setReceiverCompany(event.target.value)}
                  autoComplete="off"
                  className="h-10 rounded-xl border border-[#D9D9D9] bg-white px-3 text-sm outline-none"
                />
              </label>
            </div>
          ) : (
            <div className="mt-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-(--color-text-secondary)">
                  {t("liqPayDestinationToken")}
                </span>

                <input
                  type="text"
                  value={receiverCardToken}
                  onChange={(event) => setReceiverCardToken(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-10 rounded-xl border border-[#D9D9D9] bg-white px-3 text-sm outline-none"
                />
              </label>

              <p className="mt-2 text-xs text-(--color-text-secondary)">
                {t("liqPayDestinationTokenHint")}
              </p>
            </div>
          )}

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={makeDefault}
              onChange={(event) => setMakeDefault(event.target.checked)}
            />

            <span>{t("liqPayDestinationMakeDefault")}</span>
          </label>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCreateDestination()}
              disabled={saving}
              className="rounded-full bg-(--color-blue) px-5 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? t("liqPayDestinationSaving") : t("liqPayDestinationSave")}
            </button>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-full border border-[#D9D9D9] bg-white px-5 py-2 text-sm disabled:opacity-50"
            >
              {t("liqPayDestinationCancel")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TeacherPaymentsPage() {
  const t = useTranslations("TeacherPaymentsPage");
  const tCommon = useTranslations("Common");
  const tStudentsPanel = useTranslations("TeacherStudentsPanel");
  const locale = useLocale();

  const STATUS_OPTIONS = [
    { value: ALL_STATUSES, label: tCommon("all") },
    { value: "paid", label: t("statusPaid") },
    { value: "unpaid", label: t("statusUnpaid") },
    { value: "overdue", label: t("statusOverdue") },
    { value: "refunded", label: t("statusRefunded") },
    { value: "partially_refunded", label: t("statusPartiallyRefunded") },
  ];

  const [courses, setCourses] = useState<TeacherOrdersCourseOption[]>([]);

  const [cohorts, setCohorts] = useState<TeacherOrdersCohortOption[]>([]);

  const [rows, setRows] = useState<TeacherOrderRow[]>([]);

  const [selectedCourse, setSelectedCourse] = useState(ALL_COURSES);

  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS);

  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUSES);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [liqPayBalance, setLiqPayBalance] = useState<TeacherFinanceBalance | null>(null);

  const [liqPayLedger, setLiqPayLedger] = useState<TeacherLedgerEntry[]>([]);

  const [liqPayPayouts, setLiqPayPayouts] = useState<TeacherFinancePayout[]>([]);

  const [liqPayDestinations, setLiqPayDestinations] = useState<TeacherPayoutDestination[]>([]);

  const [liqPayFinanceLoading, setLiqPayFinanceLoading] = useState(true);

  const [liqPayFinanceError, setLiqPayFinanceError] = useState("");

  // Stripe Connect account status
  const [payout, setPayout] = useState<TeacherPayoutStatus | null>(null);

  const [payoutLoading, setPayoutLoading] = useState(true);

  const [payoutError, setPayoutError] = useState("");

  // Stripe connected-account balance + real Stripe payouts
  const [stripeFinance, setStripeFinance] = useState<TeacherStripeFinance | null>(null);

  const [stripeFinanceLoading, setStripeFinanceLoading] = useState(true);

  const [stripeFinanceError, setStripeFinanceError] = useState("");

  // Load / refresh Stripe Connect account status
  useEffect(() => {
    let cancelled = false;

    const returnedFromStripe = new URLSearchParams(window.location.search).has("stripe");

    const request = returnedFromStripe ? refreshTeacherPayoutStatus() : getTeacherPayoutStatus();

    setPayoutLoading(true);
    setPayoutError("");

    request
      .then((data) => {
        if (!cancelled) {
          setPayout(data);
        }
      })
      .catch((error: { message?: string }) => {
        if (!cancelled) {
          setPayoutError(error.message ?? "Could not load payout status.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPayoutLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Start / continue Stripe Connect onboarding
  async function setupPayouts() {
    if (payoutLoading) {
      return;
    }

    setPayoutLoading(true);
    setPayoutError("");

    try {
      const result = await startTeacherPayoutOnboarding();

      if (!result.onboarding_url) {
        throw new Error("Stripe onboarding URL is unavailable.");
      }

      window.location.assign(result.onboarding_url);
    } catch (error) {
      setPayoutError(error instanceof Error ? error.message : "Could not start payout setup.");

      setPayoutLoading(false);
    }
  }

  async function loadLiqPayFinance() {
    setLiqPayFinanceLoading(true);
    setLiqPayFinanceError("");

    try {
      const [balance, ledger, payouts, destinations] = await Promise.all([
        getTeacherFinanceBalance(),
        getTeacherFinanceLedger(),
        getTeacherFinancePayouts(),
        getTeacherPayoutDestinations(),
      ]);

      setLiqPayBalance(balance);
      setLiqPayLedger(ledger.results);
      setLiqPayPayouts(payouts.results);
      setLiqPayDestinations(destinations.results.filter((item) => item.is_active));
    } catch (error) {
      setLiqPayFinanceError(
        error instanceof Error ? error.message : "Could not load LiqPay finance.",
      );
    } finally {
      setLiqPayFinanceLoading(false);
    }
  }
  // Load Stripe balance + payout history
  useEffect(() => {
    let cancelled = false;

    setStripeFinanceLoading(true);
    setStripeFinanceError("");

    getTeacherStripeFinance()
      .then((data) => {
        if (!cancelled) {
          setStripeFinance(data);
        }
      })
      .catch((error: { message?: string }) => {
        if (!cancelled) {
          setStripeFinanceError(error.message ?? "Could not load Stripe balance.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStripeFinanceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadLiqPayDestinations() {
    const destinations = await getTeacherPayoutDestinations();

    setLiqPayDestinations(destinations.results.filter((item) => item.is_active));
  }

  // Load teacher orders
  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    getTeacherOrders({
      course: selectedCourse !== ALL_COURSES ? selectedCourse : undefined,

      cohort: selectedGroup !== ALL_GROUPS ? Number(selectedGroup) : undefined,

      status: selectedStatus !== ALL_STATUSES ? (selectedStatus as TeacherOrderStatus) : undefined,

      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      search: search || undefined,
    })
      .then((res) => {
        if (cancelled) return;

        setRows(res.results);
        setCourses(res.courses);
        setCohorts(res.cohorts);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCourse, selectedGroup, selectedStatus, dateFrom, dateTo, search]);

  useEffect(() => {
    void loadLiqPayFinance();
  }, []);

  function handleCourseChange(slug: string) {
    setSelectedGroup(ALL_GROUPS);
    setSelectedCourse(slug);
  }

  const courseOptions = [
    {
      value: ALL_COURSES,
      label: tCommon("allCourses"),
    },
    ...courses.map((course) => ({
      value: course.slug,
      label: course.title,
    })),
  ];

  const groupOptions = [
    {
      value: ALL_GROUPS,
      label: tStudentsPanel("allGroups"),
    },
    ...cohorts.map((cohort) => ({
      value: String(cohort.id),
      label: cohort.name,
    })),
  ];

  const columns: DataTableColumn<TeacherOrderRow>[] = [
    {
      key: "student",
      label: t("columnStudent"),
      flex: 3,
      render: (row) => (
        <div
          className="flex items-center"
          style={{
            gap: "clamp(8px, 0.83vw, 12px)",
          }}
        >
          <StudentAvatar name={row.student_name} avatar={row.student_avatar} />

          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {row.student_name}
          </span>
        </div>
      ),
    },
    {
      key: "group",
      label: t("columnGroup"),
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <span>{row.cohort_name ?? "—"}</span>,
    },
    {
      key: "plan",
      label: t("columnPaymentPlan"),
      flex: 1.5,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <span>{row.payment_plan}</span>,
    },
    {
      key: "status",
      label: t("columnStatus"),
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "amount",
      label: t("columnAmount"),
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span>
          {row.amount} {row.currency}
        </span>
      ),
    },
    {
      key: "date",
      label: t("columnDate"),
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => <span>{new Date(row.date).toLocaleDateString(locale)}</span>,
    },
    {
      key: "due_date",
      label: t("columnDueDate"),
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (
        <span>{row.due_date ? new Date(row.due_date).toLocaleDateString(locale) : "—"}</span>
      ),
    },
    {
      key: "receipt",
      label: t("columnReceipt"),
      flex: 1,
      cellAlign: "center",
      headerAlign: "center",
      render: (row) => (row.has_receipt ? <ReceiptButton orderId={row.order_id} /> : null),
    },
  ];

  const emptyMessage = loading ? t("loadingPayments") : t("noPaymentsFound");

  return (
    <PageShell className="bg-my-courses">
      <div
        style={{
          maxWidth: "1648px",
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Stripe Connect + Stripe finance */}
        <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm" aria-label="Payouts">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Payouts</h2>

              <p className="mt-1 text-sm">
                Status:{" "}
                {payoutLoading
                  ? "Loading…"
                  : (payout?.status ?? "not configured").replaceAll("_", " ")}
              </p>

              {payout?.status !== "active" && !payoutLoading ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-amber-700">
                  <AlertTriangle size={16} />
                  Connect or finish verifying your payout account to sell paid courses.
                </p>
              ) : null}

              {payout?.outstanding_requirements?.length ? (
                <p className="mt-1 text-sm text-amber-700">
                  Stripe requires: {payout.outstanding_requirements.join(", ")}
                </p>
              ) : null}

              {payoutError ? <p className="mt-1 text-sm text-red-600">{payoutError}</p> : null}
            </div>

            {payout?.status !== "active" ? (
              <button
                type="button"
                disabled={payoutLoading}
                onClick={setupPayouts}
                className="rounded-full bg-(--color-blue) px-5 py-2 text-white disabled:opacity-50"
              >
                {payout?.configured ? "Continue payout setup" : "Set up payouts"}
              </button>
            ) : null}
          </div>

          {/* Stripe balance stays INSIDE Payouts card */}
          {payout?.status === "active" ? (
            <div className="mt-5 border-t border-[#E5E5E5] pt-4">
              <h3 className="text-sm font-semibold">Stripe balance</h3>

              {stripeFinanceLoading ? (
                <p className="mt-2 text-sm text-(--color-text-secondary)">
                  Loading Stripe balance…
                </p>
              ) : stripeFinanceError ? (
                <p className="mt-2 text-sm text-red-600">{stripeFinanceError}</p>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap gap-8">
                    <div>
                      <p className="text-xs text-(--color-text-secondary)">Available</p>

                      {stripeFinance?.available.length ? (
                        stripeFinance.available.map((item) => (
                          <p key={`available-${item.currency}`} className="font-semibold">
                            {item.amount} {item.currency}
                          </p>
                        ))
                      ) : (
                        <p className="font-semibold">0</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-(--color-text-secondary)">Pending</p>

                      {stripeFinance?.pending.length ? (
                        stripeFinance.pending.map((item) => (
                          <p key={`pending-${item.currency}`} className="font-semibold">
                            {item.amount} {item.currency}
                          </p>
                        ))
                      ) : (
                        <p className="font-semibold">0</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-sm font-semibold">Recent Stripe payouts</h3>

                    {!stripeFinance?.payouts.length ? (
                      <p className="mt-2 text-sm text-(--color-text-secondary)">
                        No Stripe payouts yet.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-col gap-2">
                        {stripeFinance.payouts.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-[#E5E5E5] px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                              <div>
                                <span className="font-semibold">
                                  {item.amount} {item.currency}
                                </span>

                                <span className="ml-2 text-(--color-text-secondary)">
                                  {item.status.replaceAll("_", " ")}
                                </span>
                              </div>

                              <span className="text-xs text-(--color-text-secondary)">
                                {item.arrival_date
                                  ? new Date(item.arrival_date * 1000).toLocaleDateString(locale)
                                  : item.created
                                    ? new Date(item.created * 1000).toLocaleDateString(locale)
                                    : "—"}
                              </span>
                            </div>

                            {item.failure_message ? (
                              <p className="mt-1 text-xs text-red-600">{item.failure_message}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </section>

        {/* LiqPay finance */}
        <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm" aria-label="LiqPay finance">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">LiqPay teacher finance</h2>

              <p className="mt-1 text-sm text-(--color-text-secondary)">
                Internal balance for LiqPay payments
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadLiqPayFinance()}
              disabled={liqPayFinanceLoading}
              className="rounded-full border border-(--color-blue) px-4 py-2 text-sm text-(--color-blue) disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {liqPayFinanceLoading ? (
            <p className="mt-4 text-sm">Loading LiqPay finance…</p>
          ) : liqPayFinanceError ? (
            <p className="mt-4 text-sm text-red-600">{liqPayFinanceError}</p>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-[#E5E5E5] p-3">
                  <p className="text-xs text-(--color-text-secondary)">Earned</p>
                  <p className="mt-1 font-semibold">${liqPayBalance?.earned ?? "0.00"}</p>
                </div>

                <div className="rounded-xl border border-[#E5E5E5] p-3">
                  <p className="text-xs text-(--color-text-secondary)">Available</p>
                  <p className="mt-1 font-semibold">${liqPayBalance?.available ?? "0.00"}</p>
                </div>

                <div className="rounded-xl border border-[#E5E5E5] p-3">
                  <p className="text-xs text-(--color-text-secondary)">Reserved</p>
                  <p className="mt-1 font-semibold">${liqPayBalance?.reserved ?? "0.00"}</p>
                </div>

                <div className="rounded-xl border border-[#E5E5E5] p-3">
                  <p className="text-xs text-(--color-text-secondary)">Paid</p>
                  <p className="mt-1 font-semibold">${liqPayBalance?.paid ?? "0.00"}</p>
                </div>
              </div>

              <LiqPayDestinationManager
                destinations={liqPayDestinations}
                onChanged={reloadLiqPayDestinations}
              />

              <div className="mt-5">
                <h3 className="text-sm font-semibold">LiqPay payout history</h3>

                {!liqPayPayouts.length ? (
                  <p className="mt-2 text-sm text-(--color-text-secondary)">
                    No LiqPay payouts yet.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {liqPayPayouts.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm"
                      >
                        <div className="flex flex-wrap justify-between gap-3">
                          <div>
                            <span className="font-semibold">
                              {item.amount} {item.currency}
                            </span>

                            <span className="ml-2">{item.status}</span>

                            <span className="ml-2 text-(--color-text-secondary)">
                              {item.provider_status || item.provider}
                            </span>
                          </div>

                          <span className="text-xs text-(--color-text-secondary)">
                            {new Date(item.created_at).toLocaleDateString(locale)}
                          </span>
                        </div>

                        {item.provider_order_id ? (
                          <p className="mt-1 text-xs text-(--color-text-secondary)">
                            Order: {item.provider_order_id}
                          </p>
                        ) : null}

                        {item.failure_reason ? (
                          <p className="mt-1 text-xs text-red-600">{item.failure_reason}</p>
                        ) : null}

                        {item.request_uncertain ? (
                          <p className="mt-1 text-xs text-amber-700">
                            Provider response is uncertain. Reconciliation is required.
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-semibold">Ledger</summary>

                <div className="mt-3 flex flex-col gap-2">
                  {!liqPayLedger.length ? (
                    <p className="text-sm text-(--color-text-secondary)">No ledger entries.</p>
                  ) : (
                    liqPayLedger.slice(0, 15).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap justify-between gap-3 border-b border-[#E5E5E5] py-2 text-sm"
                      >
                        <span>
                          {item.entry_type} · {item.status}
                        </span>

                        <span className="font-semibold">
                          {item.amount} {item.currency}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </details>
            </>
          )}
        </section>

        {/* Payments title + filters */}
        <div
          className="flex flex-wrap items-center"
          style={{
            gap: "clamp(12px, 1.67vw, 24px)",
            marginBottom: "clamp(12px, 1.11vw, 16px)",
          }}
        >
          <h1
            className="font-semibold text-(--color-text-primary)"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(18px, 1.67vw, 24px)",
              whiteSpace: "nowrap",
            }}
          >
            {t("heading")}
          </h1>

          <PillSelect
            value={selectedCourse}
            options={courseOptions}
            onChange={handleCourseChange}
          />

          <PillSelect
            value={selectedGroup}
            options={groupOptions}
            onChange={setSelectedGroup}
            disabled={selectedCourse === ALL_COURSES}
          />

          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onChangeFrom={setDateFrom}
            onChangeTo={setDateTo}
          />

          <PillSelect
            value={selectedStatus}
            options={STATUS_OPTIONS}
            onChange={setSelectedStatus}
            icon={<Flag style={FILTER_ICON_SIZE} />}
          />
        </div>

        {/* Search */}
        <label
          className="gradient-border flex shrink-0 cursor-text items-center gap-2"
          style={{
            width: "100%",
            height: "clamp(32px, 2.78vw, 40px)",
            borderRadius: 40,
            padding: "clamp(6px, 0.56vw, 8px) clamp(12px, 1.11vw, 16px)",
            marginBottom: "clamp(16px, 1.67vw, 24px)",
          }}
        >
          <Search
            style={{
              width: "clamp(14px, 1.39vw, 20px)",
              height: "clamp(14px, 1.39vw, 20px)",
              color: "var(--color-brand-lavender)",
              flexShrink: 0,
            }}
          />

          <input
            type="search"
            placeholder={tCommon("search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(13px, 1.11vw, 20px)",
              color: "var(--color-text-primary)",
            }}
          />
        </label>

        {/* Payments table — LAST */}
        <DataTable<TeacherOrderRow>
          columns={columns}
          rows={rows}
          getRowKey={(row) => `${row.order_id}-${row.course_slug}`}
          emptyMessage={emptyMessage}
          scrollable
        />
      </div>
    </PageShell>
  );
}
