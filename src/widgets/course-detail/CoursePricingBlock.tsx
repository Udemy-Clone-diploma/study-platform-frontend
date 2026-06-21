"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Users } from "lucide-react";
import { addCartItem } from "@/entities/cart";
import type { PricingPlan } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { GradientButton } from "@/shared/ui/GradientButton";
import { SectionBadge } from "./SectionBadge";

type Props = { courseId: number; plans: PricingPlan[]; slug: string };

const CART_URL = "/student-dashboard/payment?tab=card";
const COURSE_AVAILABLE_NOTICE = "The course is already available in My Courses.";
const STUDENT_ONLY_MESSAGE = "Enrollment is available only for students.";

const KIND_LABEL: Record<PricingPlan["kind"], string> = {
  group: "Group Courses",
  individual: "Individual Coaching",
};

const KIND_BLURB: Record<PricingPlan["kind"], string> = {
  group: "Learn and collaborate with peers in a dynamic environment",
  individual: "1-on-1 mentorship with a curriculum tailored to your pace",
};

const KIND_ICON: Record<PricingPlan["kind"], React.ComponentType<{ className?: string }>> = {
  group: Users,
  individual: User,
};

function formatPlanPrice(price: string, currency: PricingPlan["currency"]): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price));
}

/** Tuition section: heading badge, intro, two pricing cards (full price + installment plan + Buy now). */
export function CoursePricingBlock({ courseId, plans, slug }: Props) {
  const router = useRouter();
  const [pendingPlanId, setPendingPlanId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleBuy = async (planId: number) => {
    if (!getClientCookie(AUTH_COOKIE_NAMES.access)) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }

    const role = getClientCookie(AUTH_COOKIE_NAMES.role);
    if (role && role !== "student") {
      setNotice(STUDENT_ONLY_MESSAGE);
      return;
    }

    setPendingPlanId(planId);
    setNotice(null);

    try {
      await addCartItem(courseId, planId);
      router.push(CART_URL);
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      const courseError = String(apiError.fields?.course_id ?? "");

      if (courseError.includes("already in cart")) {
        router.push(CART_URL);
        return;
      }

      if (courseError.includes("already has access")) {
        setNotice(COURSE_AVAILABLE_NOTICE);
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

      {/* Cards sit side by side; gap-x is the 261px space between them on desktop. On
          mobile they stack with a moderate gap. To raise/lower a single card, add a
          vertical offset to its <article> below, e.g. translate-y-[40px]. */}
      <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-8 sm:gap-y-12 xl:gap-x-62">
        {plans.map((plan) => {
          const Icon = KIND_ICON[plan.kind];
          return (
            <article
              key={plan.id}
              className="flex w-full max-w-[460px] flex-col items-center justify-center gap-8 rounded-[20px] border border-(--color-bg) bg-(--color-white-20) px-6 py-8 backdrop-blur-md sm:gap-10 sm:py-11 lg:h-[469px] lg:w-[460px]"
            >
              <div className="flex flex-col items-center gap-8 sm:gap-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="h-6 w-6 text-(--color-text-primary) sm:h-8 sm:w-8"
                      aria-hidden="true"
                    />
                    <h3 className="text-2xl text-(--color-text-primary) sm:text-3xl lg:text-4xl">
                      {KIND_LABEL[plan.kind]}
                    </h3>
                  </div>
                  <p className="max-w-[260px] text-center text-base text-(--color-text-primary)">
                    {KIND_BLURB[plan.kind]}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6 sm:gap-7">
                  <PriceRow label="Full Price:">
                    <span className="font-(family-name:--font-accent) text-xl font-bold uppercase sm:text-2xl">
                      {formatPlanPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-base">(one-time payment)</span>
                  </PriceRow>

                  {plan.installment_count && plan.installment_amount && (
                    <PriceRow label="Installment Plan:">
                      <span className="font-(family-name:--font-accent) text-xl font-bold uppercase sm:text-2xl">
                        {formatPlanPrice(plan.installment_amount, plan.currency)}
                      </span>
                      <span className="text-base">({plan.installment_count} monthly payment)</span>
                    </PriceRow>
                  )}
                </div>
              </div>

              <GradientButton onClick={() => handleBuy(plan.id)} disabled={pendingPlanId !== null}>
                {pendingPlanId === plan.id ? "Processing..." : "Buy now"}
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
