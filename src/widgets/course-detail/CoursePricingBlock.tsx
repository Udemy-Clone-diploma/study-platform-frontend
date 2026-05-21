"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Users } from "lucide-react";
import { enrollInCourse, type PricingPlan } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { GradientButton } from "@/shared/ui/GradientButton";
import { SectionBadge } from "./SectionBadge";

type Props = { plans: PricingPlan[]; slug: string };

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
export function CoursePricingBlock({ plans, slug }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleBuy = async () => {
    if (!getClientCookie(AUTH_COOKIE_NAMES.access)) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }

    setPending(true);
    setNotice(null);
    try {
      await enrollInCourse(slug);
      router.refresh();
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      if (apiError.status === 402) {
        setNotice("Online payment is not available yet. Contact us to complete your enrollment.");
      } else if (apiError.status === 409) {
        setNotice("You are already enrolled in this course.");
      } else {
        setNotice(apiError.message || apiError.detail || "Could not process your request.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <SectionBadge>Tuition Fees &amp; Payment Options</SectionBadge>
        <p className="max-w-[1180px] text-2xl text-(--color-text-primary)">
          Choose the format that best fits your goals and budget. We offer flexible payment plans
          for your convenience.
        </p>
      </div>

      {/* Cards sit side by side; gap-x is the 261px space between them. To raise/lower a
          single card, add a vertical offset to its <article> below, e.g. translate-y-[40px]. */}
      <div className="flex flex-wrap items-start justify-center gap-x-62 gap-y-12">
        {plans.map((plan) => {
          const Icon = KIND_ICON[plan.kind];
          return (
            <article
              key={plan.id}
              className="flex h-[469px] w-[460px] flex-col items-center justify-center gap-10 rounded-[20px] border border-(--color-bg) bg-(--color-white-20) px-6 py-11 backdrop-blur-md"
            >
              <div className="flex flex-col items-center gap-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-8 w-8 text-(--color-text-primary)" aria-hidden="true" />
                    <h3 className="text-4xl text-(--color-text-primary)">
                      {KIND_LABEL[plan.kind]}
                    </h3>
                  </div>
                  <p className="max-w-[260px] text-center text-base text-(--color-text-primary)">
                    {KIND_BLURB[plan.kind]}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-7">
                  <PriceRow label="Full Price:">
                    <span className="font-(family-name:--font-accent) text-2xl font-bold uppercase">
                      {formatPlanPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-base">(one-time payment)</span>
                  </PriceRow>

                  {plan.installment_count && plan.installment_amount && (
                    <PriceRow label="Installment Plan:">
                      <span className="font-(family-name:--font-accent) text-2xl font-bold uppercase">
                        {formatPlanPrice(plan.installment_amount, plan.currency)}
                      </span>
                      <span className="text-base">({plan.installment_count} monthly payment)</span>
                    </PriceRow>
                  )}
                </div>
              </div>

              <GradientButton onClick={handleBuy} disabled={pending}>
                {pending ? "Processing..." : "Buy now"}
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
      <span className="font-(family-name:--font-accent) text-2xl uppercase">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}
