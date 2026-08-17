import Image from "next/image";

/** Cosmetic background for the lesson-player tabs: page glow, lavender blob, planet. */
export function LearnPageDecor({ showPlanet = true }: { showPlanet?: boolean }) {
  return (
    <>
      <DecorBackground />
      <DecorBlob />
      <DecorBottomFade />
      {showPlanet && <DecorPlanet />}
    </>
  );
}

/** Bottom-anchored white fade; pins to the section bottom so the decor blends into white at any content height. */
function DecorBottomFade() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-72 bg-gradient-to-b from-transparent to-white"
    />
  );
}

/** Full-bleed page glow (offsets the 80px sidebar); bottom 240px fade to transparent so long lessons blend into white. */
function DecorBackground() {
  const fade = "linear-gradient(to bottom, #000 calc(100% - 240px), transparent)";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 -z-20 overflow-hidden"
      style={{ left: "-160px", width: "calc(100vw + 160px)", height: "1572px" }}
    >
      <Image
        src="/backgrounds/learn-page-bg.png"
        alt=""
        width={2200}
        height={1572}
        priority={false}
        className="absolute left-1/2 top-0 h-auto min-w-full max-w-none -translate-x-1/2"
        style={{ maskImage: fade, WebkitMaskImage: fade }}
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
      className="pointer-events-none absolute -right-14 -bottom-14 -z-10 h-52 w-52 sm:-right-20 sm:-bottom-20 sm:h-72 sm:w-72 lg:-right-32 lg:-bottom-28 lg:h-[600px] lg:w-[600px] xl:h-[max(700px,33vw)] xl:w-[max(700px,33vw)]"
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
