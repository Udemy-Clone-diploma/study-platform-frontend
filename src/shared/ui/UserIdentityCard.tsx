import Image from "next/image";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type UserIdentitySocial = {
  key: string;
  label: string;
  href: string;
  iconSrc: string;
};

type Props = {
  name: string;
  avatar: string | null;
  socials: UserIdentitySocial[];
  onMessage?: () => void;
  messaging?: boolean;
  messageLabel?: string;
  topLeftAction?: ReactNode;
  topRightAction?: ReactNode;
  className?: string;
  compact?: boolean;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

const PROFILE_CARD_NAME_SIZE = 40;
const PROFILE_CARD_MIN_NAME_SIZE = 12;

function useFittedNameSize(name: string) {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const [fontSize, setFontSize] = useState(PROFILE_CARD_NAME_SIZE);

  useLayoutEffect(() => {
    const element = nameRef.current;
    const measureElement = measureRef.current;

    if (!element || !measureElement) return;

    const fitName = () => {
      const availableWidth = element.clientWidth;
      const contentWidth = measureElement.getBoundingClientRect().width;

      if (!availableWidth || !contentWidth) return;

      const nextFontSize =
        contentWidth <= availableWidth
          ? PROFILE_CARD_NAME_SIZE
          : Math.max(
              PROFILE_CARD_MIN_NAME_SIZE,
              Math.floor((PROFILE_CARD_NAME_SIZE * availableWidth) / contentWidth),
            );

      setFontSize((current) => (current === nextFontSize ? current : nextFontSize));
    };

    fitName();

    const observer = new ResizeObserver(fitName);
    observer.observe(element);

    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) fitName();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [name]);

  return {
    nameRef,
    measureRef,
    fontSize,
  };
}

/** Fixed-size profile identity card shared by teacher analytics and public-profile modals. */
export function UserIdentityCard({
  name,
  avatar,
  socials,
  onMessage,
  messaging = false,
  messageLabel = "Send message",
  topLeftAction,
  topRightAction,
  className = "",
  compact = false,
}: Props) {
  const { nameRef, measureRef, fontSize } = useFittedNameSize(name);

  return (
    <article
      className={`relative flex w-full flex-col items-center overflow-hidden rounded-2xl bg-(--color-bg) text-center shadow-(--shadow-dashboard-card) ${
        compact
          ? "min-h-[392px] px-4 pb-6 pt-8 sm:h-138 sm:px-6 sm:pb-(--profile-card-button-bottom) sm:pt-12"
          : "h-138 px-6 pb-(--profile-card-button-bottom) pt-12"
      } ${className}`.trim()}
    >
      {topLeftAction ? <div className="absolute left-4 top-4 z-10">{topLeftAction}</div> : null}
      {topRightAction ? <div className="absolute right-4 top-4 z-10">{topRightAction}</div> : null}

      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-(--color-surface) ${
          compact ? "h-36 w-36 sm:h-60 sm:w-60" : "h-60 w-60"
        }`}
      >
        {avatar ? (
          <Image src={avatar} alt={name} fill unoptimized sizes="240px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-(image:--gradient-ellipse) text-5xl font-bold text-(--color-text-primary)">
            {initials(name)}
          </div>
        )}
      </div>

      <div className={`relative w-full min-w-0 ${compact ? "mt-4 sm:mt-6" : "mt-6"}`}>
        {/* Невидимый текст всегда измеряется с базовым размером 40px */}
        <span
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none absolute invisible w-max max-w-none whitespace-nowrap font-bold leading-tight"
          style={{ fontSize: `${PROFILE_CARD_NAME_SIZE}px`, width: "max-content" }}
        >
          {name}
        </span>

        <h1
          ref={nameRef}
          className="w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis font-bold leading-tight text-(--color-text-primary)"
          style={{ fontSize: `${fontSize}px` }}
          title={name}
        >
          {name}
        </h1>
      </div>

      <div
        className={`flex min-h-10 items-center justify-center ${
          compact ? "mt-4 gap-5 sm:mt-6 sm:gap-9" : "mt-6 gap-9"
        }`}
      >
        {socials.map((social) => (
          <a
            key={social.key}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${name}'s ${social.label}`}
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue)"
          >
            <Image src={social.iconSrc} alt="" width={40} height={40} className="h-10 w-10" />
          </a>
        ))}
      </div>

      {onMessage ? (
        <button
          type="button"
          onClick={onMessage}
          disabled={messaging}
          className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-(--color-text-primary) font-(family-name:--font-accent) font-medium uppercase text-(--color-bg) transition hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue) disabled:cursor-not-allowed disabled:opacity-60 ${
            compact
              ? "mt-6 h-12 w-full max-w-[220px] px-5 text-base sm:mt-auto sm:h-13 sm:w-60 sm:px-7 sm:text-xl"
              : "mt-auto h-13 w-60 px-7 text-xl"
          }`}
        >
          {messaging ? (
            <Loader2 aria-label="Opening conversation" className="h-6 w-6 animate-spin" />
          ) : (
            <>
              {messageLabel}
              <ArrowUpRight
                aria-hidden="true"
                className={compact ? "h-5 w-5 sm:h-7 sm:w-7" : "h-7 w-7"}
              />
            </>
          )}
        </button>
      ) : null}
    </article>
  );
}
