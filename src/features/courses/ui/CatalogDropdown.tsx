"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/features/courses/model/types/category";

type Props = {
    categories: Category[];
};

const itemStyle: React.CSSProperties = {
    fontFamily: "var(--font-accent)",
    fontSize: 16,
    fontWeight: 500,
    textTransform: "uppercase",
    lineHeight: "20px",
    whiteSpace: "nowrap",
};

export function CatalogDropdown({ categories }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onOutsideClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onOutsideClick);
        return () => document.removeEventListener("mousedown", onOutsideClick);
    }, []);

    return (
        <div ref={ref} className="flex items-center h-full" style={{ position: "relative" }}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "clamp(14px, 1.41vw, 20px)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    color: "var(--color-text-primary)",
                    lineHeight: 1.25,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                }}
            >
                Catalog
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
                        left: 0,
                        minWidth: 220,
                        width: "max-content",
                        backgroundImage: "linear-gradient(90deg, var(--color-brand-lavender) 0%, var(--color-brand-pink) 50.96%, var(--color-brand-cream) 100%)",
                        backgroundAttachment: "fixed",
                        backgroundSize: "100vw 100%",
                        borderRadius: 12,
                        padding: "23px 40px 23px 16px",
                        zIndex: 50,
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <Link
                            href="/catalog"
                            onClick={() => setOpen(false)}
                            className="dropdown-link"
                            style={itemStyle}
                        >
                            All Courses
                        </Link>

                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/catalog?category=${cat.slug}`}
                                onClick={() => setOpen(false)}
                                className="dropdown-link"
                                style={itemStyle}
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
