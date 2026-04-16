import { LoginForm } from "@/features/auth/ui/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex justify-center items-center h-screen flex-col gap-4">
      <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
        <h1 className="">Вхід</h1>
        <p className="">Введіть свої облікові дані, щоб увійти</p>

        <LoginForm />
      </section>
    </main>
  );
}
