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
}: Props) {
  const { nameRef, measureRef, fontSize } = useFittedNameSize(name);

  return (
    <article
      className={`relative flex h-138 w-full flex-col items-center overflow-hidden rounded-2xl bg-(--color-bg) px-6 pb-(--profile-card-button-bottom) pt-12 text-center shadow-(--shadow-dashboard-card) ${className}`.trim()}
    >
      {topLeftAction ? <div className="absolute left-4 top-4 z-10">{topLeftAction}</div> : null}
      {topRightAction ? <div className="absolute right-4 top-4 z-10">{topRightAction}</div> : null}

      <div className="relative h-60 w-60 shrink-0 overflow-hidden rounded-full bg-(--color-surface)">
        {avatar ? (
          <Image src={avatar} alt={name} fill unoptimized sizes="240px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-(image:--gradient-ellipse) text-5xl font-bold text-(--color-text-primary)">
            {initials(name)}
          </div>
        )}
      </div>

      <div className="relative mt-6 w-full min-w-0">
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

      <div className="mt-6 flex min-h-10 items-center justify-center gap-9">
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
          className="mt-auto inline-flex h-13 w-60 items-center justify-center gap-2.5 rounded-full bg-(--color-text-primary) px-7 font-(family-name:--font-accent) text-xl font-medium uppercase text-(--color-bg) transition hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {messaging ? (
            <Loader2 aria-label="Opening conversation" className="h-6 w-6 animate-spin" />
          ) : (
            <>
              {messageLabel}
              <ArrowUpRight aria-hidden="true" className="h-7 w-7" />
            </>
          )}
        </button>
      ) : null}
    </article>
  );
}
