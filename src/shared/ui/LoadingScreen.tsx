import Image from "next/image";
import { LoadingLogo } from "@/shared/ui/LoadingLogo";

/** Full-bleed branded loading state. The caller positions it (fixed for the navigation
 *  overlay, in-flow for a route-level loading.tsx) so both paths look identical. */
export function LoadingScreen({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{ background: "var(--gradient-brand)" }}
    >
      <Image
        src="/backgrounds/learn-page-bg.png"
        alt=""
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />
      <LoadingLogo />
    </div>
  );
}
