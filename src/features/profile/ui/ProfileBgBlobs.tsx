const BLOB: React.CSSProperties = {
  position: "fixed",
  width: "29.9vw",
  height: "67.8vw",
  filter: "blur(7.8vw)",
  transform: "rotate(-43.9deg)",
  pointerEvents: "none",
  zIndex: -1,
};

/**
 * Height is a share of the page, not a fixed pixel band: the tops are spaced by
 * 33% each, so anything shorter than that leaves uncoloured gaps between the
 * bands on a long page (the profile in edit mode is ~3000px tall). 40% keeps a
 * 7% overlap at every seam. The px floor covers very short pages.
 */
const MOBILE_BAND: React.CSSProperties = {
  position: "absolute",
  left: 0,
  width: "100%",
  height: "max(clamp(320px, 115vw, 480px), 40%)",
  filter: "blur(clamp(55px, 20vw, 100px))",
  opacity: 0.5,
  pointerEvents: "none",
  zIndex: -1,
};

export function ProfileBgBlobs() {
  return (
    <>
      <div className="block lg:hidden">
        <div style={{ ...MOBILE_BAND, top: "0%", background: "var(--color-brand-cream)" }} />
        <div style={{ ...MOBILE_BAND, top: "33%", background: "var(--color-brand-pink)" }} />
        <div style={{ ...MOBILE_BAND, top: "66%", background: "var(--color-brand-lavender)" }} />
      </div>

      <div className="hidden lg:block">
        <div
          style={{ ...BLOB, right: "30vw", top: "-6.67vw", background: "var(--color-brand-pink)" }}
        />
        <div
          style={{
            ...BLOB,
            right: "-10vw",
            top: "-27.4vw",
            background: "var(--color-brand-cream)",
          }}
        />
        <div
          style={{
            ...BLOB,
            left: "-10vw",
            top: "4.69vw",
            background: "var(--color-brand-lavender)",
          }}
        />
      </div>
    </>
  );
}
