import { RegisterForm } from "@/features/auth/ui/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex justify-center items-center h-screen flex-col gap-4">
      <section className="items-center text-center bg-gray-800 p-8 rounded-lg">
        <h1 className="">Реєстрація</h1>
        <p className="">Створіть обліковий запис, щоб продовжити</p>

        <RegisterForm />
      </section>
    </main>
  );
}
