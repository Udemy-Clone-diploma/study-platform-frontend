export default function AuthenticationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#eef1ff] via-white to-[#ffe9dd]">
            {children}
        </main>
    );
}