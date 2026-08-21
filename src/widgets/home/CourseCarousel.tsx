"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { PublicCourseListItem } from "@/entities/course";
import { CourseCard } from "@/features/courses";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_HOVER_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
const LOOP_DURATION_MS = 60_000;
const RESUME_DELAY_MS = 900;

type Props = {
  courses: PublicCourseListItem[];
  wishlistedSlugs: string[];
  direction: "left" | "right";
  viewportStyle?: CSSProperties;
};

/** An infinite course row with desktop hover pause and touch-friendly mobile autoplay. */
export function CourseCarousel({ courses, wishlistedSlugs, direction, viewportStyle }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstCopyRef = useRef<HTMLDivElement>(null);
  const copyWidthRef = useRef(0);
  const touchActiveRef = useRef(false);
  const interactionPausedRef = useRef(false);
  const hoverPausedRef = useRef(false);
  const scrollRemainderRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);
  const wishlistSet = new Set(wishlistedSlugs);

  const clearResumeTimer = () => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const scheduleAutoplayResume = () => {
    clearResumeTimer();
    resumeTimerRef.current = window.setTimeout(() => {
      interactionPausedRef.current = false;
      resumeTimerRef.current = null;
    }, RESUME_DELAY_MS);
  };

  const handleTouchStart = () => {
    clearResumeTimer();
    touchActiveRef.current = true;
    interactionPausedRef.current = true;
    scrollRemainderRef.current = 0;
  };

  const handleScroll = () => {
    const viewport = viewportRef.current;
    const copyWidth = copyWidthRef.current;
    if (!viewport || copyWidth <= 0) return;

    if (viewport.scrollLeft > copyWidth) {
      viewport.scrollLeft -= copyWidth;
    } else if (viewport.scrollLeft <= 0) {
      viewport.scrollLeft += copyWidth;
    }

    if (interactionPausedRef.current && !touchActiveRef.current) {
      scheduleAutoplayResume();
    }
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstCopy = firstCopyRef.current;
    if (!viewport || !firstCopy || courses.length === 0) return;

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    const desktopHover = window.matchMedia(DESKTOP_HOVER_QUERY);
    let animationFrame = 0;
    let previousFrameTime: number | null = null;

    const measureCopy = () => {
      copyWidthRef.current = firstCopy.offsetWidth;
    };

    const animate = (time: number) => {
      const elapsed = previousFrameTime === null ? 0 : Math.min(time - previousFrameTime, 64);
      previousFrameTime = time;

      const copyWidth = copyWidthRef.current;
      if (
        !reducedMotion.matches &&
        !interactionPausedRef.current &&
        !(hoverPausedRef.current && desktopHover.matches) &&
        copyWidth > 0
      ) {
        const distance = (copyWidth * elapsed) / LOOP_DURATION_MS;
        scrollRemainderRef.current += direction === "left" ? distance : -distance;

        const wholePixels =
          scrollRemainderRef.current > 0
            ? Math.floor(scrollRemainderRef.current)
            : Math.ceil(scrollRemainderRef.current);

        if (wholePixels !== 0) {
          viewport.scrollLeft += wholePixels;
          scrollRemainderRef.current -= wholePixels;
        }
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    measureCopy();
    viewport.scrollLeft = copyWidthRef.current;
    animationFrame = window.requestAnimationFrame(animate);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureCopy);
    const releaseTouch = () => {
      if (!touchActiveRef.current) return;

      touchActiveRef.current = false;
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
      resumeTimerRef.current = window.setTimeout(() => {
        interactionPausedRef.current = false;
        resumeTimerRef.current = null;
      }, RESUME_DELAY_MS);
    };

    resizeObserver?.observe(firstCopy);
    window.addEventListener("resize", measureCopy);
    window.addEventListener("touchend", releaseTouch, { passive: true });
    window.addEventListener("touchcancel", releaseTouch, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureCopy);
      window.removeEventListener("touchend", releaseTouch);
      window.removeEventListener("touchcancel", releaseTouch);
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
  }, [courses.length, direction]);

  const renderCopy = (copyIndex: number) =>
    courses.map((course, index) => (
      <CourseCard
        key={`${copyIndex}-${course.id}-${index}`}
        course={course}
        isWishlisted={wishlistSet.has(course.slug)}
      />
    ));

  return (
    <div
      ref={viewportRef}
      className="home-course-carousel-viewport drag-scroll"
      style={{ padding: "16px 0", ...viewportStyle }}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
    >
      <div
        className="home-course-carousel-track"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && window.matchMedia(DESKTOP_HOVER_QUERY).matches) {
            hoverPausedRef.current = true;
          }
        }}
        onPointerLeave={() => {
          hoverPausedRef.current = false;
        }}
        style={{ minHeight: "clamp(300px, calc(284.95px + 4.01vw), 362px)" }}
      >
        <div ref={firstCopyRef} className="home-course-carousel-set">
          {renderCopy(0)}
        </div>
        <div className="home-course-carousel-set">{renderCopy(1)}</div>
      </div>
    </div>
  );
}
