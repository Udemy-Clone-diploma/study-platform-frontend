"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/features/auth/actions/logout";

const itemStyle: React.CSSProperties = {
    fontFamily: "var(--font-accent)",
    fontSize: 16,
    fontWeight: 500,
    textTransform: "uppercase",
    color: "var(--color-text-primary)",
    lineHeight: "20px",
};

export function UserDropdown({ firstName }: { firstName: string | null }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        function onOutsideClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onOutsideClick);
        return () => document.removeEventListener("mousedown", onOutsideClick);
    }, []);

    async function handleLogout() {
        setOpen(false);
        await logout();
        router.push("/");
        router.refresh();
    }

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "clamp(14px, 1.41vw, 20px)",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                }}
            >
                <Image src="/layout/user-icon.png" alt="User" width={24} height={24} style={{ width: 24, height: 24 }} />
                {firstName ?? "User"}
                <span style={{
                    width: 36,
                    height: 36,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "transform 0.2s",
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                }}>
                    <Image src="/icons/caret-down.png" alt="" width={16} height={8} />
                </span>
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 12px)",
                        right: 0,
                        width: 220,
                        background: "linear-gradient(90deg, var(--color-brand-lavender) -659.09%, var(--color-brand-pink) -214.34%, var(--color-brand-cream) 213.64%)",
                        borderRadius: 12,
                        padding: "23px 117px 23px 16px",
                        zIndex: 50,
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <Link href="/coming-soon?page=Profile" onClick={() => setOpen(false)} style={itemStyle}>
                            Profile
                        </Link>
                        <Link href="/dashboard" onClick={() => setOpen(false)} style={itemStyle}>
                            My Office
                        </Link>
                        <button
                            onClick={handleLogout}
                            style={{
                                ...itemStyle,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                textAlign: "left",
                            }}
                        >
                            Exit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
