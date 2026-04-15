import Link from "next/link";

export default function Home() {
  return (
    <main className="flex justify-center items-center h-screen flex-col gap-4">
      <header>
        <nav className="flex gap-4">
          <Link
            href="/register"
            className="text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            Dashboard
          </Link>
        </nav>
      </header>

      <h1>Home page</h1>
    </main>
  );
}
