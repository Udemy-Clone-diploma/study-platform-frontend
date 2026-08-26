"use client";

import { useEffect, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ModalShell } from "./ModalShell";
import { sanitizeCourseHtml } from "@/shared/lib/sanitizeCourseHtml";

type Props = {
  title: string;
  url: string | null;
  onClose: () => void;
};

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "avif", "svg"]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov", "mkv", "avi", "m4v"]);
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac"]);
const TEXT_EXT = new Set(["txt", "md", "csv", "log", "json"]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

/** `?download=<name>` tells the backend to send `Content-Disposition: attachment`,
 *  so the browser saves the file instead of just opening it in a new tab. */
function downloadHref(url: string, filename: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}download=${encodeURIComponent(filename)}`;
}

type Body = { kind: "text"; value: string } | { kind: "html"; value: string };

/** Renders each PDF page as an image (via pdfjs-dist) into the same white,
 *  toolbar-free surface used for text/.docx — not the browser's native viewer. */
function PdfPreview({ url }: { url: string }) {
  const t = useTranslations("MaterialPreviewModal");
  const tCommon = useTranslations("Common");
  const [pages, setPages] = useState<string[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPages(null);
    setError(false);

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const pdf = await pdfjsLib.getDocument({ url }).promise;
        const targetWidth = 760;
        const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        const images: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const baseViewport = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (targetWidth / baseViewport.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvas, viewport }).promise;
          images.push(canvas.toDataURL("image/png"));
        }
        if (!cancelled) setPages(images);
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <p className="py-6 text-center text-sm text-(--color-text-secondary)">
        {t("couldNotLoadPreview")}
      </p>
    );
  }
  if (pages === null) {
    return (
      <p className="py-6 text-center text-sm text-(--color-text-secondary)">{tCommon("loading")}</p>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-md bg-white p-5">
      {pages.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt={t("pageNumber", { number: i + 1 })}
          className="w-full rounded-sm shadow-sm"
        />
      ))}
    </div>
  );
}

/**
 * Format-aware preview: images render inline, PDF pages are rasterized and
 * shown as images (no native browser viewer chrome), video/audio get a
 * player, .txt/.md/.csv files are fetched and shown as text, and .docx is
 * converted to HTML client-side (mammoth). Legacy .doc and other office
 * formats (xlsx/ppt...) have no reliable in-browser renderer, so they fall
 * back to a Download-only view.
 */
export function MaterialPreviewModal({ title, url, onClose }: Props) {
  const t = useTranslations("MaterialPreviewModal");
  const tCommon = useTranslations("Common");
  const ext = extOf(title);
  const isImage = IMAGE_EXT.has(ext);
  const isVideo = VIDEO_EXT.has(ext);
  const isAudio = AUDIO_EXT.has(ext);
  const isPdf = ext === "pdf";
  const isText = TEXT_EXT.has(ext);
  const isDocx = ext === "docx";

  const [body, setBody] = useState<Body | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!url || (!isText && !isDocx)) return;

    if (isText) {
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.text();
        })
        .then((value) => setBody({ kind: "text", value }))
        .catch(() => setLoadError(true));
      return;
    }

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.arrayBuffer();
      })
      .then(async (buffer) => {
        const mammoth = await import("mammoth");
        const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer });
        setBody({ kind: "html", value: sanitizeCourseHtml(value) });
      })
      .catch(() => setLoadError(true));
  }, [url, isText, isDocx]);

  const wide = isImage || isPdf || isVideo || isDocx;

  return (
    <ModalShell
      onClose={onClose}
      width={wide ? "clamp(360px, 60vw, 820px)" : "clamp(320px, 32vw, 480px)"}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="min-w-0 truncate text-lg font-bold text-(--color-text-primary)">{title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {url && (
            <a
              href={downloadHref(url, title)}
              title={t("download")}
              aria-label={t("download")}
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100"
            >
              <Download size={18} className="text-(--color-text-primary)" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("close")}
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100"
          >
            <X size={20} className="text-(--color-text-primary)" />
          </button>
        </div>
      </div>

      {!url ? (
        <p className="py-6 text-center text-sm text-(--color-text-secondary)">
          {t("fileUnavailable")}
        </p>
      ) : isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="w-full rounded-md object-contain" />
      ) : isPdf ? (
        <PdfPreview url={url} />
      ) : isVideo ? (
        <video src={url} controls className="w-full rounded-md" />
      ) : isAudio ? (
        <div className="flex flex-col items-center gap-6 py-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-[#fff3dc] to-[#ffe7ef]">
            <FileText size={30} className="text-(--color-text-secondary)" />
          </span>
          <audio src={url} controls className="w-full" />
        </div>
      ) : isText || isDocx ? (
        loadError ? (
          <p className="py-6 text-center text-sm text-(--color-text-secondary)">
            {t("couldNotLoadPreview")}
          </p>
        ) : body === null ? (
          <p className="py-6 text-center text-sm text-(--color-text-secondary)">
            {tCommon("loading")}
          </p>
        ) : body.kind === "text" ? (
          <pre className="whitespace-pre-wrap break-words rounded-md bg-white p-5 text-base leading-relaxed text-(--color-text-primary)">
            {body.value}
          </pre>
        ) : (
          <div
            className="rounded-md bg-white p-5 text-base leading-relaxed text-(--color-text-primary) [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6"
            dangerouslySetInnerHTML={{ __html: body.value }}
          />
        )
      ) : (
        <div className="flex flex-col items-center gap-6 py-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-[#fff3dc] to-[#ffe7ef]">
            <FileText size={30} className="text-(--color-text-secondary)" />
          </span>
          <p className="text-center text-xs text-(--color-text-secondary)">
            {t("previewNotAvailable")}
          </p>
        </div>
      )}
    </ModalShell>
  );
}
