"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";
import { reportMessage, type ChatMessage, type MessageReportReason } from "@/entities/chat";
import type { ApiError } from "@/shared/api/base";
import { REASON_VALUES } from "../lib/chatConstants";
import { messagePreview } from "../lib/chatFormatters";

type Props = {
  message: ChatMessage;
  onClose: () => void;
};

/** Submits a moderation report for a selected message. */
export function ReportMessageModal({ message, onClose }: Props) {
  const t = useTranslations("ReportMessageModal");
  const tReportUser = useTranslations("ReportUser");
  const tReasons = useTranslations("ReportUser.reasons");
  const tCommon = useTranslations("ChatCommon");
  const tShared = useTranslations("Common");
  const [reason, setReason] = useState<MessageReportReason | "">("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const reasonOptions = useMemo(
    () => REASON_VALUES.map((value) => ({ value, label: tReasons(value) })),
    [tReasons],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason) {
      setError(tReportUser("selectReasonError"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await reportMessage(message.id, reason, details.trim());
      setSent(true);
    } catch (requestError) {
      const apiError = requestError as Partial<ApiError>;
      setError(apiError.detail || apiError.message || tReportUser("genericError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-6"
      onClick={saving ? undefined : onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="w-full max-w-[480px] rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#121212]">{t("title")}</h2>
          <button
            type="button"
            aria-label={tShared("close")}
            disabled={saving}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {sent ? (
          <div className="mt-5">
            <p className="text-sm leading-6 text-[#4B5563]">{t("reportSentBody")}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 h-10 w-full rounded-lg bg-black text-sm font-semibold text-white"
            >
              {tReportUser("done")}
            </button>
          </div>
        ) : (
          <form className="mt-5" onSubmit={submit}>
            <p className="rounded-lg bg-[#F7F9FF] px-3 py-2 text-sm text-[#4B5563] line-clamp-3">
              {messagePreview(message, tCommon)}
            </p>
            <fieldset className="mt-4 space-y-2">
              <legend className="mb-2 text-sm font-semibold text-[#121212]">
                {t("whyReportingLegend")}
              </legend>
              {reasonOptions.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#EEF0F6] px-3 py-2.5 text-sm hover:bg-[#F7F9FF]"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={() => setReason(item.value)}
                  />
                  {item.label}
                </label>
              ))}
            </fieldset>
            <label className="mt-4 block text-sm font-semibold text-[#121212]">
              Additional details <span className="font-normal text-[#6B7280]">(optional)</span>
              <textarea
                value={details}
                maxLength={500}
                rows={3}
                onChange={(event) => setDetails(event.target.value)}
                className="mt-2 w-full resize-none rounded-lg border border-[#D8DDEA] px-3 py-2 font-normal outline-none focus:border-[#A7BAFA]"
              />
            </label>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-[#B42318]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#A12020] text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send report"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
