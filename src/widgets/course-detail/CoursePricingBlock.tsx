"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { BookOpen, Check, ChevronDown, Clock, User, Users } from "lucide-react";
// ChevronDown used inside CohortPicker and IndividualSlotPicker collapsible headers
import { addCartItem } from "@/entities/cart";
import type { CourseCohort } from "@/entities/course/model/cohort";
import type { CourseDeliveryFormat, DeliveryFormatType } from "@/entities/course";
import { DAY_LABELS, enrollInFreeCourse, getScheduleSlots } from "@/entities/course";
import type { ScheduleSlot } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { GradientButton } from "@/shared/ui/GradientButton";
import { SectionBadge } from "./SectionBadge";

type Props = {
  courseId: number;
  formats: CourseDeliveryFormat[];
  slug: string;
  cohorts?: CourseCohort[];
};

const CART_URL = "/student-dashboard/payment?tab=card";

const FORMAT_ICON: Record<DeliveryFormatType, React.ComponentType<{ className?: string }>> = {
  self_paced:  BookOpen,
  scheduled:   BookOpen,
  individual:  User,
  group:       Users,
};

function formatPrice(price: string, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Cohort radio list shown inside a group format card. Starts collapsed. */
function CohortPicker({
  cohorts,
  selected,
  onSelect,
  open,
  onOpenChange,
}: {
  cohorts: CourseCohort[];
  selected: number | null;
  onSelect: (id: number) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("CoursePricingBlock");

  if (cohorts.length === 0) {
    return (
      <p className="text-center text-sm text-(--color-text-muted) py-1">
        {t("noSchedules")}
      </p>
    );
  }

  const activeCohort = cohorts.find(c => c.id === selected);

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex items-center justify-between gap-2 w-full text-left"
      >
        <span className="text-sm font-(family-name:--font-accent) uppercase text-(--color-text-secondary) tracking-wide">
          {activeCohort ? activeCohort.name ?? t("group") : t("selectSchedule")}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-(--color-text-secondary) transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-2">
          {cohorts.map(c => {
            const spotsLeft = c.group_size ? c.group_size - c.members_count : null;
            const isSelected = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className="flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
                style={{
                  borderColor: isSelected ? "var(--color-blue)" : "var(--color-border-light)",
                  background: isSelected ? "color-mix(in srgb, var(--color-blue) 8%, transparent)" : "rgba(255, 255, 255, 0.52)",
                }}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-(family-name:--font-base) font-semibold text-sm text-(--color-text-primary)">
                    {c.name ?? t("group")}
                  </span>
                  {c.start_date && (
                    <span className="text-xs text-(--color-text-secondary)">
                      {t("startsDate", { date: formatDate(c.start_date) })}
                    </span>
                  )}
                  {spotsLeft !== null && (
                    <span className="text-xs text-(--color-text-muted)">
                      {t("spotsLeft", { count: spotsLeft })}
                    </span>
                  )}
                </div>
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                  style={{
                    borderColor: isSelected ? "var(--color-blue)" : "var(--color-border-light)",
                    background: isSelected ? "var(--color-blue)" : "transparent",
                  }}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MIN_INDIVIDUAL_SLOTS = 2;
const MAX_INDIVIDUAL_SLOTS = 3;

/** Lets the student pick 2-3 of the teacher's available weekly slots for an individual-format course. */
function IndividualSlotPicker({
  slug,
  formatId,
  selected,
  onChange,
}: {
  slug: string;
  formatId: number;
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const t = useTranslations("CoursePricingBlock");

  useEffect(() => {
    getScheduleSlots(slug, formatId)
      .then(data => setSlots(data.filter(s => s.is_available)))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [slug, formatId]);

  // Group by day_of_week, sorted Mon→Sun
  const byDay = slots.reduce<Record<number, ScheduleSlot[]>>((acc, s) => {
    (acc[s.day_of_week] ??= []).push(s);
    return acc;
  }, {});
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
        <Clock className="h-4 w-4 shrink-0" />
        {t("loadingTimes")}
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
        <Clock className="h-4 w-4 shrink-0" />
        {t("noSessions")}
      </div>
    );
  }

  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
      return;
    }
    if (selected.length >= MAX_INDIVIDUAL_SLOTS) return;
    onChange([...selected, id]);
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-2 w-full text-left"
      >
        <span className="text-sm font-(family-name:--font-accent) uppercase text-(--color-text-secondary) tracking-wide flex items-center gap-1.5">
          <Clock className="h-4 w-4 shrink-0" />
          {t("availableSessions", { count: slots.length })}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-(--color-text-secondary) transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <>
          <p className="text-xs text-(--color-text-secondary)">
            {t("pickSessions", {
              min: MIN_INDIVIDUAL_SLOTS,
              max: MAX_INDIVIDUAL_SLOTS,
              selected: selected.length,
            })}
          </p>
          {days.map(d => (
            <div key={d} className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide">
                {DAY_LABELS[d as keyof typeof DAY_LABELS]}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {byDay[d].map(s => {
                  const isSelected = selected.includes(s.id);
                  const disabled = !isSelected && selected.length >= MAX_INDIVIDUAL_SLOTS;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      disabled={disabled}
                      className="rounded-full border px-3 py-1 text-xs font-(family-name:--font-base) transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        borderColor: isSelected ? "var(--color-blue)" : "var(--color-border-light)",
                        background: isSelected
                          ? "color-mix(in srgb, var(--color-blue) 12%, transparent)"
                          : "var(--color-bg)",
                        color: isSelected ? "var(--color-blue)" : "var(--color-text-primary)",
                      }}
                    >
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/** Tuition section: heading badge, intro, pricing cards per delivery format. */
export function CoursePricingBlock({ courseId, formats, slug, cohorts = [] }: Props) {
  const router = useRouter();
  const t = useTranslations("CoursePricingBlock");
  const tHeroCta = useTranslations("CourseHeroCTA");
  const [pendingPlanId, setPendingPlanId] = useState<number | null>(null);
  const [cardNotices, setCardNotices] = useState<Record<number, string>>({});
  const [cohortPickerOpen, setCohortPickerOpen] = useState<Record<number, boolean>>({});
  const [selectedCohort, setSelectedCohort] = useState<Record<number, number>>({});
  const [selectedSlots, setSelectedSlots] = useState<Record<number, number[]>>({});
  const today = new Date().toISOString().split("T")[0];
  const pricedFormats = formats.filter(f => f.pricing);

  const isEnrollmentClosed = (fmt: CourseDeliveryFormat) =>
    !!fmt.enrollment_deadline && fmt.enrollment_deadline <= today;

  const getAvailableCohorts = (formatId: number) =>
    cohorts.filter(
      c =>
        c.delivery_format === formatId &&
        c.is_enrollment_open &&
        (!c.enrollment_deadline || c.enrollment_deadline >= today) &&
        (c.group_size === null || c.members_count < c.group_size),
    );

  const setCardNotice = (formatId: number, msg: string) =>
    setCardNotices(prev => ({ ...prev, [formatId]: msg }));
  const clearCardNotice = (formatId: number) =>
    setCardNotices(prev => ({ ...prev, [formatId]: "" }));
  const openCohortPicker = (formatId: number) =>
    setCohortPickerOpen(prev => ({ ...prev, [formatId]: true }));

  const handleBuy = async (planId: number, formatId: number, formatType: DeliveryFormatType) => {
    if (!getClientCookie(AUTH_COOKIE_NAMES.access)) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }

    const role = getClientCookie(AUTH_COOKIE_NAMES.role);
    if (role && role !== "student") {
      setCardNotice(formatId, tHeroCta("studentOnly"));
      return;
    }

    if (formatType === "group") {
      const cohortId = selectedCohort[formatId];
      if (!cohortId) {
        openCohortPicker(formatId);
        setCardNotice(formatId, t("selectScheduleFirst"));
        return;
      }
    }

    if (formatType === "individual") {
      const slotCount = selectedSlots[formatId]?.length ?? 0;
      if (slotCount < MIN_INDIVIDUAL_SLOTS) {
        setCardNotice(
          formatId,
          t("selectTimeSlots", { min: MIN_INDIVIDUAL_SLOTS, max: MAX_INDIVIDUAL_SLOTS }),
        );
        return;
      }
    }

    setPendingPlanId(planId);
    clearCardNotice(formatId);

    const cohortId = formatType === "group" ? selectedCohort[formatId] : undefined;
    const scheduleSlotIds = formatType === "individual" ? selectedSlots[formatId] : undefined;
    const isFree = Number(formats.find(f => f.id === formatId)?.pricing?.price ?? -1) === 0;

    try {
      if (isFree) {
        // Zero-price plan: enroll directly (still applying this format's
        // cohort/slot setup), skipping cart/checkout entirely.
        await enrollInFreeCourse(slug, {
          delivery_format_id: formatId,
          cohort_id: cohortId,
          schedule_slot_ids: scheduleSlotIds,
        });
        router.push(`/learn/${slug}`);
        return;
      }
      await addCartItem(courseId, planId, cohortId, scheduleSlotIds);
      router.push(CART_URL);
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      const courseError = String(apiError.fields?.course_id ?? "");
      const cohortError = String(apiError.fields?.cohort_id ?? "");

      if (courseError.includes("already in cart")) {
        router.push(CART_URL);
        return;
      }
      if (courseError.includes("already has access")) {
        setCardNotice(formatId, tHeroCta("courseAvailable"));
        return;
      }
      if (cohortError) {
        setCardNotice(formatId, cohortError);
        return;
      }
      setCardNotice(formatId, apiError.message || apiError.detail || tHeroCta("genericError"));
    } finally {
      setPendingPlanId(null);
    }
  };

  return (
    <section className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-4">
        <SectionBadge>{t("tuitionBadge")}</SectionBadge>
        <p className="max-w-[1180px] text-lg text-(--color-text-primary) sm:text-xl lg:text-2xl">
          {t("tuitionIntro")}
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-8 sm:gap-y-12 xl:gap-x-62">
        {pricedFormats.map((fmt) => {
          const plan = fmt.pricing!;
          const Icon = FORMAT_ICON[fmt.format_type];
          const isGroup = fmt.format_type === "group";
          const isIndividual = fmt.format_type === "individual";
          const availableCohorts = isGroup ? getAvailableCohorts(fmt.id) : [];

          // Hide when enrollment deadline has passed (teacher closed enrollment)
          if (isEnrollmentClosed(fmt)) return null;

          // Hide group card when every cohort is full / closed
          if (isGroup && availableCohorts.length === 0) return null;

          // Hide individual card when the max-students limit is reached
          if (isIndividual && fmt.max_students != null && fmt.enrolled_count >= fmt.max_students) return null;

          return (
            <article
              key={fmt.id}
              className="flex w-full max-w-[460px] flex-col items-center justify-between gap-8 rounded-[20px] border border-(--color-bg) bg-(--color-white-20) px-6 py-8 backdrop-blur-md sm:gap-10 sm:py-11 lg:w-[460px]"
            >
              <div className="flex flex-col items-center gap-8 w-full sm:gap-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-6 w-6 text-(--color-text-primary) sm:h-8 sm:w-8" aria-hidden="true" />
                    <h3 className="text-2xl text-(--color-text-primary) sm:text-3xl lg:text-4xl">
                      {t(`formatLabel.${fmt.format_type}`)}
                    </h3>
                  </div>
                  <p className="max-w-[260px] text-center text-base text-(--color-text-primary)">
                    {t(`formatBlurb.${fmt.format_type}`)}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6 sm:gap-7">
                  <PriceRow label={t("fullPrice")}>
                    <span className="font-(family-name:--font-accent) text-xl font-bold uppercase sm:text-2xl">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-base">{t("onePayment")}</span>
                  </PriceRow>

                  {plan.installment_count && plan.installment_amount && (
                    <PriceRow label={t("installmentPlan")}>
                      <span className="font-(family-name:--font-accent) text-xl font-bold uppercase sm:text-2xl">
                        {formatPrice(plan.installment_amount, plan.currency)}
                      </span>
                      <span className="text-base">{t("monthlyPayments", { count: plan.installment_count })}</span>
                    </PriceRow>
                  )}
                </div>

                {isGroup && (
                  <CohortPicker
                    cohorts={availableCohorts}
                    selected={selectedCohort[fmt.id] ?? null}
                    onSelect={id => setSelectedCohort(prev => ({ ...prev, [fmt.id]: id }))}
                    open={cohortPickerOpen[fmt.id] ?? false}
                    onOpenChange={v => setCohortPickerOpen(prev => ({ ...prev, [fmt.id]: v }))}
                  />
                )}

                {isIndividual && (
                  <IndividualSlotPicker
                    slug={slug}
                    formatId={fmt.id}
                    selected={selectedSlots[fmt.id] ?? []}
                    onChange={ids => setSelectedSlots(prev => ({ ...prev, [fmt.id]: ids }))}
                  />
                )}
              </div>

              {cardNotices[fmt.id] && (
                <p role="status" className="text-center text-sm text-(--color-pink-dark)">
                  {cardNotices[fmt.id]}
                </p>
              )}

              <GradientButton
                onClick={() => handleBuy(plan.id, fmt.id, fmt.format_type)}
                disabled={
                  pendingPlanId !== null ||
                  (isGroup && availableCohorts.length === 0)
                }
                style={{ boxShadow: "0 10px 30px rgba(0, 58, 255, 0.22)" }}
              >
                {pendingPlanId === plan.id
                  ? tHeroCta("processing")
                  : isGroup && availableCohorts.length === 0
                    ? t("noSpots")
                    : Number(plan.price) === 0
                      ? tHeroCta("enrollFree")
                      : t("buyNow")}
              </GradientButton>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** A single price line: uppercase label above an amount + description row. */
function PriceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 text-(--color-text-primary)">
      <span className="font-(family-name:--font-accent) text-xl uppercase sm:text-2xl">{label}</span>
      <div className="flex flex-wrap items-center justify-center gap-x-1">{children}</div>
    </div>
  );
}
