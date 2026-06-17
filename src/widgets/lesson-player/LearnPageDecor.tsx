import Image from "next/image";

/** Cosmetic background for the lesson-player tabs: page glow, lavender blob, planet. */
export function LearnPageDecor({ showPlanet = true }: { showPlanet?: boolean }) {
  return (
    <>
      <DecorBackground />
      <DecorBlob />
      {showPlanet && <DecorPlanet />}
    </>
  );
}

/** Full-bleed page glow, centered on the viewport (offsets the 80px sidebar). */
function DecorBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 -z-20 overflow-hidden"
      style={{ left: "-80px", width: "100vw", height: "1572px" }}
    >
      <Image
        src="/backgrounds/learn-page-bg.png"
        alt=""
        width={2200}
        height={1572}
        priority={false}
        className="absolute left-1/2 top-0 h-auto min-w-full max-w-none -translate-x-1/2"
      />
    </div>
  );
}

/** Diagonal lavender glow, mix-blend-lighten over the background. */
function DecorBlob() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -z-10 hidden lg:block"
      style={{
        top: "405px",
        left: "-239px",
        width: "1418.94px",
        height: "953.80px",
        transformOrigin: "top left",
        transform: "rotate(-10.65deg)",
        mixBlendMode: "lighten",
      }}
    >
      <Image
        src="/backgrounds/learn-bg-glow.png"
        alt=""
        fill
        sizes="1420px"
        className="object-cover"
        priority={false}
      />
    </div>
  );
}

/** 3D planet bottom-right. */
function DecorPlanet() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-32 -bottom-28 -z-10 hidden h-[600px] w-[600px] lg:block xl:h-[max(700px,33vw)] xl:w-[max(700px,33vw)]"
    >
      <Image
        src="/backgrounds/learn-planet.png"
        alt=""
        fill
        sizes="(min-width: 1280px) 33vw, 600px"
        className="object-contain"
        priority={false}
      />
    </div>
  );
}
