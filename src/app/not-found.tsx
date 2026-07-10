import Image from "next/image";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { AccentButton } from "@/shared/ui/AccentButton";

const TITLE_GRADIENT = "linear-gradient(180deg, #4669DF 34%, rgba(70, 105, 223, 0) 100%)";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <NotFoundBackground />
      <Header />
      <main className="relative flex flex-1 flex-col items-center justify-center gap-14 px-6 text-center">
        <span
          className="bg-clip-text font-(family-name:--font-base) leading-[0.8] text-transparent"
          style={{
            fontSize: "clamp(7rem, 28vw, 25rem)",
            backgroundImage: TITLE_GRADIENT,
            WebkitBackgroundClip: "text",
          }}
        >
          404
        </span>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-2xl font-semibold text-(--color-text-primary)">Page not found</h1>
            <p className="text-(--color-text-secondary)">
              {"We couldn't find the page you are looking for"}
            </p>
          </div>
          <AccentButton href="/" size="md" className="tracking-widest">
            Back home
          </AccentButton>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function NotFoundBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Image
        src="/backgrounds/learn-page-bg.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <Glow color="#FFF4DA" transform="translate(-50%, -50%) rotate(45deg)" />
      <Glow color="#A7BAFA" transform="translate(calc(-50% - 80px), calc(-50% + 90px)) rotate(45deg)" />
    </div>
  );
}

function Glow({ color, transform }: { color: string; transform: string }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 rounded-full opacity-50"
      style={{
        width: "1367px",
        height: "1001px",
        backgroundColor: color,
        filter: "blur(140px)",
        transform,
      }}
    />
  );
}
