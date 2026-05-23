"use client";

import { Download } from "lucide-react";
import { useState } from "react";

type TabId = "cart" | "plans" | "history";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "cart", label: "Cart" },
  { id: "plans", label: "Plans" },
  { id: "history", label: "Payment history" },
];

const cartRows = [
  { course: "UX/UI Design Mastery", date: "01.05.2026", amount: "€599" },
  { course: "Marketing", date: "21.04.2026", amount: "€670" },
];

const planRows = [
  { plan: "Starter", period: "Monthly", amount: "€120" },
  { plan: "Professional", period: "Quarterly", amount: "€320" },
  { plan: "Mentor", period: "Annual", amount: "€980" },
];

const historyRows = [
  { course: "UX/UI Design Mastery", date: "01.05.2026", amount: "€599" },
  { course: "Marketing", date: "21.04.2026", amount: "€670" },
  { course: "1/3 Business analytics", date: "02.04.2026", amount: "€120" },
];

function ReceiptButton() {
  return (
    <button
      type="button"
      className="inline-flex h-[22px] min-w-[86px] items-center justify-center gap-1 rounded-full border border-black px-2 font-mono text-[11px] leading-none text-black transition-colors hover:bg-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003AFF]"
    >
      Receipt
      <Download size={12} strokeWidth={2} aria-hidden />
    </button>
  );
}

function PaymentsTable({
  rows,
  type,
}: {
  rows: Array<Record<string, string>>;
  type: "cart" | "plans" | "history";
}) {
  const columns =
    type === "plans"
      ? [
          { key: "plan", label: "Plan" },
          { key: "period", label: "Period" },
          { key: "amount", label: "Amount" },
        ]
      : [
          { key: "course", label: "Course" },
          { key: "date", label: "Date" },
          { key: "amount", label: "Amount" },
        ];

  return (
    <div className="mt-6 overflow-hidden">
      <table className="w-full table-fixed border-collapse font-mono text-[12px] text-[#121212]">
        <thead>
          <tr className="border-b border-[#D9D9D9] text-left text-[#6A6A6A]">
            {columns.map((column) => (
              <th key={column.key} className="h-8 px-3 font-normal">
                {column.label}
              </th>
            ))}
            {type === "history" ? <th className="w-[116px] px-3" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${type}-${index}`} className="border-b border-[#D9D9D9]">
              {columns.map((column) => (
                <td key={column.key} className="h-8 truncate px-3">
                  {row[column.key]}
                </td>
              ))}
              {type === "history" ? (
                <td className="h-8 px-3 text-right">
                  <ReceiptButton />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PaymentWorkspace() {
  const [activeTab, setActiveTab] = useState<TabId>("history");

  return (
    <main className="min-h-[calc(100vh-76px)] bg-[linear-gradient(120deg,#FFFFFF_0%,#FFF7F2_32%,rgba(252,196,195,0.38)_58%,#FFFFFF_100%)] px-10 py-8">
      <section className="mx-auto w-full max-w-[752px]">
        <h1 className="mb-5 font-mono text-[16px] font-semibold leading-5 text-[#121212]">
          Tuition payment
        </h1>

        <div className="min-h-[474px] rounded-lg bg-white px-7 py-4 shadow-[0_0_15px_rgba(0,0,0,0.18)]">
          <nav className="flex border-b border-[#B7C7FA]" aria-label="Payment sections">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "h-8 min-w-[88px] px-3 text-center font-mono text-[12px] leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003AFF]",
                    isActive
                      ? "border-b-2 border-[#003AFF] text-[#003AFF]"
                      : "border-b-2 border-transparent text-[#121212] hover:text-[#003AFF]",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {activeTab === "cart" ? <PaymentsTable rows={cartRows} type="cart" /> : null}
          {activeTab === "plans" ? <PaymentsTable rows={planRows} type="plans" /> : null}
          {activeTab === "history" ? (
            <PaymentsTable rows={historyRows} type="history" />
          ) : null}
        </div>
      </section>
    </main>
  );
}
