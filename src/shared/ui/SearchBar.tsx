"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const t = useTranslations("Common");
  const tSearchBar = useTranslations("SearchBar");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?search=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-[10px] flex-1"
      style={{
        minWidth: 180,
        maxWidth: 460,
        height: 46,
        background: "var(--color-bg)",
        border: "1px solid var(--color-brand-pink)",
        borderRadius: 40,
        padding: "10px 16px",
      }}
    >
      <button
        type="submit"
        aria-label={t("search")}
        style={{
          width: 32,
          height: 32,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <Image src="/icons/search.png" alt="" width={24} height={24} />
      </button>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tSearchBar("placeholder")}
        className="flex-1 min-w-0 bg-transparent outline-none"
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(14px, 1.41vw, 20px)",
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: 0,
          color: "var(--color-text-primary)",
        }}
      />
    </form>
  );
}
