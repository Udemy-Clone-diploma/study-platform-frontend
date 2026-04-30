"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/features/courses/model/types/category";

type Props = {
    categories: Category[];
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
        <div ref={ref} style={{ position: "relative" }}>
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
                        top: "calc(100% + 12px)",
                        left: 0,
                        background: "var(--color-bg)",
                        borderRadius: 16,
                        boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.12)",
                        minWidth: 220,
                        zIndex: 50,
                        padding: "8px 0",
                    }}
                >
                    <Link
                        href="/catalog"
                        onClick={() => setOpen(false)}
                        className="block px-5 py-3 transition-colors hover:bg-gray-50"
                        style={{
                            fontFamily: "var(--font-accent)",
                            fontSize: 16,
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                        }}
                    >
                        All Courses
                    </Link>

                    {categories.length > 0 && (
                        <div style={{ borderTop: "1px solid var(--color-border)", margin: "4px 0" }} />
                    )}

                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/catalog?category=${cat.slug}`}
                            onClick={() => setOpen(false)}
                            className="block px-5 py-3 transition-colors hover:bg-gray-50"
                            style={{
                                fontFamily: "var(--font-base)",
                                fontSize: 15,
                                color: "var(--color-text-subtle)",
                            }}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
