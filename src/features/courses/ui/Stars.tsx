import Image from "next/image";

type Props = { rating: string };

export function Stars({ rating }: Props) {
    const filled = Math.min(Math.max(Math.round(Number(rating)), 0), 5);
    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Image
                    key={i}
                    src={i < filled ? "/icons/star fill.png" : "/icons/star.png"}
                    alt=""
                    width={36}
                    height={36}
                    style={{ width: "1.875vw", height: "1.875vw", flexShrink: 0 }}
                />
            ))}
        </div>
    );
}
