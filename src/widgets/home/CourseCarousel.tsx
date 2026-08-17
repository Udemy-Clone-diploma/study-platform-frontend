"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { PublicCourseListItem } from "@/entities/course";
import { CourseCard } from "@/features/courses";

const MOBILE_CAROUSEL_QUERY = "(max-width: 1023px), (hover: none), (pointer: coarse)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
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
  const nativeScrollRef = useRef(false);
  const touchActiveRef = useRef(false);
  const interactionPausedRef = useRef(false);
  const scrollRemainderRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);
  const [hoverPaused, setHoverPaused] = useState(false);
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

  const handleTouchEnd = () => {
    touchActiveRef.current = false;
    scheduleAutoplayResume();
  };

  const handleScroll = () => {
    if (!nativeScrollRef.current) return;

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

    const mobileCarousel = window.matchMedia(MOBILE_CAROUSEL_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let animationFrame = 0;
    let previousFrameTime: number | null = null;

    const measureCopy = () => {
      copyWidthRef.current = firstCopy.offsetWidth;
    };

    const animate = (time: number) => {
      const elapsed = previousFrameTime === null ? 0 : Math.min(time - previousFrameTime, 64);
      previousFrameTime = time;

      const copyWidth = copyWidthRef.current;
      if (!interactionPausedRef.current && copyWidth > 0) {
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

    const syncMode = () => {
      window.cancelAnimationFrame(animationFrame);
      previousFrameTime = null;
      scrollRemainderRef.current = 0;

      const useNativeScroll = mobileCarousel.matches || reducedMotion.matches;
      const wasUsingNativeScroll = nativeScrollRef.current;
      nativeScrollRef.current = useNativeScroll;
      measureCopy();

      if (!useNativeScroll) {
        viewport.scrollLeft = 0;
        return;
      }

      if (!wasUsingNativeScroll || viewport.scrollLeft <= 0) {
        viewport.scrollLeft = copyWidthRef.current;
      }

      if (mobileCarousel.matches && !reducedMotion.matches) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    syncMode();

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureCopy);
    resizeObserver?.observe(firstCopy);
    window.addEventListener("resize", measureCopy);
    mobileCarousel.addEventListener("change", syncMode);
    reducedMotion.addEventListener("change", syncMode);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureCopy);
      mobileCarousel.removeEventListener("change", syncMode);
      reducedMotion.removeEventListener("change", syncMode);
      clearResumeTimer();
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
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="home-course-carousel-track"
        data-direction={direction}
        data-paused={hoverPaused}
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
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
