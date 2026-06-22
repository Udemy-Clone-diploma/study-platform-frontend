"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, User, Users } from "lucide-react";
import { addCartItem } from "@/entities/cart";
import type { CourseCohort } from "@/entities/course/model/cohort";
import type { CourseDeliveryFormat, DeliveryFormatType } from "@/entities/course";
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
const COURSE_AVAILABLE_NOTICE = "The course is already available in My Courses.";
const STUDENT_ONLY_MESSAGE = "Enrollment is available only for students.";

const FORMAT_LABEL: Record<DeliveryFormatType, string> = {
  self_paced:  "Self-paced",
  scheduled:   "Scheduled",
  individual:  "Individual Coaching",
  group:       "Group Courses",
};

const FORMAT_BLURB: Record<DeliveryFormatType, string> = {
  self_paced:  "Learn at your own pace with lifetime access to all content",
  scheduled:   "Follow a structured schedule with content unlocking over time",
  individual:  "1-on-1 mentorship with a curriculum tailored to your pace",
  group:       "Learn and collaborate with peers in a dynamic environment",
};

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

/** Cohort radio list shown inside a group format card. */
function CohortPicker({
  cohorts,
  selected,
  onSelect,
}: {
  cohorts: CourseCohort[];
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  if (cohorts.length === 0) {
    return (
      <p className="text-center text-sm text-(--color-text-muted) py-1">
        No available schedules at this time.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-sm font-(family-name:--font-accent) uppercase text-(--color-text-secondary) tracking-wide">
        Select a schedule
      </p>
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
                background: isSelected ? "color-mix(in srgb, var(--color-blue) 8%, transparent)" : "transparent",
              }}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-(family-name:--font-base) font-semibold text-sm text-(--color-text-primary)">
                  {c.name ?? "Group"}
                </span>
                {c.start_date && (
                  <span className="text-xs text-(--color-text-secondary)">
                    Starts {formatDate(c.start_date)}
                  </span>
                )}
                {spotsLeft !== null && (
                  <span className="text-xs text-(--color-text-muted)">
                    {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
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
    </div>
  );
}

/** Tuition section: heading badge, intro, pricing cards per delivery format. */
export function CoursePricingBlock({ courseId, formats, slug, cohorts = [] }: Props) {
  const router = useRouter();
  const [pendingPlanId, setPendingPlanId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<Record<number, number>>({});

  const pricedFormats = formats.filter(f => f.pricing);

  const getAvailableCohorts = (formatId: number) =>
    cohorts.filter(
      c =>
        c.delivery_format === formatId &&
        c.is_enrollment_open &&
        (c.group_size === null || c.members_count < c.group_size),
    );

  const handleBuy = async (planId: number, formatId: number, formatType: DeliveryFormatType) => {
    if (!getClientCookie(AUTH_COOKIE_NAMES.access)) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }

    const role = getClientCookie(AUTH_COOKIE_NAMES.role);
    if (role && role !== "student") {
      setNotice(STUDENT_ONLY_MESSAGE);
      return;
    }

    if (formatType === "group") {
      const cohortId = selectedCohort[formatId];
      if (!cohortId) {
        setNotice("Please select a schedule before purchasing.");
        return;
      }
    }

    setPendingPlanId(planId);
    setNotice(null);

    try {
      const cohortId = formatType === "group" ? selectedCohort[formatId] : undefined;
      await addCartItem(courseId, planId, cohortId);
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
        setNotice(COURSE_AVAILABLE_NOTICE);
        return;
      }
      if (cohortError) {
        setNotice(cohortError);
        return;
      }
      setNotice(apiError.message || apiError.detail || "Could not process your request.");
    } finally {
      setPendingPlanId(null);
    }
  };

  return (
    <section className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-4">
        <SectionBadge>Tuition Fees &amp; Payment Options</SectionBadge>
        <p className="max-w-[1180px] text-lg text-(--color-text-primary) sm:text-xl lg:text-2xl">
          Choose the format that best fits your goals and budget. We offer flexible payment plans
          for your convenience.
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-8 sm:gap-y-12 xl:gap-x-62">
        {pricedFormats.map((fmt) => {
          const plan = fmt.pricing!;
          const Icon = FORMAT_ICON[fmt.format_type];
          const isGroup = fmt.format_type === "group";
          const availableCohorts = isGroup ? getAvailableCohorts(fmt.id) : [];

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
                      {FORMAT_LABEL[fmt.format_type]}
                    </h3>
                  </div>
                  <p className="max-w-[260px] text-center text-base text-(--color-text-primary)">
                    {FORMAT_BLURB[fmt.format_type]}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6 sm:gap-7">
                  <PriceRow label="Full Price:">
                    <span className="font-(family-name:--font-accent) text-xl font-bold uppercase sm:text-2xl">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-base">(one-time payment)</span>
                  </PriceRow>

                  {plan.installment_count && plan.installment_amount && (
                    <PriceRow label="Installment Plan:">
                      <span className="font-(family-name:--font-accent) text-xl font-bold uppercase sm:text-2xl">
                        {formatPrice(plan.installment_amount, plan.currency)}
                      </span>
                      <span className="text-base">({plan.installment_count} monthly payments)</span>
                    </PriceRow>
                  )}
                </div>

                {isGroup && (
                  <CohortPicker
                    cohorts={availableCohorts}
                    selected={selectedCohort[fmt.id] ?? null}
                    onSelect={id => setSelectedCohort(prev => ({ ...prev, [fmt.id]: id }))}
                  />
                )}
              </div>

              <GradientButton
                onClick={() => handleBuy(plan.id, fmt.id, fmt.format_type)}
                disabled={
                  pendingPlanId !== null ||
                  (isGroup && availableCohorts.length > 0 && !selectedCohort[fmt.id])
                }
              >
                {pendingPlanId === plan.id
                  ? "Processing..."
                  : isGroup && availableCohorts.length === 0
                    ? "No spots available"
                    : "Buy now"}
              </GradientButton>
            </article>
          );
        })}
      </div>

      {notice && (
        <p role="status" className="text-center text-base text-(--color-pink-dark)">
          {notice}
        </p>
      )}
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
