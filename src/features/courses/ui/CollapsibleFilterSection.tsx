"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";

type CollapsibleFilterSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleFilterSection({
  title,
  children,
  defaultOpen = true,
}: CollapsibleFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <h2 className="text-[0.76rem] font-medium text-[#211e23]">{title}</h2>
        <Image
          src="/icons/weui_arrow-outlined.png"
          alt=""
          aria-hidden="true"
          width={25}
          height={25}
          className={`h-[25px] w-[25px] object-contain transition ${isOpen ? "" : "rotate-180"}`}
        />
      </button>

      {isOpen ? <div className="space-y-2">{children}</div> : null}
    </section>
  );
}
