import { LoginForm } from "@/features/auth/ui/LoginForm";

export default function LoginPage() {
  return (
    <section className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('/auth/login-bg.webp')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
      <div className="absolute left-[-4rem] top-[18%] h-56 w-56 rounded-full bg-[#b3a8ff]/35 blur-[110px] animate-[auth-drift_18s_ease-in-out_infinite]" />
      <div className="absolute left-[18%] top-[32%] h-72 w-72 rounded-full bg-[#ffb6ae]/30 blur-[120px] animate-[auth-drift_16s_ease-in-out_infinite]" />
      <div className="absolute right-[-2rem] top-[38%] h-52 w-52 rounded-full bg-[#a99cff]/30 blur-[110px] animate-[auth-drift_20s_ease-in-out_infinite]" />
      <div className="absolute bottom-[8%] left-[30%] h-64 w-64 rounded-full bg-[#cdbaff]/22 blur-[130px] animate-[auth-drift_22s_ease-in-out_infinite]" />

      <div className="relative z-10 w-full max-w-[760px] animate-[auth-appear_700ms_ease-out_both]">
        <LoginForm />
      </div>
    </section>
  );
}
