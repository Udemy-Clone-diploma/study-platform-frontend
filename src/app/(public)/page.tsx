import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold">Udemy Clone</h1>
          <p className="text-base text-slate-600">
            Welcome page with quick access to authentication, dashboard, and the course catalog.
          </p>
        </header>

        <nav className="flex flex-wrap gap-3">
          <Link
            href="/catalog"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Open catalog
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Register
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </main>
  );
}
