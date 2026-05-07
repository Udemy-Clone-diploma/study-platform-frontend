import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-bold text-gray-900">404</h1>
      <p className="text-xl text-gray-700">Сторінку не знайдено</p>
      <p className="text-sm text-gray-500">Перевірте адресу або поверніться на головну.</p>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
      >
        На головну
      </Link>
    </main>
  );
}
