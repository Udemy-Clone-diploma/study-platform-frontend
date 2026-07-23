"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";
import type { UserRole } from "@/entities/user";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { GradientButton } from "@/shared/ui/GradientButton";

const MANAGE_HREF: Partial<Record<UserRole, string>> = {
  teacher: "/teacher-dashboard/blog",
  moderator: "/moderator-dashboard/blog",
  administrator: "/admin/blog",
};

const arrowIconStyle = { width: "clamp(8px, 1.04vw, 14px)", height: "auto", flexShrink: 0 };

type Props = {
  role: UserRole | null;
};

/** Blog landing hero — title, description, and (for teacher/moderator/admin) add + manage actions
 * directly under the description, plus an "all articles" gradient link in the top-right corner. */
export function BlogHeroSection({ role }: Props) {
  const canManage = !!role && role in MANAGE_HREF;

  const manageRow = (
    <div className="flex items-center" style={{ gap: "10px" }}>
      <GradientButton href="/blog/create">Add an Article</GradientButton>

      <Link
        href={MANAGE_HREF[role!]!}
        aria-label="Manage articles"
        title="Manage articles"
        className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-(--color-brand-lavender-soft)"
        style={{
          width: "clamp(36px, 2.71vw, 44px)",
          height: "clamp(36px, 2.71vw, 44px)",
          border: "1px solid var(--color-draft)",
        }}
      >
        <Settings size={18} style={{ color: "var(--color-text-primary)" }} />
      </Link>
    </div>
  );

  const allButton = (
    <GradientButton href="/blog/all">
      All
      <Image src="/icons/arrow-goto.png" alt="" width={14} height={14} style={arrowIconStyle} />
    </GradientButton>
  );

  return (
    <SectionContainer style={{ paddingTop: "7.19vw", paddingBottom: "2.5vw" }}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between" style={{ gap: "clamp(16px, 2vw, 29px)" }}>
        <div className="w-full lg:w-auto lg:max-w-[36.46vw]" style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.04vw, 15px)" }}>
          <h1
            className="text-[28px] leading-[34px] md:text-[38px] md:leading-[46px] lg:text-[clamp(28px,3.125vw,45px)] lg:leading-[clamp(34px,3.75vw,54px)] lg:whitespace-nowrap"
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Where <span className="bg-(--color-catalog-highlight) px-1 py-0.5 text-(--color-blue)">creativity</span> meets knowledge.
          </h1>
          <p
            className="text-[15px] leading-[19px] md:text-[18px] md:leading-[23px] lg:text-[clamp(15px,1.25vw,18px)] lg:leading-[clamp(19px,1.5625vw,22.5px)]"
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Explore articles, insights, and stories designed to inspire learning, innovation, and personal growth.
          </p>

          {canManage && <div className="hidden lg:flex" style={{ marginTop: "0.52vw" }}>{manageRow}</div>}
        </div>

        <div className="hidden lg:block">{allButton}</div>
      </div>

      <div className="mt-4 flex items-center justify-center lg:hidden" style={{ gap: "10px" }}>
        {canManage && manageRow}
        {allButton}
      </div>
    </SectionContainer>
  );
}
