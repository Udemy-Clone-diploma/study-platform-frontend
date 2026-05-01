import Image from "next/image";

export function SearchBar() {
    return (
        <label
            className="flex items-center gap-[10px] cursor-text flex-1"
            style={{
                minWidth: 180,
                maxWidth: 460,
                height: 46,
                background: "var(--color-bg)",
                border: "1px solid var(--color-brand-pink)",
                borderRadius: 40,
                padding: "10px 16px",
            }}
        >
            <span style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Image src="/icons/search.png" alt="" width={24} height={24} />
            </span>
            <input
                type="search"
                placeholder="Search 10,000+ articles"
                className="flex-1 min-w-0 bg-transparent outline-none"
                style={{
                    fontFamily: "var(--font-base)",
                    fontSize: "clamp(14px, 1.41vw, 20px)",
                    fontWeight: 400,
                    lineHeight: 1,
                    letterSpacing: 0,
                    color: "var(--color-text-primary)",
                }}
            />
        </label>
    );
}
