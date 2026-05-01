"use client";

import Image from "next/image";
import { useState } from "react";

export function WishlistButton() {
    const [liked, setLiked] = useState(false);

    return (
        <button
            aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => {
                e.preventDefault();
                setLiked((prev) => !prev);
            }}
            style={{
                width: "2.08vw",
                height: "2.08vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
            }}
        >
            <Image
                src={liked ? "/icons/heart fill.png" : "/icons/heart.png"}
                alt=""
                width={28}
                height={25}
                style={{ width: "1.458vw", height: "auto" }}
            />
        </button>
    );
}
