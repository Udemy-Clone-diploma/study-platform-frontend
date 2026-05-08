"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/entities/user";
import { logout } from "@/features/auth/actions/logout";

const itemStyle: React.CSSProperties = {
    fontFamily: "var(--font-accent)",
    fontSize: 16,
    fontWeight: 500,
    textTransform: "uppercase",
    lineHeight: "20px",
    whiteSpace: "nowrap",
};

const ROLE_HOME: Record<UserRole, string> = {
    administrator: "/admin",
    moderator: "/admin",
    teacher: "/teacher-dashboard",
    student: "/student-dashboard",
};

export function UserDropdown({ firstName, role, avatar }: { firstName: string | null; role: UserRole | null; avatar: string | null }) {
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
        <div ref={ref} className="flex items-center h-full" style={{ position: "relative" }}>
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
                {avatar ? (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                        <Image src={avatar} alt="User" width={32} height={32} unoptimized style={{ width: 32, height: 32, objectFit: "cover" }} />
                    </div>
                ) : (
                    <Image src="/layout/user-icon.png" alt="User" width={24} height={24} style={{ width: 24, height: 24 }} />
                )}
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
                        top: "calc(100% + 8px)",
                        right: 0,
                        width: 220,
                        backgroundImage: "linear-gradient(90deg, var(--color-brand-lavender) 0%, var(--color-brand-pink) 50.96%, var(--color-brand-cream) 100%)",
                        backgroundAttachment: "fixed",
                        backgroundSize: "100vw 100%",
                        borderRadius: 12,
                        padding: "23px 117px 23px 16px",
                        zIndex: 50,
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <Link href="/profile" onClick={() => setOpen(false)} className="dropdown-link" style={itemStyle}>
                                Profile
                            </Link>
                            <div style={{ width: "100%", height: 0, borderTop: "1px solid #FFFFFF" }} />
                        </div>
                        <Link href={role ? ROLE_HOME[role] : "/student-dashboard"} onClick={() => setOpen(false)} className="dropdown-link" style={itemStyle}>
                            My Office
                        </Link>
                        <Link href="/coming-soon?page=MyCourses" onClick={() => setOpen(false)} className="dropdown-link" style={itemStyle}>
                            My Courses
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="dropdown-link"
                            style={{
                                ...itemStyle,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                textAlign: "left",
                                color: "var(--color-pink-dark)",
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

