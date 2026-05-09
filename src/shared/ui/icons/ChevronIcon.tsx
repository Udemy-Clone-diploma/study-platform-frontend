import { ChevronRight } from "lucide-react";

interface Props {
  className?: string;
  direction?: "left" | "right";
}

/** Pagination chevron. Flip horizontally for the left arrow. */
export function ChevronIcon({ className, direction = "right" }: Props) {
  return (
    <ChevronRight
      aria-hidden="true"
      strokeWidth={2}
      className={className}
      style={direction === "left" ? { transform: "scaleX(-1)" } : undefined}
    />
  );
}
