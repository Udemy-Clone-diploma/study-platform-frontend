import Image from "next/image";

export function LoadingLogo() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="relative h-[72px] w-[220px] animate-[logo-pulse_1.6s_ease-in-out_infinite]"
    >
      <Image
        src="/logo/Nexo4u_logo3.svg"
        alt=""
        fill
        sizes="220px"
        priority
        className="object-contain"
      />
    </div>
  );
}
