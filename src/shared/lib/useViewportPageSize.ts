"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Returns a pageSize that fills the viewport without vertical overflow,
 * and a gridRef to attach to the first card grid so the hook can measure
 * a real card's height.
 *
 * reserved – pixels to subtract from window.innerHeight before card rows
 *            (header + tab bar + page padding top/bottom + month heading + pagination).
 */
export function useViewportPageSize(reserved = 300) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(8);

  const recalc = useCallback(() => {
    const firstCard = gridRef.current?.children[0] as HTMLElement | null;
    if (!firstCard) return;

    const cardH = firstCard.getBoundingClientRect().height;
    const gap = Math.max(8, Math.min(16, window.innerWidth * 0.0111));
    const availH = Math.max(cardH + gap, window.innerHeight - reserved);
    const rows = Math.max(1, Math.floor(availH / (cardH + gap)));

    const w = window.innerWidth;
    const cols = w >= 1280 ? 4 : w >= 1024 ? 3 : w >= 640 ? 2 : 1;

    setPageSize(rows * cols);
  }, [reserved]);

  useEffect(() => {
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc]);

  return { pageSize, gridRef, recalc };
}