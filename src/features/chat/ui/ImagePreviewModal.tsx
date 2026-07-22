"use client";

import { useState } from "react";
import { Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { downloadFile } from "../lib/downloadFile";

type Props = {
  url: string;
  alt: string;
  onClose: () => void;
};

/** Displays a chat image above the entire workspace. */
export function ImagePreviewModal({ url, alt, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  function changeZoom(amount: number) {
    setZoom((current) => Math.min(3, Math.max(1, Number((current + amount).toFixed(2)))));
  }

  async function downloadImage() {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadFile(url, alt || "chat-image");
    } catch {
      setDownloadError("Could not download image.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/80 p-6"
      onClick={onClose}
      onWheel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        changeZoom(event.deltaY < 0 ? 0.25 : -0.25);
      }}
    >
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <button
          type="button"
          aria-label="Download image"
          disabled={downloading}
          onClick={(event) => {
            event.stopPropagation();
            void downloadImage();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#121212] transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Close image preview"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#121212] transition hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/90 p-1 text-[#121212] shadow-lg">
        <button
          type="button"
          aria-label="Zoom out"
          disabled={zoom <= 1}
          onClick={(event) => {
            event.stopPropagation();
            changeZoom(-0.25);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#EEF2FF] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          onClick={(event) => {
            event.stopPropagation();
            setZoom(1);
          }}
          className="min-w-14 rounded-full px-2 text-xs font-semibold transition hover:bg-[#EEF2FF]"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          disabled={zoom >= 3}
          onClick={(event) => {
            event.stopPropagation();
            changeZoom(0.25);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#EEF2FF] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
      {downloadError ? (
        <p className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#FFF1F1] px-4 py-2 text-xs text-[#B42318]">
          {downloadError}
        </p>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => {
          event.stopPropagation();
          setZoom((current) => (current > 1 ? 1 : 2));
        }}
        style={{ transform: `scale(${zoom})`, transition: "transform 180ms ease" }}
        className="max-h-full max-w-full cursor-pointer rounded-xl object-contain shadow-2xl"
      />
    </div>
  );
}
