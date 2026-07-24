export default function AuthenticationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/auth/login-bg.webp')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] animate-[auth-appear_700ms_ease-out_both]">
        {children}
      </div>
    </main>
  );
}
