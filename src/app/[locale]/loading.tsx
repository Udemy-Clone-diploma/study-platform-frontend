import Image from "next/image";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { LoadingLogo } from "@/shared/ui/LoadingLogo";

export default function Loading() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <LoadingBackground />
      <Header />
      <main className="relative flex flex-1 items-center justify-center px-6">
        <LoadingLogo />
      </main>
      <Footer />
    </div>
  );
}

function LoadingBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Image src="/backgrounds/learn-page-bg.png" alt="" fill sizes="100vw" className="object-cover" />
    </div>
  );
}
