"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createStaffPayout,
  executeStaffPayout,
  getStaffPayouts,
  getStaffTeacherBalance,
  reconcileStaffPayout,
  type StaffFinancePayout,
  type TeacherFinanceBalance,
  type TeacherPayoutDestination,
} from "@/entities/payment";
import { getUsers, type TeacherProfile, type UserData } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";

type Teacher = UserData<TeacherProfile>;
type Balance = TeacherFinanceBalance & { destinations: TeacherPayoutDestination[] };

const money = (value: string | number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
const requestError = (error: unknown, fallback: string) => {
  const apiError = error as Partial<ApiError>;
  return apiError.detail || apiError.message || fallback;
};
const newKey = () => `staff-payout-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Admin workflow for reserving and processing LiqPay teacher payouts. */
export function StaffPayoutPanel() {
  const [payouts, setPayouts] = useState<StaffFinancePayout[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [action, setAction] = useState<{ id: number; kind: "execute" | "reconcile" } | null>(null);
  const [error, setError] = useState("");

  const loadPayouts = useCallback(async () => {
    try {
      setPayouts((await getStaffPayouts({ page_size: 100 })).results);
    } catch (err) {
      setError(requestError(err, "Could not load teacher payouts."));
    }
  }, []);

  const loadBalance = useCallback(async (selected: Teacher) => {
    setBalanceLoading(true);
    setError("");
    try {
      const result = await getStaffTeacherBalance(selected.profile.id);
      setBalance(result);
      setDestinationId(result.destinations.find((item) => item.is_default)?.id ?? result.destinations[0]?.id ?? null);
    } catch (err) {
      setBalance(null);
      setDestinationId(null);
      setError(requestError(err, "Could not load teacher balance."));
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => { void loadPayouts(); }, [loadPayouts]);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setTeacherLoading(true);
      try {
        const result = await getUsers({ role: "teacher", search: search.trim() || undefined, pageSize: 20, ordering: "first_name" });
        setTeachers(result.results.filter((user): user is Teacher => user.role === "teacher" && user.profile !== null && "id" in user.profile));
      } catch (err) {
        setError(requestError(err, "Could not load teachers."));
      } finally {
        setTeacherLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const destination = useMemo(() => balance?.destinations.find((item) => item.id === destinationId) ?? null, [balance, destinationId]);
  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= Number(balance?.available ?? 0);

  async function chooseTeacher(selected: Teacher) {
    setTeacher(selected);
    setSearch(`${selected.first_name} ${selected.last_name}`.trim() || selected.email);
    await loadBalance(selected);
  }

  async function reserve() {
    if (!teacher || !destination || !validAmount) return setError("Enter an amount within the available balance.");
    setReserveLoading(true);
    setError("");
    try {
      await createStaffPayout({ teacher_id: teacher.profile.id, destination_id: destination.id, amount: numericAmount.toFixed(2), idempotency_key: idempotencyKey });
      setIdempotencyKey(newKey());
      setAmount("");
      await Promise.all([loadPayouts(), loadBalance(teacher)]);
    } catch (err) {
      setError(requestError(err, "Could not reserve payout."));
    } finally {
      setReserveLoading(false);
    }
  }

  async function processPayout(payout: StaffFinancePayout, kind: "execute" | "reconcile") {
    setAction({ id: payout.id, kind });
    setError("");
    try {
      if (kind === "execute") await executeStaffPayout(payout.id);
      else await reconcileStaffPayout(payout.id);
      await loadPayouts();
      if (teacher?.profile.id === payout.teacher_id) await loadBalance(teacher);
    } catch (err) {
      setError(requestError(err, `Could not ${kind} payout.`));
    } finally {
      setAction(null);
    }
  }

  return <section className="rounded-2xl bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">LiqPay teacher payout</h2><p className="mt-1 text-sm text-(--color-text-secondary)">Reserve, execute and reconcile USD payouts.</p></div><button type="button" onClick={() => void loadPayouts()} className="rounded-full border border-(--color-blue) px-4 py-2 text-sm text-(--color-blue)">Refresh</button></div>
    <div className="mt-5 max-w-2xl space-y-4">
      <div><label htmlFor="payout-teacher" className="text-sm font-semibold">Teacher</label><input id="payout-teacher" value={search} onChange={(event) => { setSearch(event.target.value); setTeacher(null); setBalance(null); }} placeholder="Search by name or email" className="mt-1 h-10 w-full rounded-lg border border-(--color-border-light) px-3" />
      {!teacher && <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-(--color-border-light) bg-white">{teacherLoading ? <p className="p-3 text-sm">Loading teachers...</p> : teachers.map((item) => <button key={item.id} type="button" onClick={() => void chooseTeacher(item)} className="block w-full px-3 py-2 text-left hover:bg-(--color-bg-secondary)"><strong className="block">{`${item.first_name} ${item.last_name}`.trim() || item.email}</strong><span className="text-sm text-(--color-text-secondary)">{item.email}</span></button>)}</div>}</div>
      {teacher && <div className="rounded-lg bg-(--color-bg-secondary) p-3"><strong>{`${teacher.first_name} ${teacher.last_name}`.trim() || teacher.email}</strong><p className="text-sm text-(--color-text-secondary)">{teacher.email}</p></div>}
      {balanceLoading && <p className="text-sm">Loading balance...</p>}
      {balance && <p className="rounded-lg bg-(--color-bg-secondary) p-3 text-sm">Available: <strong>{money(balance.available)}</strong></p>}
      {balance && balance.destinations.length === 0 && <p className="rounded-lg border border-(--color-border-light) p-3 text-sm">No active LiqPay payout destination is configured for this teacher.</p>}
      {balance && balance.destinations.length > 0 && <div><label htmlFor="payout-destination" className="text-sm font-semibold">Payout destination</label><select id="payout-destination" value={destinationId ?? ""} onChange={(event) => setDestinationId(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-(--color-border-light) px-3">{balance.destinations.map((item) => <option key={item.id} value={item.id}>{item.destination_type === "bank_account" ? item.receiver_account_masked : "Card token"}{item.is_default ? " · Default" : ""}</option>)}</select></div>}
      <div><label htmlFor="payout-amount" className="text-sm font-semibold">Amount</label><div className="mt-1 flex items-center gap-2"><span>$</span><input id="payout-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="500.00" className="h-10 flex-1 rounded-lg border border-(--color-border-light) px-3" /><span>USD</span></div>{amount && !validAmount ? <p className="mt-1 text-sm text-(--color-error)">Amount must not exceed the available balance.</p> : null}</div>
      <button type="button" disabled={!teacher || !destination || !validAmount || reserveLoading} onClick={() => void reserve()} className="rounded-full bg-(--color-blue) px-5 py-2 text-white disabled:opacity-50">{reserveLoading ? "Reserving..." : "Reserve payout"}</button>
    </div>
    {error && <p className="mt-3 text-sm text-(--color-error)">{error}</p>}
    <div className="mt-8 overflow-x-auto"><h3 className="mb-3 font-semibold">Recent LiqPay payouts</h3><table className="w-full min-w-3xl text-left text-sm"><thead><tr className="border-b border-(--color-border-light)">{["Teacher", "Amount", "Destination", "Status", "Created", "Actions"].map((heading) => <th key={heading} className="p-2">{heading}</th>)}</tr></thead><tbody>{payouts.map((payout) => <tr key={payout.id} className="border-b border-(--color-border-light)"><td className="p-2"><strong className="block">{payout.teacher_name || payout.teacher_email}</strong><span className="text-xs text-(--color-text-secondary)">{payout.teacher_email}</span></td><td className="p-2">{money(payout.amount)}</td><td className="p-2">{payout.destination_display || payout.destination_type}</td><td className="p-2">{payout.status}</td><td className="p-2">{new Date(payout.created_at).toLocaleString()}</td><td className="p-2"><div className="flex gap-2">{payout.status === "pending" && <button type="button" disabled={action?.id === payout.id} onClick={() => void processPayout(payout, "execute")} className="rounded-full bg-(--color-text-primary) px-3 py-1 text-xs text-white disabled:opacity-50">Execute</button>}{payout.status === "processing" && <button type="button" disabled={action?.id === payout.id} onClick={() => void processPayout(payout, "reconcile")} className="rounded-full border border-(--color-blue) px-3 py-1 text-xs text-(--color-blue) disabled:opacity-50">Reconcile</button>}</div></td></tr>)}{!payouts.length && <tr><td colSpan={6} className="p-5 text-center text-(--color-text-secondary)">No teacher payouts.</td></tr>}</tbody></table></div>
  </section>;
}
