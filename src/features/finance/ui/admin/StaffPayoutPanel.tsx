"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createStaffPayout,
  executeStaffPayout,
  getStaffPayouts,
  getStaffTeacherBalance,
  reconcileStaffPayout,
} from "@/entities/payment";

import type {
  StaffFinancePayout,
  TeacherFinanceBalance,
  TeacherFinanceCurrency,
} from "@/entities/payment";

function createIdempotencyKey() {
  return `staff-payout-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function StaffPayoutPanel() {
  const [payouts, setPayouts] =
    useState<StaffFinancePayout[]>([]);

  const [teacherId, setTeacherId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] =
    useState<TeacherFinanceCurrency>("UAH");

  const [teacherBalance, setTeacherBalance] =
    useState<TeacherFinanceBalance | null>(null);

  const [idempotencyKey, setIdempotencyKey] =
    useState(createIdempotencyKey);

  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  const loadPayouts = useCallback(async () => {
    try {
      const result = await getStaffPayouts({
        page_size: 100,
      });

      setPayouts(result.results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load teacher payouts.",
      );
    }
  }, []);

  useEffect(() => {
    void loadPayouts();
  }, [loadPayouts]);

  async function loadBalance() {
    const id = Number(teacherId);

    if (!Number.isInteger(id) || id <= 0) {
      setError("Enter a valid teacher ID.");
      return;
    }

    setError("");

    try {
      const result =
        await getStaffTeacherBalance(
          id,
          currency,
        );

      setTeacherBalance(result);
    } catch (err) {
      setTeacherBalance(null);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load teacher balance.",
      );
    }
  }

  async function reservePayout() {
    const id = Number(teacherId);
    const numericAmount = Number(amount);

    if (!Number.isInteger(id) || id <= 0) {
      setError("Enter a valid teacher ID.");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Enter a valid payout amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createStaffPayout({
        teacher_id: id,
        amount: numericAmount.toFixed(2),
        currency,
        idempotency_key: idempotencyKey,
      });

      // Generate a new key only after a confirmed success.
      setIdempotencyKey(
        createIdempotencyKey(),
      );

      setAmount("");

      await Promise.all([
        loadPayouts(),
        loadBalance(),
      ]);
    } catch (err) {
      // Keep the same idempotency key so a retry
      // cannot reserve the payout twice.
      setError(
        err instanceof Error
          ? err.message
          : "Could not reserve payout.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function executePayout(id: number) {
    setActionId(id);
    setError("");

    try {
      await executeStaffPayout(id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not execute payout.",
      );
    } finally {
      await loadPayouts();
      setActionId(null);
    }
  }

  async function reconcilePayout(id: number) {
    setActionId(id);
    setError("");

    try {
      await reconcileStaffPayout(id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reconcile payout.",
      );
    } finally {
      await loadPayouts();
      setActionId(null);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            Teacher LiqPay payouts
          </h2>

          <p className="mt-1 text-sm text-[#6A6A6A]">
            Reserve, execute and reconcile teacher payouts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPayouts()}
          className="rounded-full border border-[#003AFF] px-4 py-2 text-sm text-[#003AFF]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <input
          type="number"
          min={1}
          value={teacherId}
          onChange={(event) => {
            setTeacherId(event.target.value);
            setTeacherBalance(null);
          }}
          placeholder="Teacher ID"
          className="h-10 rounded-lg border border-[#D9D9D9] px-3"
        />

        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value)
          }
          placeholder="Amount"
          className="h-10 rounded-lg border border-[#D9D9D9] px-3"
        />

        <select
          value={currency}
          onChange={(event) => {
            setCurrency(
              event.target.value as TeacherFinanceCurrency,
            );
            setTeacherBalance(null);
          }}
          className="h-10 rounded-lg border border-[#D9D9D9] px-3"
        >
          <option value="UAH">UAH</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>

        <button
          type="button"
          onClick={() => void loadBalance()}
          className="h-10 rounded-full border border-[#003AFF] px-4 text-[#003AFF]"
        >
          Check balance
        </button>
      </div>

      {teacherBalance ? (
        <div className="mt-3 rounded-lg bg-[#F7F8FC] p-3 text-sm">
          Available:{" "}
          <strong>
            {teacherBalance.available}{" "}
            {teacherBalance.currency}
          </strong>

          {" · "}

          Reserved:{" "}
          <strong>
            {teacherBalance.reserved}{" "}
            {teacherBalance.currency}
          </strong>
        </div>
      ) : null}

      <button
        type="button"
        disabled={loading}
        onClick={() => void reservePayout()}
        className="mt-3 rounded-full bg-[#003AFF] px-5 py-2 text-white disabled:opacity-50"
      >
        {loading
          ? "Reserving…"
          : "Reserve LiqPay payout"}
      </button>

      {error ? (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#D9D9D9]">
              <th className="p-2">ID</th>
              <th className="p-2">Teacher</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Provider</th>
              <th className="p-2">Status</th>
              <th className="p-2">Mode</th>
              <th className="p-2">Provider status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {payouts.map((payout) => (
              <tr
                key={payout.id}
                className="border-b border-[#EEEEEE]"
              >
                <td className="p-2">
                  #{payout.id}
                </td>

                <td className="p-2">
                  {payout.teacher_email}
                  <div className="text-xs text-[#6A6A6A]">
                    ID {payout.teacher_id}
                  </div>
                </td>

                <td className="p-2">
                  {payout.amount}{" "}
                  {payout.currency}
                </td>

                <td className="p-2">
                  {payout.provider}
                </td>

                <td className="p-2">
                  {payout.status}
                </td>

                <td className="p-2">
                  {payout.payout_mode || "—"}
                </td>

                <td className="p-2">
                  {payout.provider_status || "—"}

                  {payout.request_uncertain ? (
                    <div className="text-xs text-amber-700">
                      reconciliation required
                    </div>
                  ) : null}

                  {payout.failure_reason ? (
                    <div className="text-xs text-red-600">
                      {payout.failure_reason}
                    </div>
                  ) : null}
                </td>

                <td className="p-2">
                  <div className="flex gap-2">
                    {payout.status === "pending" ? (
                      <button
                        type="button"
                        disabled={
                          actionId === payout.id
                        }
                        onClick={() =>
                          void executePayout(
                            payout.id,
                          )
                        }
                        className="rounded-full bg-black px-3 py-1 text-xs text-white disabled:opacity-50"
                      >
                        Execute
                      </button>
                    ) : null}

                    {payout.status ===
                    "processing" ? (
                      <button
                        type="button"
                        disabled={
                          actionId === payout.id
                        }
                        onClick={() =>
                          void reconcilePayout(
                            payout.id,
                          )
                        }
                        className="rounded-full border border-[#003AFF] px-3 py-1 text-xs text-[#003AFF] disabled:opacity-50"
                      >
                        Reconcile
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}

            {!payouts.length ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-5 text-center text-[#6A6A6A]"
                >
                  No teacher payouts.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}