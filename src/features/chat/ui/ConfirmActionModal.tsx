import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pending: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms a potentially destructive chat action. */
export function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  pending,
  danger = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-6"
      onClick={pending ? undefined : onCancel}
    >
      <section
        className="w-full max-w-[420px] rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[#121212]">{title}</h2>
        <div className="mt-3 text-sm leading-6 text-[#4B5563]">{description}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="h-10 rounded-lg border border-[#D8DDEA] px-4 text-sm font-semibold text-[#121212] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`inline-flex h-10 min-w-[112px] items-center justify-center rounded-lg px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#A3A3A3] ${
              danger ? "bg-[#A12020] hover:bg-[#8F1C1C]" : "bg-black hover:bg-[#252525]"
            }`}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
