import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}