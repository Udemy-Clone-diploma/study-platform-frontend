 import Link from "next/link";

 export default function Home() {
  return (
    <main className="flex justify-center items-center h-screen flex-col gap-4">
        <h1>Home page</h1>
      
        <Link
            href="/register"
            className="w-lg bg-amber-50 text-black px-4 py-2 rounded inline-block"
        >
            Register
        </Link>
    </main>

  );
}
