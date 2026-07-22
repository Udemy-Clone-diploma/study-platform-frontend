"use client";

import { Plus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { AccentButton } from "@/shared/ui/AccentButton";
import { WhiteButton } from "@/shared/ui/WhiteButton";
import type { UserRole } from "@/entities/user";

const MANAGE_HREF: Partial<Record<UserRole, string>> = {
  teacher: "/teacher-dashboard/blog",
  moderator: "/moderator-dashboard/blog",
  administrator: "/admin/blog",
};

type Props = {
  role: UserRole | null;
};

/** Blog landing hero — title, description, and (for teacher/moderator/admin) add + manage actions. */
export function BlogHeroSection({ role }: Props) {
  const router = useRouter();
  const canManage = !!role && role in MANAGE_HREF;

  return (
    <SectionContainer style={{ paddingTop: "7.19vw", paddingBottom: "2.5vw" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2vw", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw", maxWidth: "36.46vw" }}>
          <h1
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              fontSize: "3.125vw",
              lineHeight: "3.75vw",
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Where <span style={{ color: "var(--color-blue)" }}>creativity</span> meets knowledge.
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
        </div>

        {canManage && (
          <div className="flex items-center" style={{ gap: "1vw" }}>
            <WhiteButton icon={<Settings size={18} />} onClick={() => router.push(MANAGE_HREF[role!]!)} style={{ minWidth: "unset" }}>
              Manage
            </WhiteButton>
            <AccentButton href="/blog/create" size="md" style={{ minWidth: "unset", gap: 8, display: "inline-flex", alignItems: "center" }}>
              <Plus size={16} /> Add Article
            </AccentButton>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
