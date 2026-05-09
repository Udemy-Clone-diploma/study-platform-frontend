const BLOB: React.CSSProperties = {
    position: "fixed",
    width: "29.9vw", height: "67.8vw",
    filter: "blur(7.8vw)", transform: "rotate(-43.9deg)",
    pointerEvents: "none", zIndex: -1,
};

export function ProfileBgBlobs() {
    return (
        <>
            <div style={{ ...BLOB, right: "30vw",  top: "-6.67vw",  background: "var(--color-brand-pink)" }} />
            <div style={{ ...BLOB, right: "-10vw", top: "-27.4vw",  background: "var(--color-brand-cream)" }} />
            <div style={{ ...BLOB, left: "-10vw",  top: "4.69vw",   background: "var(--color-brand-lavender)" }} />
        </>
    );
}