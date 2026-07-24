import { notFound } from "next/navigation";

// Catches any path that doesn't match a real route anywhere in the app (e.g. a typo'd
// admin URL). Without this, Next renders the root not-found.tsx directly under
// RootLayout with no matched route segments, so the (public) layout's Header/Footer
// never mount. Forcing the match here nests the 404 inside (public)/layout.tsx instead.
export default function CatchAll() {
  notFound();
}
