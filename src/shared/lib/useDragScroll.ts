"use client";

import { useRef } from "react";

/** Click-and-drag horizontal scrolling for a ref'd container (desktop mouse users; touch scrolls natively). */
export function useDragScroll<T extends HTMLElement>() {
  const scrollRef = useRef<T>(null);
  const isDown = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onPointerDown = (e: React.PointerEvent<T>) => {
    const el = scrollRef.current;
    if (!el) return;
    isDown.current = true;
    isDragging.current = false;
    startX.current = e.pageX;
    scrollLeft.current = el.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent<T>) => {
    if (!isDown.current || !scrollRef.current) return;
    // Belt-and-suspenders: if the primary button isn't actually held anymore
    // (e.g. a pointerup/pointercancel was missed -- see onDragStart below),
    // stop dragging instead of leaving scrollLeft stuck following stray moves.
    if ((e.buttons & 1) === 0) {
      isDown.current = false;
      isDragging.current = false;
      scrollRef.current.style.cursor = "grab";
      return;
    }
    const dx = e.pageX - startX.current;
    if (!isDragging.current && Math.abs(dx) < 5) return;
    if (!isDragging.current) {
      isDragging.current = true;
      scrollRef.current.setPointerCapture(e.pointerId);
      scrollRef.current.style.cursor = "grabbing";
    }
    scrollRef.current.scrollLeft = scrollLeft.current - dx;
  };

  const onPointerUp = (e: React.PointerEvent<T>) => {
    isDown.current = false;
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
      if (scrollRef.current.hasPointerCapture(e.pointerId)) {
        scrollRef.current.releasePointerCapture(e.pointerId);
      }
    }
  };

  // Cards inside the scroll area are covered in <a>/<img> elements, which browsers
  // make natively draggable -- a click-drag gesture starting on one can be hijacked
  // into a native drag-and-drop instead of our pointer-based scroll, and pointerup
  // never fires afterward (the "click sticks" bug). Blocking dragstart keeps the
  // whole gesture on our own pointer handlers.
  const onDragStart = (e: React.DragEvent<T>) => {
    e.preventDefault();
  };

  return { scrollRef, onPointerDown, onPointerMove, onPointerUp, onDragStart, onPointerCancel: onPointerUp };
}
