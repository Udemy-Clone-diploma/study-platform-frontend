"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  onClose: () => void;
  /** If provided, renders a header row: icon + title + X close button. */
  title?: string;
  icon?: React.ReactNode;
  width?: string;
  padding?: string;
  shadow?: string;
  /** Enables vertical scroll inside the card (default: "90vh"). Pass undefined to disable. */
  maxHeight?: string;
  /** Minimum height of the scrollable inner area. */
  minHeight?: string;
  /** CSS z-index for the overlay. Use a higher value for nested modals (default: 50). */
  zIndex?: number;
  /** Set false to keep the modal open when the overlay backdrop is clicked (default: true). */
  closeOnOverlayClick?: boolean;
  /** Accessible name used when the modal has no visible title. */
  ariaLabel?: string;
  children: React.ReactNode;
};

const subscribeToClientMount = () => () => {};
const getClientMountSnapshot = () => true;
const getServerMountSnapshot = () => false;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Shared modal wrapper — overlay backdrop + white rounded card + optional header. */
export function ModalShell({
  onClose,
  title,
  icon,
  width = "clamp(480px, 81.39vw, 1200px)",
  padding = "clamp(20px, 2.78vw, 40px) clamp(24px, 3.47vw, 50px)",
  shadow = "var(--shadow-dashboard-card)",
  maxHeight = "90vh",
  minHeight,
  zIndex = 50,
  closeOnOverlayClick = true,
  ariaLabel,
  children,
}: Props) {
  const t = useTranslations("Common");
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const onCloseRef = useRef(onClose);
  const closeAllowedRef = useRef(closeOnOverlayClick);
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    getClientMountSnapshot,
    getServerMountSnapshot,
  );

  useEffect(() => {
    onCloseRef.current = onClose;
    closeAllowedRef.current = closeOnOverlayClick;
  }, [closeOnOverlayClick, onClose]);

  useEffect(() => {
    if (!mounted) return;

    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    if (!overlay || !dialog) return;
    const dialogElement = dialog;
    const returnFocusElement = returnFocusRef.current;

    const backgroundElements = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== overlay,
    );
    const previousInertValues = backgroundElements.map(
      (element) => [element, element.inert] as const,
    );
    backgroundElements.forEach((element) => {
      element.inert = true;
    });

    const focusableElements = () =>
      Array.from(dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.getAttribute("aria-hidden") !== "true",
      );

    if (
      !(document.activeElement instanceof Node) ||
      !dialogElement.contains(document.activeElement)
    ) {
      focusableElements()[0]?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && closeAllowedRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !dialogElement.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === last || !dialogElement.contains(activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousInertValues.forEach(([element, wasInert]) => {
        element.inert = wasInert;
      });
      if (returnFocusElement?.isConnected) returnFocusElement.focus();
    };
  }, [mounted]);

  const content = (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex, backgroundColor: "var(--color-modal-overlay)" }}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      {/* overflow-hidden on the outer box so border-radius clips correctly */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className="bg-white rounded-2xl"
        style={{ width, boxShadow: shadow, overflow: "clip" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* inner scrollable wrapper */}
        <div
          style={{
            padding,
            ...(maxHeight ? { maxHeight, overflowY: "auto" as const } : {}),
            ...(minHeight ? { minHeight } : {}),
          }}
        >
          {title !== undefined && (
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: "clamp(20px, 2.22vw, 32px)" }}
            >
              <div className="flex items-center" style={{ gap: 8 }}>
                {icon}
                <h2
                  style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 700,
                    fontSize: "clamp(16px, 1.39vw, 20px)",
                    lineHeight: "25px",
                    color: "var(--color-text-primary)",
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
                style={{
                  width: 32,
                  height: 32,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                aria-label={t("close")}
              >
                <X size={20} style={{ color: "var(--color-text-primary)" }} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
