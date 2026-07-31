"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Position = { top: number; left: number; below: boolean };

/** Hover/focus hint rendered in a portal so surrounding `overflow-hidden` containers cannot clip it. */
export function Tooltip({
  content,
  children,
  className = "",
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [position, setPosition] = useState<Position | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);

  function show() {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = rect.top < 84;
    setPosition({
      top: below ? rect.bottom + 8 : rect.top - 8,
      left: rect.left + rect.width / 2,
      below,
    });
  }

  function hide() {
    setPosition(null);
  }

  return (
    <>
      <span
        ref={anchorRef}
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={`inline-flex max-w-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue) ${className}`.trim()}
      >
        {children}
      </span>

      {position
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-50 block w-max max-w-72 rounded-lg bg-(--color-text-primary) px-3 py-2 text-xs leading-snug text-white shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
              style={{
                top: position.top,
                left: position.left,
                transform: `translate(-50%, ${position.below ? "0" : "-100%"})`,
              }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
