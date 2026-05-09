import { Star } from "lucide-react";

type Props = { rating: string };

export function Stars({ rating }: Props) {
  const filled = Math.min(Math.max(Math.round(Number(rating)), 0), 5);

  return (
    <div role="img" aria-label={`${filled} out of 5 stars`} className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
          fill={i < filled ? "var(--color-gold)" : "transparent"}
          stroke="var(--color-gold)"
          strokeWidth={1.75}
        />
      ))}
    </div>
  );
}
