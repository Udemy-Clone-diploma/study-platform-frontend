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

  return (
    <SectionContainer style={{ paddingTop: "7.19vw", paddingBottom: "2.5vw" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "2vw" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw", maxWidth: "36.46vw" }}>
          <h1
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              fontSize: "3.125vw",
              lineHeight: "3.75vw",
              color: "var(--color-text-primary)",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Where <span className="bg-(--color-catalog-highlight) px-1 py-0.5 text-(--color-blue)">creativity</span> meets knowledge.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              fontSize: "1.25vw",
              lineHeight: "1.5625vw",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Explore articles, insights, and stories designed to inspire learning, innovation, and personal growth.
          </p>

          {canManage && (
            <div className="flex items-center" style={{ gap: "0.83vw", marginTop: "0.52vw" }}>
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
          )}
        </div>

        <GradientButton href="/blog/all">
          All
          <Image src="/icons/arrow-goto.png" alt="" width={14} height={14} style={arrowIconStyle} />
        </GradientButton>
      </div>
    </SectionContainer>
  );
}
