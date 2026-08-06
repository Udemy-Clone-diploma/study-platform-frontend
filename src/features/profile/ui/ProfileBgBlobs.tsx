const BLOB: React.CSSProperties = {
    position: "fixed",
    width: "29.9vw", height: "67.8vw",
    filter: "blur(7.8vw)", transform: "rotate(-43.9deg)",
    pointerEvents: "none", zIndex: -1,
};

const MOBILE_BAND: React.CSSProperties = {
    position: "absolute",
    left: 0,
    width: "100%",
    height: "clamp(320px, 115vw, 480px)",
    filter: "blur(clamp(55px, 20vw, 100px))",
    opacity: 0.5,
    pointerEvents: "none", zIndex: -1,
};

export function ProfileBgBlobs() {
    return (
        <>
            {/* Mobile: full-width bands stacked one under another down the whole page */}
            <div className="block lg:hidden">
                <div style={{ ...MOBILE_BAND, top: "0%",  background: "var(--color-brand-cream)" }} />
                <div style={{ ...MOBILE_BAND, top: "38%", background: "var(--color-brand-pink)" }} />
                <div style={{ ...MOBILE_BAND, top: "76%", background: "var(--color-brand-lavender)" }} />
            </div>

            {/* Desktop: fixed corner blobs */}
            <div className="hidden lg:block">
                <div style={{ ...BLOB, right: "30vw",  top: "-6.67vw",  background: "var(--color-brand-pink)" }} />
                <div style={{ ...BLOB, right: "-10vw", top: "-27.4vw",  background: "var(--color-brand-cream)" }} />
                <div style={{ ...BLOB, left: "-10vw",  top: "4.69vw",   background: "var(--color-brand-lavender)" }} />
            </div>
        </>
    );
}